/* ============================================================
   TOUVOIR — Données du site (services, produits, projets)
   Modifiez ce fichier pour mettre à jour le catalogue.
   ============================================================ */

const ICONS = {
  video:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  wifi:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  phone:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  bell:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  key:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  monitor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  tool:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
  check:  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  arrow:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  pin:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  zoom:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  clock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  users:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  wa:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
};

const WHATSAPP_NUMBER = '2250140810415';
const WHATSAPP_CONTACT_URL = 'https://wa.me/2250140810415?text=Salut%20TOUVOIR%20%F0%9F%91%81%EF%B8%8F%0A%0AJe%20souhaite%20obtenir%20des%20informations%20concernant%20l%27un%20de%20vos%20services.%0A%0AVoici%20l%27objet%20de%20ma%20demande%20%3A%0A%0A1%EF%B8%8F%E2%83%A3%20%C3%89tude%20de%20site%0A2%EF%B8%8F%E2%83%A3%20Demande%20de%20devis%0A3%EF%B8%8F%E2%83%A3%20Signalement%20d%27une%20panne%0A4%EF%B8%8F%E2%83%A3%20Packs%20d%27installation%0A5%EF%B8%8F%E2%83%A3%20Informations%20compl%C3%A9mentaires%20sur%20vos%20services%0A6%EF%B8%8F%E2%83%A3%20Formation%0A7%EF%B8%8F%E2%83%A3%20Conseils%20et%20suivi%20client%C3%A8le%0A%0AMerci%20de%20bien%20vouloir%20m%27orienter%20vers%20le%20service%20adapt%C3%A9%20%C3%A0%20ma%20demande.%0A%0ATOUVOIR%20est%20%C3%A0%20votre%20%C3%A9coute%20%21%0A%0A%E2%9A%A1%20LE%20POUVOIR%20DE%20TOUVOIR%20%F0%9F%91%81%EF%B8%8F';
function waLink(text){
  // Sans texte précis, utiliser exactement le lien de contact fourni.
  // Les appels contextuels conservent leur message précis (produit,
  // service, pack, projet ou récapitulatif de formulaire).
  if(!text) return WHATSAPP_CONTACT_URL;
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}

/* Échappement systématique avant toute insertion dans du HTML.
   Les icônes SVG de confiance (ICONS) sont les seules chaînes HTML
   volontairement injectées telles quelles. */
function escapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}
const escapeAttr = escapeHtml;

/* ---------------- RÉSEAUX SOCIAUX ---------------- */
/* Collez ici les vraies URL des pages TOUVOIR lorsqu’elles seront créées. */
const SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  tiktok: '',
  linkedin: '',
  youtube: ''
};

/* ---------------- PACKS VIDÉOSURVEILLANCE ---------------- */
/* Tarifs indicatifs à revoir après étude de site. Hypothèse de travail :
   caméras HD + DVR/XVR + boîte d’alimentation + disque dur + pose standard. */
const PACKS = [
  { cameras:4,  name:'Essentiel',   price:200000,  badge:'Démarrage',        dvr:'DVR/XVR 4 voies',  hdd:'Disque dur 500 Go inclus', power:'Boîte d’alimentation 4 sorties',      usage:'Maison, boutique ou petit bureau', featured:false },
  { cameras:8,  name:'Confort',     price:365000,  badge:'Le plus demandé',  dvr:'DVR/XVR 8 voies',  hdd:'Disque dur 1 To inclus',   power:'Boîte d’alimentation 8 sorties',      usage:'Villa, commerce, bureau ou restaurant', featured:true },
  { cameras:12, name:'Pro',         price:520000,  badge:'Évolutif',         dvr:'DVR/XVR 16 voies', hdd:'Disque dur 2 To inclus',   power:'Boîte d’alimentation 16 sorties',     usage:'Supermarché, école, PME ou immeuble', featured:false },
  { cameras:16, name:'Business',    price:665000,  badge:'Professionnel',    dvr:'DVR/XVR 16 voies', hdd:'Disque dur 2 To inclus',   power:'Alimentation centralisée renforcée',   usage:'Entrepôt, hôtel, bureaux et sites sensibles', featured:false },
  { cameras:20, name:'Grand site',  price:820000,  badge:'Grande couverture',dvr:'DVR/XVR 32 voies', hdd:'Disque dur 4 To inclus',   power:'Alimentation pro double bloc',         usage:'Logistique, industrie, multi-bâtiments', featured:false },
  { cameras:32, name:'Sur mesure',  price:1250000, badge:'Projet XXL',       dvr:'DVR/XVR 32 voies', hdd:'Disque dur 4 To extensible',power:'Alimentation rack professionnelle',   usage:'Campus, grand commerce ou site industriel', featured:false }
];

