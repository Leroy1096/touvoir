# TOUVOIR — Site web d'entreprise de sécurité électronique

Site vitrine professionnel (9 pages : 7 pages principales et 2 pages légales) pour une entreprise spécialisée en **vidéosurveillance CCTV** et sécurité électronique. Entièrement responsive, interactif, sans dépendance à un framework.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : hero, chiffres animés, avantages, services, processus, produits vedettes, réalisations, témoignages, CTA |
| `apropos.html` | Histoire, mission, vision, valeurs, chiffres, équipe |
| `services.html` | 8 services avec fiche détaillée en fenêtre modale |
| `produits.html` | Catalogue de 16 produits : recherche, filtres par catégorie, tri, demande de prix |
| `realisations.html` | Galerie de 9 projets filtrable + visionneuse (lightbox) |
| `contact.html` | Formulaire de devis validé, enregistré dans Supabase et transmis par e-mail à l’équipe (WhatsApp en option), coordonnées, carte Google Maps, FAQ |
| `panne.html` | Espace client pour signaler une panne : ville, équipement, problème, urgence, enregistrement Supabase + récapitulatif WhatsApp |
| `mentions-legales.html` | Mentions légales de l’éditeur du site |
| `confidentialite.html` | Politique de confidentialité et traitement des demandes |
| `CONCEPTION-UI-UX.html` | Document de conception : propositions UI & UX et synthèse |

## Lancer le site en local

```bash
cd touvoir
npm ci
npm run build
npm run serve:web
# puis ouvrir http://localhost:8001
```

Le build copie les 9 pages publiques et `assets/` dans `www/`. Ce même dossier est utilisé par Vercel et par l’application Android Capacitor (`ci.touvoir.app`). Voir **`DEPLOIEMENT.md`** pour GitHub, Vercel, la signature Android et les releases.

## Personnaliser

### Coordonnées de l'entreprise
Le nom **TOUVOIR**, l’e-mail professionnel **touvoirci@gmail.com**, le numéro d’information/WhatsApp **+225 01 40 81 04 15** et le siège **San Pedro — Quartier Cité, Rue des Banques** sont intégrés. Le domaine de travail `touvoir.ci` reste à remplacer par le domaine définitif si besoin. Pour mettre à jour les coordonnées :

1. **Numéro WhatsApp** : variable `WHATSAPP_NUMBER` dans `assets/js/data.js` + les liens officiels `https://wa.me/225...` présents dans les fichiers HTML (bouton flottant et boutons d’envoi). Conserver l’indicatif complet, y compris le `01` après `225`.
2. **Téléphones / e-mail / adresse** : rechercher-remplacer dans les 9 pages HTML du site (en-tête, pied de page, pages Contact et Panne). Conservez l’encodage `&#64;` pour les adresses e-mail visibles et les `mailto:`.
3. **Carte** : l'iframe Google Maps de `contact.html` (paramètre `q=...`).

### Produits, services et réalisations
Tout le contenu dynamique est centralisé dans **`assets/js/data.js`** :
- `PRODUCTS` : nom, référence, catégorie, image, badge, caractéristiques.
- `SERVICES` : titre, descriptions, prestations incluses, durée, public idéal.
- `PROJECTS` : titre, catégorie, lieu, description, équipements.
- `PACKS` : packs 4, 8, 12, 16, 20 et 32 caméras, prix indicatifs, DVR, alimentation et usages.
- `SOCIAL_LINKS` : URL Facebook, Instagram, TikTok, LinkedIn et YouTube à compléter.

Ajouter une entrée dans un tableau suffit : cartes, filtres et fenêtres se génèrent automatiquement. Les images sont à déposer dans `assets/images/`.

### Couleurs et identité
Les variables du design system sont en tête de `assets/css/style.css` (`:root`) :
bleu marine `#0B1F3A`, bleu `#145DA0`, orange d'action `#F59E0B`, gris `#F4F6F8`.

## Formulaires, Supabase et envoi des demandes

Les formulaires enregistrent les demandes dans **Supabase** et déclenchent une **notification e-mail automatique** vers `touvoirci@gmail.com` ; WhatsApp reste proposé en option sur l’écran de confirmation :

- demande de devis : table `quote_requests`, référence `TV-DEV-...` ;
- demande de prix produit : table `price_requests`, référence `TV-PRX-...` ;
- signalement de panne : table `fault_reports`, référence `TV-PAN-...`, avec client, ville, équipement, panne et urgence.

La configuration publique du navigateur se trouve dans `assets/js/supabase-config.js` (clé publishable uniquement), l’envoi REST dans `assets/js/supabase-client.js`, et le canal e-mail dans `assets/js/email-config.js` + `assets/js/email-notify.js` (fonction Supabase `notify-lead` prioritaire). Les formulaires écrivent d’abord dans Supabase, puis demandent l’e-mail : la fonction Edge vérifie la référence, reconstruit le message depuis la base et empêche les doublons. La sécurité repose sur RLS et des privilèges PostgreSQL minimaux : le public peut uniquement insérer les champs autorisés d’une demande au statut `nouveau`, sans relire les demandes.

Le schéma complet (21 tables), les données initiales et les instructions Vercel sont décrits dans **`SUPABASE-VERCEL.md`**. Fichiers SQL : `supabase/migrations/202611030001_touvoir_core.sql`, `supabase/migrations/202611030002_touvoir_seed.sql` (régénérable avec `node supabase/generate-seed.js`) et `supabase/migrations/202611030003_touvoir_security_hardening.sql`.

E-mail automatique actif : la clé Resend est enregistrée comme secret Supabase `RESEND_API_KEY` (jamais dans les fichiers du site) et un envoi réel vers `touvoirci@gmail.com` a été validé le 03/11/2026 via la fonction `notify-lead`. Expéditeur actuel : `TOUVOIR <onboarding@resend.dev>` ; à terme, vérifier un domaine d’envoi dans Resend puis mettre à jour le secret `LEAD_FROM_EMAIL`.

Voir aussi `A-COMPLETER.md` pour la checklist de mise en ligne.

## SEO & bonnes pratiques intégrées
- Balises `title` / `meta description` / OpenGraph propres à chaque page
- Données structurées Schema.org `LocalBusiness` (page d'accueil)
- `robots.txt` et `sitemap.xml` fournis à la racine (base de travail : `https://www.touvoir.ci/`, à remplacer par le domaine définitif)
- Projet **Vercel** `touvoir` configuré avec variables Supabase publiques, build `npm run build` et sortie `www/` ; procédure complète dans `DEPLOIEMENT.md`
- HTML sémantique (`header`, `nav`, `main`, `section`, `footer`), fils d'Ariane
- Textes alternatifs sur toutes les images, navigation au clavier, respect de `prefers-reduced-motion`
- Images optimisées (~1,9 Mo au total) et `loading="lazy"`
