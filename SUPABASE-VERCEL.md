# TOUVOIR — Supabase & Vercel

Ce document résume le backend et l’hébergement préparés pour l’application TOUVOIR.

## 1. Ressources créées

### Supabase

- Projet : **touvoir**
- Référence du projet : `nvrmgbxmnmitljqzndaq`
- Région : `eu-west-1`
- URL API : `https://nvrmgbxmnmitljqzndaq.supabase.co`
- Migration principale appliquée : `touvoir_core_schema` (`20261103121335`), fichier local `supabase/migrations/202611030001_touvoir_core.sql`
- Migration de sécurité appliquée : `touvoir_security_hardening_audit_20261103` (`20261103140952`), fichier local `supabase/migrations/202611030003_touvoir_security_hardening.sql`
- Données initiales : `supabase/migrations/202611030002_touvoir_seed.sql`
- Fonction Edge : `notify-lead`, version 4 durcie, `verify_jwt=false`
- Générateur des données initiales : `supabase/generate-seed.js`

La clé utilisée par le site statique est une clé **publishable** publique, stockée dans `assets/js/supabase-config.js`. La sécurité repose sur les politiques **RLS** : ne mettez jamais de clé `service_role` ou le mot de passe de base de données dans le code du site.

Le mot de passe direct de la base n’est pas utilisé par le site. Si vous avez besoin d’un accès direct PostgreSQL plus tard, il peut être réinitialisé dans Supabase Dashboard → Project Settings → Database.

### Vercel

- Projet : **touvoir**
- ID projet : `prj_ftJANZUTQuwjJjr2fxWYnPqTM90J`
- Variables créées pour Production / Preview / Development :
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Configuration statique : `vercel.json`

État : le projet Vercel est prêt, mais aucun déploiement de production n’a encore été lancé depuis ce dossier. Pour publier, connectez un dépôt Git contenant le dossier du site ou déployez depuis ce dossier avec Vercel CLI :

```bash
cd touvoir
npx vercel link --project touvoir
npx vercel --prod
```

Aucune étape de build n’est requise : le site est statique HTML/CSS/JS.

## 2. Base de données créée

21 tables ont été créées dans le schéma `public`, toutes avec RLS activé.

### Demandes entrantes — cœur indispensable

- `quote_requests` : demandes de devis (`TV-DEV-...`) avec client, téléphone, e-mail, service, pack/produit sélectionné, message, statut de traitement.
- `price_requests` : demandes de prix produit (`TV-PRX-...`) avec produit, quantité, option d’installation, statut.
- `fault_reports` : pannes (`TV-PAN-...`) avec client, ville, quartier, équipement, urgence, description, statut et planification.

Comportement des formulaires du site :

1. La demande est insérée dans Supabase avec la clé publishable.
2. Une notification e-mail automatique part vers `touvoirci@gmail.com` via la fonction Edge `notify-lead` (Resend), avec Web3Forms/FormSubmit en secours selon `assets/js/email-config.js`.
3. L’écran de confirmation propose WhatsApp en option ; le navigateur du visiteur conserve uniquement la référence, le type et la date de la demande dans `localStorage` (jamais les coordonnées complètes).

Le public peut **insérer** une demande avec le statut `nouveau`, mais ne peut pas relire les demandes des autres visiteurs.

### Suivi métier / mini-CRM

- `customers` : clients et prospects consolidés.
- `customer_sites` : sites/adresses d’intervention par client, ville, quartier, GPS éventuel.
- `installed_equipments` : équipements installés, garanties, état, historique utile aux pannes.
- `appointments` : études de site, installations, dépannages, maintenances et rendez-vous.
- `interventions` : rapports d’intervention, technicien, matériel utilisé, montant, dates.
- `request_followups` : notes, appels, relances WhatsApp/e-mail et prochaines actions.
- `attachments` : métadonnées des futures photos/documents, avec bucket privé Supabase Storage `touvoir-uploads`.
- `notification_logs` : journal des notifications ; la fonction `notify-lead` y inscrit les tentatives e-mail (envoyée/échouée).
- `profiles` : membres de l’équipe liés à Supabase Auth, avec rôles `admin`, `commercial`, `technicien`, `support`, `lecture`.

### Contenus du site