function prixFCFA(montant){
  return montant.toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ') + ' FCFA';
}

/* ---------------- SERVICES ---------------- */
const SERVICES = [
  {
    slug:'installation-cctv', icon:'video', img:'assets/images/tech-mount.jpg',
    title:'Installation de caméras CCTV',
    short:'Installation professionnelle de systèmes de vidéosurveillance analogiques et HD pour habitations, commerces et entreprises.',
    long:'Nous concevons et installons des systèmes de vidéosurveillance CCTV complets et sur mesure : étude des angles morts, choix des caméras, câblage soigné, enregistrement sécurisé et formation à l’utilisation. Une installation propre, discrète et durable, réalisée par nos techniciens certifiés.',
    includes:['Étude de site et plan d’implantation','Fourniture de caméras HD / Full HD certifiées','Câblage, pose et réglage des angles de vue','Enregistreur DVR avec disque dur de surveillance','Formation de vos équipes à l’exploitation','Garantie installation 12 mois'],
    ideal:'Commerces, résidences, entrepôts, bureaux', duree:'1 à 3 jours selon le site'
  },
  {
    slug:'cameras-ip-wifi', icon:'wifi', img:'assets/images/camera-building.jpg',
    title:'Caméras IP & Wi-Fi',
    short:'Caméras réseau haute définition (IP PoE) et caméras Wi-Fi intelligentes, avec vision nocturne et détection de mouvement.',
    long:'Profitez d’images ultra-nettes jusqu’en 4K grâce aux caméras IP PoE, ou optez pour la simplicité des caméras Wi-Fi sans gros travaux. Détection intelligente de personnes, vision nocturne couleur, audio bidirectionnel : nous installons la solution adaptée à votre budget et à vos locaux.',
    includes:['Caméras IP 2MP à 8MP (4K) PoE','Caméras Wi-Fi intérieures et extérieures','Vision nocturne infrarouge ou couleur','Détection intelligente de mouvement / IA','Raccordement réseau et switch PoE','Configuration complète incluse'],
    ideal:'Habitations, PME, sites sensibles', duree:'1 à 2 jours'
  },
  {
    slug:'surveillance-distance', icon:'phone', img:'assets/images/remote-tablet.jpg',
    title:'Surveillance à distance',
    short:'Visualisez vos caméras en direct depuis votre smartphone, tablette ou ordinateur, où que vous soyez, 24h/24.',
    long:'Gardez un œil sur votre domicile ou votre entreprise depuis n’importe où dans le monde. Nous configurons l’accès distant sécurisé sur vos appareils : direct, relecture des enregistrements, alertes instantanées en cas d’intrusion et partage d’accès avec vos proches ou collaborateurs.',
    includes:['Application mobile iOS & Android configurée','Alertes push en cas de détection','Relecture des enregistrements à distance','Accès multi-utilisateurs avec droits gérés','Connexion chiffrée et sécurisée','Assistance à la prise en main'],
    ideal:'Particuliers, gérants, multi-sites', duree:'2 à 4 heures'
  },
  {
    slug:'systemes-alarme', icon:'bell', img:'assets/images/service-alarm.jpg',
    title:'Systèmes d’alarme anti-intrusion',
    short:'Centrales d’alarme filaires et sans fil avec détecteurs de mouvement, contacts d’ouverture et sirènes dissuasives.',
    long:'Protégez vos locaux contre les intrusions avec un système d’alarme fiable : détecteurs de mouvement, contacts de porte et fenêtre, sirène extérieure et alertes sur votre téléphone. Nos centrales sans fil s’installent sans travaux et restent opérationnelles même en cas de coupure de courant.',
    includes:['Centrale d’alarme avec batterie de secours','Détecteurs de mouvement et d’ouverture','Sirène intérieure / extérieure dissuasive','Alertes SMS et application mobile','Télécommandes et badges utilisateurs','Test complet et mise en service'],
    ideal:'Résidences, boutiques, dépôts', duree:'1 journée'
  },
  {
    slug:'controle-acces', icon:'key', img:'assets/images/service-access.jpg',
    title:'Contrôle d’accès électronique',
    short:'Badge, code ou empreinte digitale : maîtrisez qui entre dans vos locaux et gardez un historique complet des passages.',
    long:'Sécurisez les zones sensibles de votre entreprise grâce au contrôle d’accès biométrique ou par badge. Gérez les autorisations par utilisateur, par horaire et par porte, et consultez l’historique des entrées et sorties. Idéal aussi pour la gestion de présence du personnel.',
    includes:['Lecteurs biométriques (empreinte, visage)','Badges RFID et claviers à code','Ventouses et gâches électriques','Logiciel de gestion des accès','Historique et rapports de présence','Formation de l’administrateur'],
    ideal:'Bureaux, écoles, cliniques, entrepôts', duree:'1 à 3 jours'
  },
  {
    slug:'interphones-visiophones', icon:'monitor', img:'assets/images/service-intercom.jpg',
    title:'Interphones & visiophones',
    short:'Voyez et parlez à vos visiteurs avant d’ouvrir : platines de rue vidéo, moniteurs intérieurs et ouverture à distance.',
    long:'Accueillez vos visiteurs en toute sécurité grâce aux visiophones dernière génération : image couleur jour et nuit, conversation bidirectionnelle, ouverture du portail depuis le moniteur ou le smartphone. Solutions pour villas, résidences collectives et immeubles de bureaux.',
    includes:['Platine de rue anti-vandale avec caméra','Moniteur intérieur tactile 7” couleur','Ouverture de porte / portail à distance','Vision nocturne automatique','Version connectée smartphone disponible','Interphonie multi-postes pour immeubles'],
    ideal:'Villas, résidences, immeubles', duree:'1 journée'
  },
  {
    slug:'maintenance-depannage', icon:'tool', img:'assets/images/tech-wiring.jpg',
    title:'Maintenance & dépannage',
    short:'Contrats de maintenance préventive et dépannage rapide de vos installations existantes, toutes marques.',
    long:'Une caméra en panne, une image dégradée, un enregistreur qui ne répond plus ? Nos techniciens interviennent rapidement pour diagnostiquer et réparer vos équipements, quelle que soit la marque. Nos contrats de maintenance incluent des visites préventives pour garantir un système toujours opérationnel.',
    includes:['Signalement de panne en ligne avec ville et urgence','Diagnostic sur site sous 48 h','Réparation et remplacement de matériel','Nettoyage et réglage des caméras','Vérification des enregistrements et disques','Contrats annuels avec visites programmées','Assistance technique 7j/7 pour les pros'],
    ideal:'Sites déjà équipés, professionnels', duree:'Intervention sous 24 à 48 h'
  },
  {
    slug:'configuration-securisation', icon:'sliders', img:'assets/images/control-config.jpg',
    title:'Configuration & sécurisation',
    short:'Paramétrage avancé de vos enregistreurs et réseaux, mots de passe, sauvegardes et protection contre les accès non autorisés.',
    long:'Un système mal configuré est une faille de sécurité. Nous auditons et sécurisons votre installation : changement des mots de passe par défaut, mises à jour firmware, segmentation réseau, sauvegarde des configurations et optimisation de la qualité d’enregistrement pour une durée de stockage maximale.',
    includes:['Audit de sécurité de l’existant','Mises à jour firmware des équipements','Politique de mots de passe renforcée','Optimisation compression / stockage','Sauvegarde et documentation du système','Rapport d’intervention détaillé'],
    ideal:'Entreprises, sites sensibles', duree:'Une demi-journée à 1 jour'
  }
];

