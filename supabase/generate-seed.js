#!/usr/bin/env node
/*
 * Génère la migration de données initiales TOUVOIR depuis assets/js/data.js
 * Usage : node supabase/generate-seed.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'assets/js/data.js');
const outPath = path.join(__dirname, 'migrations/202611030002_touvoir_seed.sql');

const code = fs.readFileSync(dataPath, 'utf8');
const data = vm.runInNewContext(
  code + '\n;({ PACKS, SERVICES, PRODUCT_CATS, PRODUCTS, PROJECT_CATS, PROJECTS });',
  {},
  { filename: dataPath }
);

const q = (v) => {
  if (v === null || v === undefined || v === '') return 'null';
  return "'" + String(v).replaceAll("'", "''") + "'";
};
const json = (v) => q(JSON.stringify(v)) + '::jsonb';
const bool = (v) => (v ? 'true' : 'false');
const int = (v) => (v === null || v === undefined ? 'null' : String(parseInt(v, 10)));

const cities = [
  ['Abidjan', "District autonome d'Abidjan", 10],
  ['Bouaké', 'Vallée du Bandama', 20],
  ['Yamoussoukro', 'District autonome de Yamoussoukro', 30],
  ['San Pedro', 'Bas-Sassandra', 40],
  ['Korhogo', 'district des Savanes', 50],
  ['Daloa', 'Sassandra-Marahoué', 60],
  ['Man', 'Montagnes', 70],
  ['Abengourou', 'Indénié-Djuablin', 80],
  ['Autre ville', "Côte d'Ivoire", 999],
];

const settings = [
  {
    key: 'business_identity',
    value: { name: 'TOUVOIR', slogan: 'Votre sécurité, notre priorité.', email: 'touvoirci@gmail.com' },
    description: 'Identité publique de l’entreprise',
    is_public: true,
  },
  {
    key: 'contact_channels',
    value: {
      email: 'touvoirci@gmail.com',
      phone_display: '+225 01 40 81 04 15',
      whatsapp_number: '2250140810415',
      address_label: "Rue des Banques, Quartier Cité, San Pedro, Côte d’Ivoire",
      headquarters_city: 'San Pedro',
      headquarters_district: 'Quartier Cité',
      headquarters_street: 'Rue des Banques',
      note: 'Coordonnées confirmées : numéro d’information/WhatsApp et siège à San Pedro.',
    },
    description: 'Coordonnées affichées sur le site (confirmées)',
    is_public: true,
  },
  {
    key: 'social_links',
    value: { facebook: '', instagram: '', tiktok: '', linkedin: '', youtube: '' },
    description: 'URLs des réseaux sociaux à compléter',
    is_public: true,
  },
  {
    key: 'business_hours',
    value: {
      monday_saturday: '08h00 – 18h00',
      sunday: 'Fermé',
      emergency: 'Assistance technique 24/7 pour les professionnels',
    },
    description: 'Horaires publics affichés sur le site',
    is_public: true,
  },
  {
    key: 'request_workflow',
    value: { quote_prefix: 'TV-DEV', price_prefix: 'TV-PRX', fault_prefix: 'TV-PAN', primary_notification: 'email', fallback_channel: 'whatsapp' },
    description: 'Préfixes de références et canaux de notification des formulaires',
    is_public: false,
  },
  {
    key: 'email_notifications',
    value: {
      enabled: true,
      notify_email: 'touvoirci@gmail.com',
      edge_function: 'notify-lead',
      provider_priority: ['supabase-edge-resend', 'web3forms', 'formsubmit'],
      status: 'actif',
      active_provider: 'supabase-edge-resend',
      activated_at: '2026-11-03',
    },
    description: 'Notification e-mail automatique active via Resend (Supabase Edge Function notify-lead)',
    is_public: false,
  },
];

const testimonials = [
  {
    author_name: 'Kouadio A.',
    author_role: 'Gérant de supermarché',
    city: 'Daloa',
    quote: "Depuis l’installation des 24 caméras, la démarque a chuté de plus de moitié dans mon magasin. Travail propre, équipe ponctuelle, et je surveille mes caisses depuis mon téléphone.",
  },
  {
    author_name: 'Fatou Ouattara',
    author_role: 'Propriétaire de résidence',
    city: 'Yamoussoukro',
    quote: "Installation discrète réalisée en une seule journée à la maison. Je reçois une alerte dès qu’un mouvement est détecté la nuit. Je me sens enfin sereine, même en déplacement.",
  },
  {
    author_name: 'Jean-Marc Koné',
    author_role: 'Responsable logistique',
    city: 'Man',
    quote: "Ils ont sécurisé notre entrepôt de 3 000 m² avec levée de doute vidéo. Service après-vente très réactif : intervention en moins de 24 h quand nous en avons eu besoin.",
  },
  {
    author_name: 'Mireille T.',
    author_role: 'Directrice d’établissement scolaire',
    city: 'Man',
    quote: "Une équipe qui conseille sans vendre du superflu. Les accès de notre établissement sont contrôlés et les parents d’élèves sont rassurés. Je recommande vivement.",
  },
];

const faqs = [
  [
    'Combien coûte une installation de vidéosurveillance ?',
    "Nos packs démarrent à 200 000 FCFA pour 4 caméras (tarif indicatif à revoir), puis le prix dépend du nombre de caméras, de la technologie (HD, IP, Wi-Fi), de la durée d’enregistrement souhaitée et de la configuration de vos locaux. C’est pourquoi nous commençons toujours par une <strong>étude de site</strong>, suivie d’un devis détaillé sous 24 h — sans aucun engagement de votre part.",
  ],
  [
    'Puis-je voir mes caméras depuis mon téléphone ?',
    "Oui. Tous nos systèmes incluent la visualisation à distance gratuite sur smartphone (iOS et Android), tablette et ordinateur : images en direct, relecture des enregistrements et alertes instantanées en cas de détection de mouvement. Nous configurons tout sur vos appareils le jour de l’installation.",
  ],
  [
    'Pendant combien de temps les images sont-elles conservées ?',
    "Cela dépend de la capacité du disque dur et du nombre de caméras. À titre d’exemple, un disque de 2 To conserve environ <strong>30 jours d’images pour 4 caméras</strong> en enregistrement sur détection. Nous dimensionnons le stockage selon vos obligations et vos habitudes, de 15 à 90 jours.",
  ],
  [
    'Faut-il une connexion internet pour que les caméras fonctionnent ?',
    "Non : l’enregistrement se fait localement sur le disque dur de l’enregistreur, même sans internet. La connexion n’est nécessaire que pour la consultation à distance depuis votre téléphone. En cas de coupure, le système continue d’enregistrer normalement.",
  ],
  [
    'Intervenez-vous en dehors de San Pedro ?',
    "Oui, depuis notre siège de San Pedro (Quartier Cité, Rue des Banques), nous réalisons des installations dans toute la Côte d’Ivoire : Abidjan, Bouaké, Yamoussoukro, Daloa, Korhogo, Man et Yamoussoukro… Les frais de déplacement sont simplement intégrés au devis, de façon transparente. Le suivi peut ensuite se faire à distance dans la plupart des cas.",
  ],
  [
    'Comment signaler une panne sur mon installation ?',
    "Utilisez notre <a href=\"panne.html\"><strong>espace dédié aux pannes</strong></a> : indiquez votre nom, votre téléphone, la <strong>ville</strong> et le quartier du site, l’équipement concerné, ce qui ne fonctionne plus et le niveau d’urgence. Nous savons immédiatement <strong>qui vous êtes, quel est le problème et où intervenir</strong>.",
  ],
  [
    'Quelle garantie et quel service après-vente proposez-vous ?',
    "Le matériel est garanti jusqu’à <strong>2 ans</strong> (garantie constructeur) et notre installation est garantie <strong>12 mois</strong>. Notre service après-vente, basé à San Pedro, Côte d’Ivoire, intervient sous 24 à 48 h. Nous proposons également des contrats de maintenance annuelle avec visites préventives et astreinte 7j/7 pour les professionnels.",
  ],
];

const lines = [];
lines.push('-- TOUVOIR — Données initiales générées depuis assets/js/data.js');
lines.push('-- Idempotent : peut être relancé sans créer de doublons sur les clés naturelles.');
lines.push('');

lines.push('-- Paramètres du site');
for (const s of settings) {
  lines.push(`insert into public.site_settings (key, value, description, is_public) values (${q(s.key)}, ${json(s.value)}, ${q(s.description)}, ${bool(s.is_public)})\non conflict (key) do update set value = excluded.value, description = excluded.description, is_public = excluded.is_public, updated_at = now();`);
}
lines.push('');

lines.push('-- Villes d’intervention');
for (const [name, region, sort] of cities) {
  lines.push(`insert into public.cities (name, region, sort_order) values (${q(name)}, ${q(region)}, ${sort})\non conflict (name) do update set region = excluded.region, sort_order = excluded.sort_order, is_active = true, updated_at = now();`);
}
lines.push('');

lines.push('-- Services');
data.SERVICES.forEach((s, i) => {
  lines.push(`insert into public.services (slug, title, short_description, long_description, icon_name, image_path, includes, ideal_for, duration_label, is_published, sort_order)\nvalues (${q(s.slug)}, ${q(s.title)}, ${q(s.short)}, ${q(s.long)}, ${q(s.icon)}, ${q(s.img)}, ${json(s.includes || [])}, ${q(s.ideal)}, ${q(s.duree)}, true, ${(i + 1) * 10})\non conflict (slug) do update set title = excluded.title, short_description = excluded.short_description, long_description = excluded.long_description, icon_name = excluded.icon_name, image_path = excluded.image_path, includes = excluded.includes, ideal_for = excluded.ideal_for, duration_label = excluded.duration_label, is_published = true, sort_order = excluded.sort_order, updated_at = now();`);
});
lines.push('');

lines.push('-- Catégories produits');
Object.entries(data.PRODUCT_CATS).forEach(([slug, label], i) => {
  lines.push(`insert into public.product_categories (slug, label, sort_order) values (${q(slug)}, ${q(label)}, ${(i + 1) * 10})\non conflict (slug) do update set label = excluded.label, sort_order = excluded.sort_order, updated_at = now();`);
});
lines.push('');

lines.push('-- Produits');
data.PRODUCTS.forEach((p, i) => {
  lines.push(`insert into public.products (legacy_id, reference, name, category_slug, image_path, badge_label, badge_class, specs, is_published, sort_order)\nvalues (${int(p.id)}, ${q(p.ref)}, ${q(p.name)}, ${q(p.cat)}, ${q(p.img)}, ${q(p.badge ? p.badge.t : null)}, ${q(p.badge ? p.badge.c : null)}, ${json(p.specs || [])}, true, ${(i + 1) * 10})\non conflict (reference) do update set legacy_id = excluded.legacy_id, name = excluded.name, category_slug = excluded.category_slug, image_path = excluded.image_path, badge_label = excluded.badge_label, badge_class = excluded.badge_class, specs = excluded.specs, is_published = true, sort_order = excluded.sort_order, updated_at = now();`);
});
lines.push('');

lines.push('-- Packs');
data.PACKS.forEach((p, i) => {
  const features = [
    `${p.cameras} caméras HD intérieur / extérieur`,
    p.dvr,
    p.power,
    p.hdd,
    'Pose standard + vision sur smartphone',
  ];
  lines.push(`insert into public.packs (cameras, name, price_fcfa, badge, recorder_label, storage_label, power_label, usage_label, features, is_featured, is_published, sort_order)\nvalues (${int(p.cameras)}, ${q(p.name)}, ${int(p.price)}, ${q(p.badge)}, ${q(p.dvr)}, ${q(p.hdd)}, ${q(p.power)}, ${q(p.usage)}, ${json(features)}, ${bool(p.featured)}, true, ${(i + 1) * 10})\non conflict (cameras) do update set name = excluded.name, price_fcfa = excluded.price_fcfa, badge = excluded.badge, recorder_label = excluded.recorder_label, storage_label = excluded.storage_label, power_label = excluded.power_label, usage_label = excluded.usage_label, features = excluded.features, is_featured = excluded.is_featured, is_published = true, sort_order = excluded.sort_order, updated_at = now();`);
});
lines.push('');

lines.push('-- Réalisations');
data.PROJECTS.forEach((p, i) => {
  const city = String(p.lieu || '').split(' — ')[0];
  const vals = `${q(p.title)}, ${q(p.cat)}, ${q(data.PROJECT_CATS[p.cat] || p.cat)}, ${q(city)}, ${q(p.lieu)}, ${q(p.img)}, ${q(p.desc)}, ${json(p.meta || [])}, true, ${(i + 1) * 10}`;
  lines.push(`insert into public.projects (title, category_slug, category_label, city, location_label, image_path, description, meta, is_published, sort_order)\nselect ${vals}\nwhere not exists (select 1 from public.projects where title = ${q(p.title)} and location_label = ${q(p.lieu)});`);
});
lines.push('');

lines.push('-- Témoignages');
testimonials.forEach((t, i) => {
  const vals = `${q(t.author_name)}, ${q(t.author_role)}, ${q(t.city)}, ${q(t.quote)}, 5, true, ${(i + 1) * 10}`;
  lines.push(`insert into public.testimonials (author_name, author_role, city, quote, rating, is_published, sort_order)\nselect ${vals}\nwhere not exists (select 1 from public.testimonials where author_name = ${q(t.author_name)} and quote = ${q(t.quote)});`);
});
lines.push('');

lines.push('-- FAQ');
faqs.forEach(([question, answer], i) => {
  lines.push(`insert into public.faqs (question, answer_html, is_published, sort_order) values (${q(question)}, ${q(answer)}, true, ${(i + 1) * 10})\non conflict (question) do update set answer_html = excluded.answer_html, is_published = true, sort_order = excluded.sort_order, updated_at = now();`);
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Seed SQL généré : ${outPath}`);
console.log(`Services=${data.SERVICES.length} Produits=${data.PRODUCTS.length} Packs=${data.PACKS.length} Projets=${data.PROJECTS.length} Témoignages=${testimonials.length} FAQ=${faqs.length} Villes=${cities.length}`);
