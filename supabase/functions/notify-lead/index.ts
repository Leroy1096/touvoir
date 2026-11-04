// TOUVOIR — Notification e-mail automatique des demandes du site
// Déployée dans Supabase Edge Functions sous le slug `notify-lead`.
//
// Sécurité (audit du 03/11/2026) :
// - la fonction ne fait plus confiance au sujet / texte envoyé par le navigateur ;
// - elle vérifie que la référence correspond à une demande récente et au statut
//   `nouveau` dans Supabase, puis reconstruit l'e-mail depuis la base ;
// - un journal `notification_logs` est réservé avant l'envoi et un index
//   unique empêche l'envoi en double pour une même demande ;
// - plafond global de notifications par heure pour limiter les abus.
//
// Secrets attendus (Supabase → Edge Functions → Secrets) :
// - RESEND_API_KEY      : clé API Resend (obligatoire pour envoyer)
// - LEAD_NOTIFY_EMAIL   : destinataire (défaut touvouci@gmail.com)
// - LEAD_FROM_EMAIL     : expéditeur (défaut onboarding@resend.dev)
// - LEAD_ALLOWED_ORIGINS: origines navigateur supplémentaires, séparées par
//                         des virgules (optionnel)

type LeadType = 'devis' | 'panne' | 'prix';
type LeadRow = Record<string, unknown>;

const MAX_BODY_BYTES = 32768;
const MAX_LEAD_AGE_MS = 30 * 60 * 1000;
const HOURLY_NOTIFICATION_LIMIT = 60;

const LEADS: Record<LeadType, { table: string; prefix: string; template: string; select: string }> = {
  devis: {
    table: 'quote_requests',
    prefix: 'DEV',
    template: 'nouvelle_demande_devis_site',
    select: 'id,reference,created_at,status,customer_name,phone,email,service_slug,service_label,selected_pack,selected_product,city,message,page_url',
  },
  panne: {
    table: 'fault_reports',
    prefix: 'PAN',
    template: 'nouvelle_panne_site',
    select: 'id,reference,created_at,status,customer_name,phone,email,city,district,customer_situation,equipment_type,cameras_count,problem_since_label,urgency_label,urgency_level,availability_label,description,page_url',
  },
  prix: {
    table: 'price_requests',
    prefix: 'PRX',
    template: 'nouvelle_demande_prix_site',
    select: 'id,reference,created_at,status,customer_name,phone,email,product_reference,product_name,quantity,installation_option,installation_label,message,page_url',
  },
};

function clean(value: unknown, max = 2000): string {
  return String(value ?? '').trim().slice(0, max);
}

function cleanLine(value: unknown, max = 500): string {
  return clean(value, max).replace(/[\r\n]+/g, ' ');
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  const defaults = new Set([
    'https://touvoir.vercel.app',
    'https://www.touvoir.ci',
    'https://touvoir.ci',
  ]);
  const extra = clean(Deno.env.get('LEAD_ALLOWED_ORIGINS'), 1000)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (defaults.has(origin) || extra.includes(origin)) return true;
  if (/^https:\/\/8000-[a-z0-9-]+\.e2b\.app$/i.test(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'https://touvoir.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function serviceConfig(): { url: string; key: string } {
  return {
    url: clean(Deno.env.get('SUPABASE_URL'), 500).replace(/\/$/, ''),
    key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  };
}

async function rest(path: string, init: RequestInit = {}): Promise<{ res: Response; data: unknown }> {
  const { url, key } = serviceConfig();
  if (!url || !key) throw new Error('supabase_service_non_configure');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch (_err) { data = text; }
  return { res, data };
}

async function findLead(type: LeadType, reference: string): Promise<LeadRow | null> {
  const def = LEADS[type];
  const delays = [0, 700, 1800];
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const query = `${def.table}?select=${encodeURIComponent(def.select)}&reference=eq.${encodeURIComponent(reference)}&limit=1`;
    const { res, data } = await rest(query);
    if (!res.ok) throw new Error(`lecture_demande_http_${res.status}`);
    if (Array.isArray(data) && data.length) return data[0] as LeadRow;
  }
  return null;
}

async function hourlyLimitReached(): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const query = `notification_logs?select=id&entity_type=eq.site_request&channel=eq.email&created_at=gte.${encodeURIComponent(since)}&limit=${HOURLY_NOTIFICATION_LIMIT}`;
  const { res, data } = await rest(query);
  if (!res.ok) throw new Error(`lecture_journal_http_${res.status}`);
  return Array.isArray(data) && data.length >= HOURLY_NOTIFICATION_LIMIT;
}