/* ---------------- PRODUITS ---------------- */
const PRODUCT_CATS = {
  ip:'Caméras IP', domes:'Caméras dômes', bullet:'Caméras bullet', ptz:'Caméras PTZ',
  enregistreurs:'Enregistreurs DVR/NVR', stockage:'Stockage', moniteurs:'Moniteurs',
  kits:'Kits complets', accessoires:'Accessoires & réseau'
};

const PRODUCTS = [
  { id:1, name:'Caméra IP Turret 4MP ColorVu', ref:'TV-IP-404C', cat:'ip', img:'assets/images/prod-turret.jpg', badge:{t:'Top vente',c:'top'},
    specs:['Résolution 4MP (2560 × 1440)','Vision nocturne couleur 30 m','Alimentation PoE — un seul câble','Boîtier étanche IP67, micro intégré'] },
  { id:2, name:'Caméra Bullet IP 5MP IR 50 m', ref:'TV-BL-505', cat:'bullet', img:'assets/images/prod-bullet.jpg', badge:{t:'Promo',c:'promo'},
    specs:['Capteur 5MP haute sensibilité','Infrarouge longue portée 50 m','Objectif 2,8 mm grand angle 105°','Étanche IP66 — idéale en extérieur'] },
  { id:3, name:'Caméra Dôme PTZ intérieure 2MP', ref:'TV-DM-220', cat:'domes', img:'assets/images/prod-dome-ptz.jpg', badge:null,
    specs:['Rotation 355° / inclinaison 90°','Full HD 1080p, suivi automatique','Audio bidirectionnel intégré','Parfaite pour bureaux et commerces'] },
  { id:4, name:'Caméra PTZ Speed Dome Zoom 25×', ref:'TV-PTZ-25X', cat:'ptz', img:'assets/images/prod-ptz25.jpg', badge:{t:'Nouveau',c:'new'},
    specs:['Zoom optique 25× motorisé','Rotation 360° continue','Portée infrarouge 100 m','Auto-tracking intelligent des personnes'] },
  { id:5, name:'Caméra PTZ Pro extérieure 5MP', ref:'TV-PTZ-530', cat:'ptz', img:'assets/images/prod-ptz-pro.jpg', badge:null,
    specs:['Résolution 5MP, zoom 30×','Vision nocturne laser 150 m','Boîtier renforcé IP66 / IK10','Idéale parkings et grands périmètres'] },
  { id:6, name:'Caméra Wi-Fi intelligente 1080p', ref:'TV-WF-108', cat:'ip', img:'assets/images/prod-wifi.jpg', badge:null,
    specs:['Sans fil — installation en 10 minutes','Détection de personnes par IA','Vision nocturne + projecteur LED','Application mobile gratuite'] },
  { id:7, name:'Caméra Wi-Fi d’intérieur motorisée', ref:'TV-WF-360', cat:'ip', img:'assets/images/prod-wifi-indoor.jpg', badge:null,
    specs:['Vue panoramique 360° motorisée','Conversation bidirectionnelle','Mode confidentialité intégré','Parfaite pour la maison et les bureaux'] },
  { id:8, name:'Kit vidéosurveillance 4 caméras HD', ref:'TV-KIT-04', cat:'kits', img:'assets/images/prod-kit.jpg', badge:{t:'Promo',c:'promo'},
    specs:['4 caméras bullet HD + DVR 4 voies','Boîte d’alimentation centralisée','Disque dur 500 Go inclus','Vision à distance sur smartphone'] },
  { id:9, name:'Enregistreur NVR 8 canaux 4K PoE', ref:'TV-NVR-808', cat:'enregistreurs', img:'assets/images/prod-nvr8.jpg', badge:{t:'Top vente',c:'top'},
    specs:['8 caméras IP jusqu’à 8MP (4K)','8 ports PoE intégrés','Sortie HDMI 4K + VGA','Accès distant smartphone / PC'] },
  { id:10, name:'Enregistreur NVR 16 canaux 12MP', ref:'TV-NVR-1612', cat:'enregistreurs', img:'assets/images/prod-nvr16.jpg', badge:null,
    specs:['16 canaux jusqu’à 12MP','2 baies disque dur (jusqu’à 20 To)','Recherche intelligente d’événements','Idéal entreprises et entrepôts'] },
  { id:11, name:'Enregistreur DVR 8 canaux 5-en-1', ref:'TV-DVR-805', cat:'enregistreurs', img:'assets/images/prod-dvr.jpg', badge:null,
    specs:['Compatible AHD, TVI, CVI, CVBS, IP','Enregistrement 1080p temps réel','Compression H.265+ économe','Idéal pour moderniser l’existant'] },
  { id:12, name:'Disque dur 2 To spécial vidéosurveillance', ref:'TV-HDD-200', cat:'stockage', img:'assets/images/prod-hdd.jpg', badge:null,
    specs:['Conçu pour un usage 24h/24, 7j/7','Optimisé pour les flux vidéo','± 30 jours d’enregistrement (4 cam.)','Garantie constructeur 3 ans'] },
  { id:13, name:'Moniteur de supervision LED 22″', ref:'TV-MON-22', cat:'moniteurs', img:'assets/images/control-operator.jpg', badge:null,
    specs:['Full HD 1920 × 1080 anti-reflet','Entrées HDMI + VGA + BNC','Conçu pour affichage 24h/24','Compatible mosaïques multi-écrans'] },
  { id:14, name:'Switch PoE 8 ports Gigabit', ref:'TV-SW-808G', cat:'accessoires', img:'assets/images/prod-switch.jpg', badge:null,
    specs:['8 ports PoE+ (30 W par port)','Portée étendue jusqu’à 250 m','Protection contre les surtensions','Boîtier métal rackable'] },
  { id:15, name:'Visiophone couleur 7″ avec platine de rue', ref:'TV-VIS-707', cat:'accessoires', img:'assets/images/prod-visiophone.jpg', badge:{t:'Nouveau',c:'new'},
    specs:['Écran couleur 7 pouces tactile','Platine extérieure vision nocturne','Ouverture de porte intégrée','Mémoire photo des visiteurs'] },
  { id:16, name:'Centrale d’alarme sans fil GSM/Wi-Fi', ref:'TV-ALM-100', cat:'accessoires', img:'assets/images/service-alarm.jpg', badge:null,
    specs:['Alertes SMS, appels et application','Jusqu’à 100 détecteurs sans fil','Batterie de secours intégrée','Clavier tactile rétroéclairé'] }
];

