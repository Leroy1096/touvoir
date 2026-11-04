/* ============================================================
   TOUVOIR — Envoi automatique des demandes par e-mail

   TouvoirEmail.send({
     type: 'devis' | 'prix' | 'panne',
     reference: 'TV-...',
     subject: '...',
     text: 'récapitulatif complet',
     replyTo: 'client@exemple.com',
     name: 'Nom client',
     phone: '+225 ...',
     fields: { Nom: '...', Ville: '...', ... }
   })

   Les canaux sont essayés dans l’ordre défini dans
   email-config.js. Un échec e-mail ne bloque jamais le
   visiteur : la demande reste enregistrée dans Supabase.
   ============================================================ */
(function(){
  'use strict';

  const cfg = window.TOUVOIR_EMAIL || {};
  const sb = window.TOUVOIR_SUPABASE || {};

  function clean(value, max){
    return String(value == null ? '' : value).trim().slice(0, max || 2000);
  }

  async function fetchWithTimeout(url, options, timeoutMs){
    if(!window.fetch) throw new Error('fetch_indisponible');
    if(!window.AbortController) return fetch(url, options);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 12000);
    try{
      return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson(res){
    try{ return await res.json(); }catch(e){ return null; }
  }

  async function sendViaSupabaseFunction(payload){
    const fnCfg = cfg.supabaseFunction || {};
    if(!fnCfg.enabled || !sb.url || !sb.publishableKey){
      return { ok:false, skipped:true, provider:'supabase-edge' };
    }
    const base = String(sb.url).replace(/\/$/, '');
    const url = base + '/functions/v1/' + encodeURIComponent(fnCfg.name || 'notify-lead');
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'apikey': sb.publishableKey,
        'Authorization': 'Bearer ' + sb.publishableKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }, 12000);
    const data = await readJson(res);
    if(res.ok && data && data.ok){
      return { ok:true, provider:'supabase-edge', id:data.id || null };
    }
    return {
      ok:false,
      provider:'supabase-edge',
      status:res.status,
      error:(data && (data.error || data.message)) || res.statusText || 'reponse_invalide'
    };
  }

  async function sendViaWeb3Forms(payload){
    const w = cfg.web3forms || {};
    const accessKey = clean(w.accessKey, 120);
    if(!w.enabled || !accessKey){
      return { ok:false, skipped:true, provider:'web3forms' };
    }
    const body = Object.assign({}, payload.fields || {}, {
      access_key: accessKey,
      subject: payload.subject,
      from_name: 'Site TOUVOIR',
      name: payload.name || 'Visiteur du site TOUVOIR',
      email: payload.replyTo || cfg.notifyEmail || 'touvoirci@gmail.com',
      message: payload.text,
      botcheck: false
    });
    const res = await fetchWithTimeout('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }, 12000);
    const data = await readJson(res);
    if(res.ok && data && data.success){
      return { ok:true, provider:'web3forms' };
    }
    return { ok:false, provider:'web3forms', status:res.status, error:(data && data.message) || res.statusText };
  }

  async function sendViaFormSubmit(payload){
    const f = cfg.formsubmit || {};
    if(!f.enabled || !f.endpoint){
      return { ok:false, skipped:true, provider:'formsubmit' };
    }
    const body = Object.assign({}, payload.fields || {}, {
      _subject: payload.subject,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      name: payload.name || 'Visiteur du site TOUVOIR',
      email: payload.replyTo || '',
      message: payload.text
    });
    if(payload.replyTo) body._replyto = payload.replyTo;
    const res = await fetchWithTimeout(f.endpoint, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }, 12000);
    const data = await readJson(res);
    const success = data && (data.success === true || data.success === 'true');
    if(res.ok && success){
      return { ok:true, provider:'formsubmit' };
    }
    return { ok:false, provider:'formsubmit', status:res.status, error:(data && data.message) || res.statusText };
  }

  async function send(input){
    if(!cfg.enabled) return { ok:false, skipped:true, error:'email_desactive' };
    const payload = {
      type: clean(input && input.type, 30) || 'demande',
      reference: clean(input && input.reference, 80),
      subject: clean(input && input.subject, 220) || '[TOUVOIR] Nouvelle demande du site',
      text: clean(input && input.text, 12000),
      replyTo: clean(input && input.replyTo, 160),
      name: clean(input && input.name, 160),
      phone: clean(input && input.phone, 80),
      fields: (input && input.fields) || {},
      page_url: window.location ? window.location.href : '',
      sent_at: new Date().toISOString()
    };

    const providers = [sendViaSupabaseFunction, sendViaWeb3Forms, sendViaFormSubmit];
    const attempts = [];
    for(const fn of providers){
      try{
        const res = await fn(payload);
        attempts.push(res);
        if(res && res.ok) return Object.assign({}, res, { attempts });
      }catch(err){
        attempts.push({ ok:false, error:String((err && err.message) || err) });
      }
    }
    return { ok:false, error:'aucun_canal_email_disponible', attempts };
  }

  window.TouvoirEmail = {
    send,
    notifyEmail: cfg.notifyEmail || 'touvoirci@gmail.com',
    isEnabled: () => !!cfg.enabled
  };
})();