async function reserveLog(entry: Record<string, unknown>): Promise<{ id: string | null; duplicate: boolean }> {
  const { res, data } = await rest('notification_logs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(entry),
  });
  if (res.ok && Array.isArray(data) && data.length) {
    return { id: clean((data[0] as LeadRow).id, 80), duplicate: false };
  }
  if (res.status === 409) return { id: null, duplicate: true };
  throw new Error(`journal_http_${res.status}`);
}

async function updateLog(id: string, patch: Record<string, unknown>): Promise<void> {
  if (!id) return;
  try {
    await rest(`notification_logs?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
  } catch (_err) {
    // L'e-mail prime ; un échec de journalisation ne doit pas masquer son statut.
  }
}

function value(row: LeadRow, key: string, max = 4000): string {
  return clean(row[key], max);
}

function addLine(lines: string[], label: string, fieldValue: string): void {
  if (fieldValue) lines.push(`${label} : ${fieldValue}`);
}

function buildEmail(type: LeadType, row: LeadRow): { subject: string; text: string; replyTo: string } {
  const reference = cleanLine(row.reference, 80);
  const lines: string[] = [];
  let subject = '';

  if (type === 'devis') {
    subject = `[TOUVOIR] Nouvelle demande de devis ${reference}`;
    lines.push('NOUVELLE DEMANDE DE DEVIS — TOUVOIR', `Référence : ${reference}`, '', 'CLIENT');
    addLine(lines, 'Nom', value(row, 'customer_name', 200));
    addLine(lines, 'Téléphone / WhatsApp', value(row, 'phone', 80));
    addLine(lines, 'E-mail', value(row, 'email', 200));
    lines.push('', 'DEMANDE');
    addLine(lines, 'Type de service', value(row, 'service_label', 200));
    addLine(lines, 'Pack sélectionné', value(row, 'selected_pack', 300));
    addLine(lines, 'Produit sélectionné', value(row, 'selected_product', 300));
    addLine(lines, 'Ville', value(row, 'city', 200));
    lines.push('', 'Description du besoin :', value(row, 'message', 7000));
  } else if (type === 'panne') {
    const city = cleanLine(row.city, 160) || 'Ville non précisée';
    const urgency = cleanLine(row.urgency_label, 160) || 'Urgence non précisée';
    subject = `[TOUVOIR][PANNE] ${reference} — ${city} — ${urgency}`;
    lines.push('NOUVEAU SIGNALEMENT DE PANNE — TOUVOIR', `Référence : ${reference}`, '', 'CLIENT');
    addLine(lines, 'Nom', value(row, 'customer_name', 200));
    addLine(lines, 'Téléphone / WhatsApp', value(row, 'phone', 80));
    addLine(lines, 'E-mail', value(row, 'email', 200));
    lines.push('', 'LOCALISATION');
    addLine(lines, 'Ville', value(row, 'city', 200));
    addLine(lines, 'Quartier / adresse du site', value(row, 'district', 300));
    lines.push('', 'PANNE SIGNALÉE');
    addLine(lines, 'Type de client', value(row, 'customer_situation', 200));
    addLine(lines, 'Équipement concerné', value(row, 'equipment_type', 200));
    addLine(lines, 'Nombre de caméras', value(row, 'cameras_count', 40));
    addLine(lines, 'Panne constatée depuis', value(row, 'problem_since_label', 200));
    addLine(lines, 'Niveau d’urgence', value(row, 'urgency_label', 200));
    addLine(lines, 'Disponibilité pour intervention', value(row, 'availability_label', 200));
    lines.push('', 'Description :', value(row, 'description', 7000));
  } else {
    const product = cleanLine(row.product_name, 220) || 'Produit TOUVOIR';
    subject = `[TOUVOIR] Nouvelle demande de prix ${reference} — ${product}`;
    lines.push('NOUVELLE DEMANDE DE PRIX — TOUVOIR', `Référence : ${reference}`, '', 'CLIENT');
    addLine(lines, 'Nom', value(row, 'customer_name', 200));
    addLine(lines, 'Téléphone / WhatsApp', value(row, 'phone', 80));
    addLine(lines, 'E-mail', value(row, 'email', 200));
    lines.push('', 'PRODUIT');
    addLine(lines, 'Produit', product);
    addLine(lines, 'Référence produit', value(row, 'product_reference', 200));
    addLine(lines, 'Quantité souhaitée', value(row, 'quantity', 40));
    addLine(lines, 'Installation', value(row, 'installation_label', 200));
    if (value(row, 'message', 4000)) lines.push('', 'Message :', value(row, 'message', 4000));
  }

  addLine(lines, 'Page du site', value(row, 'page_url', 700));
  const replyTo = value(row, 'email', 200);
  return {
    subject: cleanLine(subject, 240),
    text: lines.join('\n'),
    replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo) ? replyTo : '',
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { ok: false, error: 'method_not_allowed' }, 405);

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json(req, { ok: false, error: 'requete_trop_volumineuse' }, 413);
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw || '{}') as Record<string, unknown>;
  } catch (_err) {
    return json(req, { ok: false, error: 'json_invalide' }, 400);
  }

  // Champ piège anti-spam : s'il est rempli, on ignore silencieusement.
  if (clean(body.website, 200)) return json(req, { ok: true, ignored: true });

  const typeText = clean(body.type, 30);
  if (typeText !== 'devis' && typeText !== 'panne' && typeText !== 'prix') {
    return json(req, { ok: false, error: 'type_demande_invalide' }, 422);
  }
  const type = typeText as LeadType;
  const reference = clean(body.reference, 80).toUpperCase();
  const match = reference.match(/^TV-(DEV|PAN|PRX)-\d{8}(?:-\d{4}-[A-Z0-9]{4}|-[A-F0-9]{6})$/);
  if (!match || match[1] !== LEADS[type].prefix) {
    return json(req, { ok: false, error: 'demande_invalide' }, 422);
  }

  let lead: LeadRow | null;
  try {
    lead = await findLead(type, reference);
  } catch (_err) {
    return json(req, { ok: false, error: 'verification_demande_indisponible' }, 503);
  }
  if (!lead) return json(req, { ok: false, error: 'demande_introuvable' }, 404);
  if (clean(lead.status, 40) !== 'nouveau') {
    return json(req, { ok: false, error: 'demande_non_notifiable' }, 409);
  }

  const createdAt = Date.parse(clean(lead.created_at, 80));
  const age = Date.now() - createdAt;
  if (!Number.isFinite(createdAt) || age < -5 * 60 * 1000 || age > MAX_LEAD_AGE_MS) {
    return json(req, { ok: false, error: 'demande_expiree' }, 409);
  }

  try {
    if (await hourlyLimitReached()) {
      return json(req, { ok: false, error: 'limite_notifications_atteinte' }, 429);
    }
  } catch (_err) {
    return json(req, { ok: false, error: 'verification_limite_indisponible' }, 503);
  }

  const notifyEmail = cleanLine(Deno.env.get('LEAD_NOTIFY_EMAIL'), 160) || 'touvoirci@gmail.com';
  const fromEmail = cleanLine(Deno.env.get('LEAD_FROM_EMAIL'), 220) || 'TOUVOIR <onboarding@resend.dev>';
  const resendKey = Deno.env.get('RESEND_API_KEY') || '';
  const built = buildEmail(type, lead);
  const payloadLog = {
    reference,
    type,
    name: cleanLine(lead.customer_name, 200),
    phone: cleanLine(lead.phone, 80),
    page_url: cleanLine(lead.page_url, 700),
  };

  let logId: string | null = null;
  try {
    const reserved = await reserveLog({
      entity_type: 'site_request',
      entity_id: clean(lead.id, 80),
      channel: 'email',
      recipient: notifyEmail,
      template_name: LEADS[type].template,
      status: 'pret',
      payload: payloadLog,
    });
    if (reserved.duplicate) return json(req, { ok: true, provider: 'resend', duplicate: true });
    logId = reserved.id;
    if (!logId) throw new Error('journal_sans_id');
  } catch (_err) {
    return json(req, { ok: false, error: 'journal_notification_indisponible' }, 503);
  }

  if (!resendKey) {
    await updateLog(logId, {
      status: 'echoue',
      error_message: 'provider_not_configured: RESEND_API_KEY manquante',
    });
    return json(req, { ok: false, error: 'provider_not_configured' }, 501);
  }

  const emailBody: Record<string, unknown> = {
    from: fromEmail,
    to: [notifyEmail],
    subject: built.subject,
    text: built.text,
  };
  if (built.replyTo) emailBody.reply_to = built.replyTo;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok) {
      await updateLog(logId, {
        status: 'echoue',
        error_message: clean(JSON.stringify(data), 500) || `HTTP ${res.status}`,
      });
      return json(req, { ok: false, error: 'envoi_email_echoue' }, 502);
    }

    await updateLog(logId, {
      status: 'envoye',
      provider_message_id: clean(data.id, 120),
      sent_at: new Date().toISOString(),
      error_message: null,
    });
    return json(req, { ok: true, provider: 'resend', id: data.id || null });
  } catch (err) {
    await updateLog(logId, {
      status: 'echoue',
      error_message: clean(err instanceof Error ? err.message : String(err), 500),
    });
    return json(req, { ok: false, error: 'envoi_email_echoue' }, 502);
  }
});