/* ---------------- RÉALISATIONS ---------------- */
const PROJECT_CATS = {
  residences:'Résidences', entreprises:'Entreprises & bureaux', commerces:'Commerces',
  entrepots:'Entrepôts', scolaires:'Établissements scolaires'
};

const PROJECTS = [
  { title:'Villa privée sécurisée', cat:'residences', lieu:'Abidjan — Cocody', img:'assets/images/real-villa.jpg',
    desc:'Protection périmétrique complète d’une villa : caméras extérieures avec vision nocturne couleur, alarme anti-intrusion et visiophone connecté au portail.',
    meta:['8 caméras IP 4MP','Alarme + visiophone','Accès smartphone'] },
  { title:'Maison contemporaine connectée', cat:'residences', lieu:'Yamoussoukro', img:'assets/images/real-maison.jpg',
    desc:'Installation discrète et esthétique : caméras Wi-Fi extérieures, détection de personnes par IA et alertes instantanées sur les téléphones de la famille.',
    meta:['6 caméras Wi-Fi','Détection IA','Alertes en temps réel'] },
  { title:'Bureaux administratifs', cat:'entreprises', lieu:'Abidjan — Plateau', img:'assets/images/real-bureaux.jpg',
    desc:'Vidéosurveillance des espaces de travail et contrôle d’accès biométrique à l’entrée principale avec gestion des présences du personnel.',
    meta:['14 caméras dôme','Accès biométrique','NVR 16 canaux'] },
  { title:'Hall d’immeuble de bureaux', cat:'entreprises', lieu:'Abidjan — Kouadio', img:'assets/images/real-immeuble.jpg',
    desc:'Caméra PTZ grand angle dans le hall d’accueil et supervision centralisée des accès, parkings et parties communes de l’immeuble.',
    meta:['Caméra PTZ 360°','Supervision 24/7','12 points de contrôle'] },
  { title:'Supermarché alimentaire', cat:'commerces', lieu:'Daloa', img:'assets/images/real-supermarche.jpg',
    desc:'Couverture complète des rayons, caisses et réserves pour lutter contre la démarque inconnue. Relecture rapide des incidents par la direction.',
    meta:['24 caméras HD','Zones caisses sécurisées','Stockage 45 jours'] },
  { title:'Plateforme logistique', cat:'entrepots', lieu:'San Pedro — Zone portuaire', img:'assets/images/real-entrepot.jpg',
    desc:'Surveillance des allées de stockage et des quais de chargement avec caméras longue portée et poste de supervision déporté au bureau du responsable.',
    meta:['18 caméras IP','Quais + allées','Supervision déportée'] },
  { title:'Entrepôt de stockage', cat:'entrepots', lieu:'Korhogo', img:'assets/images/real-entrepot2.jpg',
    desc:'Sécurisation périmétrique nuit et jour : caméras bullet infrarouge 80 m, détecteurs extérieurs et levée de doute vidéo sur alarme.',
    meta:['Vision nocturne 80 m','Levée de doute vidéo','Alarme périmétrique'] },
  { title:'Groupe scolaire', cat:'scolaires', lieu:'Man', img:'assets/images/real-ecole.jpg',
    desc:'Protection des cours, couloirs et entrées de l’établissement. Accès aux images strictement réservé à la direction, dans le respect des réglementations.',
    meta:['16 caméras dômes','Entrées + cours','Accès restreint direction'] },
  { title:'Établissement d’enseignement', cat:'scolaires', lieu:'Yamoussoukro', img:'assets/images/real-ecole2.jpg',
    desc:'Système complet avec contrôle d’accès au portail principal et caméras anti-vandale dans les zones de circulation des élèves.',
    meta:['Contrôle d’accès portail','Caméras anti-vandale IK10','Enregistrement 30 jours'] }
];
