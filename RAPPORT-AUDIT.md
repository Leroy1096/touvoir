# TOUVOIR — Rapport d’audit général et de sécurité

**Date :** 3 novembre 2026  
**Périmètre :** site statique TOUVOIR, formulaires publics, Supabase, fonction e-mail `notify-lead`, configuration Vercel et expérience mobile/desktop.  
**Résultat :** les problèmes confirmés pendant l’audit ont été corrigés et retestés. Il reste principalement des actions externes : publication Vercel effective, rotation de la clé Resend, informations légales définitives et durcissements à activer manuellement avant la création d’un compte administrateur.

> Les données de test créées pendant les vérifications ont été supprimées. À la fin de l’audit : `quote_requests = 0`, `fault_reports = 0`, `price_requests = 0`, `notification_logs = 0`. Aucun e-mail réel n’a été envoyé pendant cette passe d’audit : les formulaires ont été testés avec un canal e-mail simulé et la fonction Edge avec des cas inexistant, expiré et déjà réservé.

---

## 1. Corrections signalées par l’utilisateur

### 1.1 WhatsApp « ne répond pas »

Diagnostic effectué sur le bouton flottant et sur les liens WhatsApp des packs, produits, services, réalisations, contact et écrans de confirmation :

- le numéro configuré est bien **+225 01 40 81 04 15**, soit `2250140810415` au format international ;
- la page officielle WhatsApp reconnaît le numéro et affiche « Discuter sur WhatsApp avec le +225 0140810415 » ;
- les liens ont été simplifiés pour utiliser directement l’endpoint officiel `https://api.whatsapp.com/send?phone=2250140810415&text=...`, sans redirection intermédiaire `wa.me` ;
- un mécanisme de secours a été ajouté pour les aperçus intégrés qui bloquent les pop-ups : si le site est affiché dans un cadre et que `window.open` est bloqué, WhatsApp s’ouvre dans la vue courante ;
- les liens utilisent `target="_blank"` et `rel="noopener noreferrer"`.

Retest navigateur : bouton flottant OK sur les **9 pages**, 6 interactions dynamiques OK et test mobile OK. Chaque clic ouvre une fenêtre vers `api.whatsapp.com/send` avec le bon numéro et le message pré-rempli.

Lien direct de contrôle :

<https://api.whatsapp.com/send?phone=2250140810415&text=Bonjour%20TOUVOIR%2C%20je%20souhaite%20des%20informations%20sur%20vos%20solutions%20de%20vid%C3%A9osurveillance.>

Remarque : l’aperçu d’un fichier dans certains environnements intégrés peut bloquer les liens externes/pop-ups. Le test doit donc être fait depuis l’aperçu live du site ou depuis le lien direct ci-dessus, pas depuis un aperçu de fichier en bac à sable sans accès réseau.

### 1.2 Horaires — « Astreinte technique »

Le libellé demandé **« Assistance technique »** remplace désormais « Astreinte technique » :

- pied de page des pages publiques ;
- carte « Horaires d’ouverture » de la page Contact : « Assistance technique 24/7 pour les professionnels » ;
- fiche du service Maintenance & dépannage ;
- seed Supabase et paramètres déjà présents en base (`business_hours`, service `maintenance-depannage`).

Contrôle global final : `Astreinte technique = 0`, `Assistance technique = 21` occurrences dans les fichiers texte du projet.

---

## 2. Synthèse des constats et corrections