- `site_settings` : identité, e-mail professionnel `touvoirci@gmail.com`, horaires, liens sociaux à compléter et règles de workflow.
- `cities` : Abidjan, Bouaké, Yamoussoukro, San Pedro, Korhogo, Daloa, Man, Bouaké et « Autre ville ».
- `services` : les 8 services actuels.
- `product_categories` et `products` : les 9 catégories et les 16 produits actuels.
- `packs` : les 6 packs caméras et leurs prix indicatifs.
- `projects` : les 9 réalisations avec les villes corrigées.
- `testimonials` : les 4 témoignages actuels.
- `faqs` : les 7 questions fréquentes actuelles.

Le site continue pour le moment d’afficher les contenus depuis `assets/js/data.js` pour rester rapide et robuste ; les tables de contenu sont prêtes pour une future interface d’administration ou une lecture dynamique depuis Supabase.

## 3. Où voir les demandes reçues ?

Dans Supabase Dashboard → Table Editor :

- Devis : table `quote_requests`, filtrer `status = nouveau`.
- Prix : table `price_requests`, filtrer `status = nouveau`.
- Pannes : table `fault_reports`, trier par `urgency_level` décroissant puis `created_at` décroissant.

Pensez à faire évoluer les statuts au fil du traitement : `nouveau` → `a_contacter` / `diagnostic` → `etude_planifiee` / `planifie` → `devis_envoye` / `en_cours` → `gagne` / `resolu` / `clos`.

## 4. Créer le premier administrateur (pour future interface staff)

Le site vitrine n’a pas encore d’écran de connexion staff. Si vous créez plus tard une interface admin Supabase Auth :

1. Créez l’utilisateur dans Supabase Dashboard → Authentication → Users.
2. Ajoutez son profil équipe, par exemple :

```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Administrateur TOUVOIR', 'admin'
from auth.users
where email = 'votre-email-admin@example.com'
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = true,
    updated_at = now();
```

Sans ligne active dans `profiles`, un utilisateur authentifié n’a pas les droits équipe via l’API. Le Table Editor du dashboard reste accessible au propriétaire du projet Supabase.

## 5. Sécurité et limites actuelles

- RLS est activé sur les 21 tables publiques du schéma `public`.
- Privilèges PostgreSQL minimaux : `anon` ne peut lire que 9 tables de contenu public et insérer uniquement les colonnes publiques des 3 tables de demandes ; aucun `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER` public. Les politiques d’insertion sont réservées à `anon`, au statut `nouveau`, avec les champs internes vides.
- Contraintes serveur sur les références, e-mails, longueurs et paramètres de provenance ; fonctions internes avec `search_path=''` et exécution retirée à `anon` ; `pg_trgm` déplacé dans le schéma `extensions` sans casser son index.
- Lecture publique limitée aux contenus publiés : paramètres publics, villes actives, services, produits, packs, projets, témoignages et FAQ.
- Les tables clients, sites, équipements, rendez-vous, interventions, suivis, pièces jointes et notifications sont réservées à l’équipe.
- Bucket privé `touvoir-uploads` limité à 10 Mio et aux formats JPEG, PNG, WebP, GIF et PDF ; politiques Storage réservées au staff authentifié.
- Auth : inscriptions publiques désactivées, `site_url` et redirections limitées à `https://touvoir.vercel.app`, confirmation e-mail conservée. Aucun utilisateur/profile staff n’existe encore. Avant de créer le premier admin, relever manuellement dans Supabase la longueur minimale de mot de passe (actuellement 6), activer la protection contre les mots de passe compromis et prévoir la MFA.
- Fonction `notify-lead` v4 : corps limité, référence strictement vérifiée en base, demande récente au statut `nouveau`, message reconstruit depuis Supabase, index unique anti-doublon, plafond de 60 notifications/heure et CORS restreint.
- E-mail automatique **actif** : secret `RESEND_API_KEY` présent côté Supabase, fonction `notify-lead` testée en réel (réponse Resend acceptée et journal `notification_logs` en `envoye` vers `touvoirci@gmail.com`). Expéditeur actuel `onboarding@resend.dev` ; vérifier un domaine Resend plus tard pour un expéditeur de marque. La clé ayant été partagée dans cette conversation, prévoir sa rotation (nouvelle clé Sending access puis suppression de l’ancienne).
- Le numéro d’information/WhatsApp **+225 01 40 81 04 15** et le siège **San Pedro — Quartier Cité, Rue des Banques** sont intégrés au site et aux paramètres Supabase.