| Domaine | Problème initial | Correction | Statut |
|---|---|---|---|
| XSS | Le paramètre `?produit=` pouvait injecter du HTML dans le toast ; plusieurs rendus dynamiques utilisaient `innerHTML` sans échappement systématique | Toast reconstruit en nœuds DOM/`textContent`, compteur en DOM sûr, `escapeHtml()` / `escapeAttr` appliqués aux packs, produits, services et réalisations | Corrigé et retesté |
| Données navigateur | Les coordonnées complètes des formulaires étaient conservées dans `localStorage` | Stockage minimal : référence, type et date uniquement ; purge/normalisation des anciennes entrées, max. 20 | Corrigé et retesté |
| Fiabilité e-mail | L’e-mail pouvait être tenté avant confirmation de l’enregistrement | `saveLead()` insère d’abord dans Supabase, puis déclenche l’e-mail | Corrigé et retesté |
| Mobile | Les grilles statistiques inline d’À propos et Réalisations provoquaient un débordement horizontal | Remplacement par `.grid-4.stats-grid` responsive | Corrigé et retesté |
| Images | Trois images de modales avaient `src=""` | Remplacement par un GIF transparent en data URI avant chargement dynamique | Corrigé |
| Accessibilité | Sauts de titres et footer en `h4` après des `h2` | `h2.sr-only` sur Contact/Panne et titres du footer en `h3` | Corrigé |
| Légal | Liens « Mentions légales » / « Confidentialité » en `#` | Pages créées, reliées dans tous les pieds de page et ajoutées au sitemap | Corrigé, contenu à faire valider |
| Supabase | RLS présente, mais privilèges SQL trop larges pour `anon` / `authenticated` | Moindre privilège : lectures publiques limitées, insertion par colonnes, suppression des privilèges dangereux | Corrigé et retesté |
| Validation serveur | Les formulaires publics manquaient de bornes strictes côté base | Contraintes de format/longueur/e-mail/référence et politiques d’insertion resserrées | Corrigé et retesté |
| Fonctions DB | `search_path` non figé et fonctions exécutables trop largement | `search_path=''` et exécution retirée à `anon` pour les fonctions internes | Corrigé et retesté |
| Extension | `pg_trgm` installé dans `public` | Déplacé dans `extensions`, index trigramme des produits conservé | Corrigé |
| Storage | Bucket privé sans taille ni types MIME bornés | Limite 10 Mio ; JPEG, PNG, WebP, GIF, PDF uniquement | Corrigé et retesté |
| Edge e-mail | Endpoint public capable d’envoyer un e-mail forgé sans demande correspondante | Vérification DB, message reconstruit depuis la base, fenêtre de 30 minutes, anti-doublon, plafond horaire, CORS restreint | Corrigé et retesté sans spam |
| Auth | Inscriptions ouvertes et URL locale | Inscriptions désactivées, URL/redirections limitées à `https://touvoir.vercel.app` | Corrigé partiellement, voir restes |
| Vercel | En-têtes de sécurité minimaux | CSP, HSTS, anti-sniffing, anti-iframe, Referrer-Policy, Permissions-Policy, COOP/CORP, `.vercelignore` | Configuré, non déployé |

---

## 3. Front-end

Pages auditées : Accueil, À propos, Services, Produits, Réalisations, Contact, Panne, Mentions légales et Confidentialité.

Corrections notables :

- helper global `escapeHtml()` / `escapeAttr` dans `assets/js/data.js` ;
- seuls les SVG internes de confiance (`ICONS`) continuent d’être injectés comme HTML ;
- les trois formulaires attendent la confirmation Supabase avant de tenter l’e-mail ;
- les écrans de confirmation gardent WhatsApp en option et n’ouvrent aucune fenêtre automatiquement ;
- les pages légales réutilisent le design TOUVOIR et ne contiennent aucune immatriculation inventée ;
- les assets publics sont versionnés avec `?v=20261103-audit1` ;
- les liens sociaux restent volontairement en attente des URL réelles et affichent « Bientôt disponible ».

Résultat statique final sur les 9 pages :

- 0 référence locale manquante ;
- 0 ancre interne cassée ;
- 0 ID dupliqué ;
- 0 image sans `alt`, 0 `src=""` ;
- 0 champ sans libellé ;
- 0 lien `target="_blank"` sans `noopener` ;
- 1 seul `h1` par page et 0 saut de niveau de titre ;
- aucun motif de clé Resend, `sb_secret_`, JWT ou clé privée dans le workspace ; seule la clé Supabase **publishable** est présente côté navigateur.

---

## 4. Supabase

Projet audité : `touvoir` (`nvrmgbxmnmitljqzndaq`), région `eu-west-1`.

Migration de durcissement appliquée :

- nom : `touvoir_security_hardening_audit_20261103` ;
- version Supabase : `20261103140952` ;
- fichier local : `supabase/migrations/202611030003_touvoir_security_hardening.sql`.

État vérifié après migration :

- 21 tables publiques, RLS activé sur 21/21 ;
- `anon` : `SELECT` sur 9 tables de contenu public seulement, insertion par colonnes sur les 3 tables de demandes, aucun privilège `UPDATE`/`DELETE`/`TRUNCATE`/`REFERENCES`/`TRIGGER` ;
- `authenticated` : privilèges `TRUNCATE`/`REFERENCES`/`TRIGGER` retirés ;
- politiques publiques d’insertion réservées à `anon`, statut `nouveau`, source `site_web`, champs internes obligatoirement vides ;
- contraintes de format et de longueur sur les 3 formulaires publics ;
- index unique partiel anti-doublon sur `notification_logs` ;
- `pg_trgm` dans `extensions`, index `idx_products_name_trgm` toujours présent ;
- bucket `touvoir-uploads` privé, 10 Mio maximum, MIME images/PDF uniquement ;
- `auth.users = 0`, `public.profiles = 0`.

Auth après correction :

- `disable_signup = true` ;
- `site_url = https://touvoir.vercel.app` ;
- allowlist : `https://touvoir.vercel.app/**` ;
- `mailer_autoconfirm = false` ;
- test public d’inscription : HTTP 422 `signup_disabled`.

Reste manuel avant tout compte staff : le connecteur ne permet pas de modifier la longueur minimale du mot de passe ni la protection HIBP. Valeurs encore observées : minimum 6 caractères, HIBP désactivé, CAPTCHA désactivé. Le risque est limité tant qu’il n’y a ni inscription publique ni utilisateur, mais ces réglages doivent être relevés dans le dashboard avant la création du premier administrateur, avec MFA.

---

## 5. Fonction e-mail `notify-lead`

Version déployée après audit : **4**, statut `ACTIVE`, `verify_jwt=false` (nécessaire pour l’appel public du site statique, compensé par les contrôles serveur ci-dessous).

Protections ajoutées :

- corps JSON limité à 32 Kio ;
- type et référence strictement validés ;
- recherche de la demande réelle dans Supabase avec le rôle service côté Edge uniquement ;
- demande obligatoire au statut `nouveau` et âgée de 30 minutes maximum ;
- sujet et texte reconstruits depuis les colonnes de la base — le sujet/texte envoyé par le navigateur est ignoré ;
- journal `notification_logs` réservé **avant** l’envoi ;
- index unique empêchant un second envoi pour la même demande ;
- plafond global de 60 notifications par heure ;
- CORS limité aux origines TOUVOIR, au preview de développement et à localhost ;
- honeypot conservé.

Tests sans envoi réel :

- référence invalide : HTTP 422 `demande_invalide` ;
- référence inexistante au bon format : HTTP 404 `demande_introuvable` ;
- demande vieillie artificiellement à 31 minutes : HTTP 409 `demande_expiree` ;
- demande fraîche avec journal déjà réservé : HTTP 200 `duplicate:true`, toujours 1 seul journal et aucun identifiant fournisseur, donc aucun second e-mail.

L’envoi Resend réel avait déjà été prouvé lors de la phase précédente (référence de test `TV-DEV-20261103-1325-7UPN`, identifiant Resend `01a1a196-3835-77bc-9813-719bdbddec55`, journal `envoye`). Cette donnée historique de test a elle aussi été supprimée.

Risque résiduel : un visiteur peut toujours créer une vraie demande publique puis déclencher sa notification — c’est le fonctionnement attendu d’un formulaire public. Le plafond horaire limite l’impact, mais il n’y a pas encore de CAPTCHA ni de limite par IP. À envisager avant un trafic important ou en cas de spam.

---

## 6. Vercel

Projet : `touvoir` (`prj_ftJANZUTQuwjJjr2fxWYnPqTM90J`)  
Domaine attaché et vérifié : `touvoir.vercel.app`  
Variables publiques présentes : `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Configuration ajoutée dans `vercel.json` :

- Content-Security-Policy limitée au site, Google Fonts, Google Maps, Supabase et aux canaux e-mail de secours configurés ;
- `Strict-Transport-Security` ;
- `X-Content-Type-Options: nosniff` ;
- `X-Frame-Options: SAMEORIGIN` et `frame-ancestors 'self'` ;
- `Referrer-Policy: strict-origin-when-cross-origin` ;
- `Permissions-Policy` restrictive ;
- `Cross-Origin-Opener-Policy` et `Cross-Origin-Resource-Policy` ;
- cache des assets.

`.vercelignore` exclut `supabase/`, la documentation Markdown, le rapport et la page de conception de la publication.

**Point bloquant externe :** le projet n’a encore **aucun déploiement**. Une requête finale sur `https://touvoir.vercel.app/` renvoie donc HTTP 404 `DEPLOYMENT_NOT_FOUND`. Aucun token Vercel ni CLI authentifiée n’est disponible dans le bac à sable, et le connecteur ne permet pas de téléverser proprement l’ensemble des images binaires du workspace. La publication doit être faite depuis un dépôt Git connecté au projet ou avec Vercel CLI authentifié. Les en-têtes ci-dessus ne seront effectifs qu’après ce déploiement ; la CSP a néanmoins été simulée localement sans erreur.

---

## 7. Tests effectués

### 7.1 Syntaxe et fichiers

- `node --check` OK sur tous les fichiers JavaScript du site et `supabase/generate-seed.js` ;
- transpilation de contrôle `esbuild` + `node --check` OK pour `supabase/functions/notify-lead/index.ts` ;
- `vercel.json` : JSON valide ;
- `sitemap.xml` : XML valide.

### 7.2 Navigateur desktop et mobile

- 9 pages × desktop/mobile : HTTP 200 ;
- 0 erreur console et 0 `pageerror` ;
- 0 débordement horizontal de document (`scrollWidth = clientWidth`) ;
- 0 image cassée ;
- CSP de `vercel.json` injectée localement pendant le test : aucune erreur bloquante ;
- produits : 16 au départ, recherche « Turret » → 1 ;
- réalisations : 9 projets, filtre « Résidences » → 2, lightbox OK ;
- service : modale OK ;
- menu mobile et FAQ OK ;
- validation Contact : 5 erreurs de champs sur soumission vide, comme attendu.

Les seuls éléments signalés hors viewport sont les slides suivantes du carrousel de témoignages, volontairement placées hors cadre dans un conteneur masqué ; elles ne créent aucun défilement horizontal.

### 7.3 Formulaires et stockage local

Avec e-mail simulé et Supabase réel :

- Contact : insertion `quote_requests` OK, ordre prouvé `db:start → db:end:ok → email:devis` ;
- Panne : insertion `fault_reports` OK, ordre `db → email:panne` ;
- Prix produit : insertion `price_requests` OK, ordre `db → email:prix` ;
- aucune ouverture automatique de WhatsApp (`window.open = 0`) ;
- les boutons WhatsApp de confirmation contiennent le récapitulatif complet et le bon endpoint officiel ;
- `localStorage` ne contient que `ref`, `type`, `createdAt` pour les 3 formulaires ; aucun nom ni téléphone de test retrouvé.

### 7.4 XSS

- paramètre `?produit=<span id="xss-audit-marker">...` : aucun élément injecté, texte affiché littéralement dans le toast ;
- données dynamiques empoisonnées en mémoire pour un produit, un service et une réalisation : aucun élément injecté, payload affiché comme texte dans les 3 cas.

### 7.5 REST / sécurité

- lectures publiques des contenus publiés : HTTP 200 ;
- lectures `anon` des demandes, profils, clients, interventions et journaux : HTTP 401 `permission denied` ;
- insertion publique valide d’un devis : HTTP 201 avec `Prefer: return=minimal` ;
- e-mail invalide : HTTP 400, contrainte `quote_requests_email_format` ;
- champ interne ou colonne non accordée : HTTP 401 ;
- statut interne forcé : HTTP 401 RLS ;
- `PATCH` et `DELETE` publics sur un devis : HTTP 401 ; la ligne est restée `nouveau` ;
- RPC `is_staff` et `make_ref` en `anon` : HTTP 401 ;
- listing Storage anon : liste vide ; upload `text/plain` : refusé `invalid_mime_type` ;
- inscription Auth publique : HTTP 422 `signup_disabled` ;
- CORS Edge avec origine inconnue : renvoi vers l’origine de repli `https://touvoir.vercel.app`, jamais l’origine attaquante.

### 7.6 WhatsApp

Preuves détaillées dans `/home/user/audit15/whatsapp-report.json` :

- bouton flottant visible, non masqué et cliquable sur les 9 pages ;
- clic desktop et mobile : pop-up `api.whatsapp.com/send?phone=2250140810415...` ;
- liens pack, produit, modale produit, service, réalisation et contact : OK.

---

## 8. Points restants, par priorité

### Priorité haute

1. **Publier réellement sur Vercel** via Git ou Vercel CLI authentifié, puis retester `https://touvoir.vercel.app/` et les en-têtes en production.
2. **Roter la clé Resend** : elle a transité par la conversation. Créer une clé « Sending access », remplacer le secret Supabase `RESEND_API_KEY`, tester un envoi, puis supprimer l’ancienne clé. Ne jamais la mettre dans le site ou le workspace.
3. **Avant tout compte admin Supabase** : mot de passe minimum 12 caractères, protection contre les mots de passe compromis, MFA et création contrôlée de la ligne `profiles`.

### Priorité moyenne

4. Ajouter un anti-spam plus fort si le site reçoit du trafic ou des abus : CAPTCHA/Turnstile et/ou limitation par IP en plus du plafond global de la fonction Edge.
5. Vérifier un domaine d’envoi dans Resend et remplacer `onboarding@resend.dev` par une adresse de marque.
6. Brancher le domaine définitif, remplacer la base de travail `https://www.touvoir.ci/` dans `robots.txt`/`sitemap.xml`, ajouter le domaine aux redirections Supabase Auth et aux origines autorisées de `notify-lead` si nécessaire.
7. Fournir les URL réelles des réseaux sociaux dans `SOCIAL_LINKS`.

### Contenu et conformité

8. Ajouter les références légales définitives (RCCM, compte contribuable, responsable nommé) dès qu’elles sont confirmées ; faire relire les pages légales.
9. Remplacer les contenus de démonstration restants par les preuves réelles de l’entreprise selon `A-COMPLETER.md` : chiffres, témoignages, équipe, photos de chantiers et produits réellement distribués.

---

## 9. Artefacts d’audit

- Rapport statique : `/home/user/audit15/static-report.json`
- Rapport navigateur : `/home/user/audit15/browser-report.json`
- Rapport REST/sécurité : `/home/user/audit15/security-rest.json`
- Rapport WhatsApp : `/home/user/audit15/whatsapp-report.json`
- Captures : `/home/user/audit15/index-mobile.png`, `/home/user/audit15/contact-mobile.png`
- Scripts rejouables : `/home/user/audit15/static_audit.py`, `/home/user/audit15/browser_audit.py`, `/home/user/audit15/security_rest.py`, `/home/user/audit15/whatsapp_audit.py`

**Verdict final :** le site et son backend sont fonctionnels et nettement durcis. La mise en production publique dépend maintenant du déploiement Vercel effectif, de la rotation de la clé Resend et des validations métier/légales listées ci-dessus.
