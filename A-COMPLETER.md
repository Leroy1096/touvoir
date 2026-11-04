# TOUVOIR — À compléter avant mise en ligne définitive

Ce fichier liste uniquement ce qui dépend encore des informations réelles de l’entreprise. Le reste du site est prêt à être vérifié dans l’aperçu.

## 1. Coordonnées réelles à fournir

- [ ] Nom légal exact de l’entreprise et forme juridique si elle doit apparaître dans le pied de page.
- [x] Numéro d’information / WhatsApp principal : `01 40 81 04 15` (intégré au site et à Supabase).
- [ ] Numéro fixe, si vous en avez un. Aucun fixe fictif n’est affiché pour le moment.
- [x] Adresse e-mail de contact : `touvoirci@gmail.com` (intégrée au site).
- [ ] Adresse e-mail dédiée aux devis, si différente de l’adresse de contact.
- [x] Adresse du siège : San Pedro, Quartier Cité, Rue des Banques (intégrée au site et à Supabase). Repère connu / point GPS exact à ajouter si disponible.
- [ ] Zone d’intervention réelle : villes/quartiers desservis et conditions de déplacement.
- [ ] Horaires réels et conditions de l’assistance technique 24/7.

## 2. Réseaux sociaux

Les icônes sont déjà présentes dans le pied de page et sur la page Contact. Il reste à coller les vraies URL dans `assets/js/data.js`, dans l’objet `SOCIAL_LINKS` :

- [ ] Facebook
- [ ] Instagram
- [ ] TikTok
- [ ] LinkedIn
- [ ] YouTube

Tant qu’une URL est vide, le clic affiche « Bientôt disponible ».

## 3. Packs caméras à valider

Les packs actuels sont affichés avec la mention « tarif indicatif à revoir après étude de site ». Hypothèse utilisée : caméras HD, DVR/XVR, boîte d’alimentation, disque dur et pose standard.

À confirmer :

- [ ] Le pack 4 caméras à 200 000 FCFA est-il **installé** ou **matériel seul** ?
- [ ] Le disque dur est-il inclus ? Si oui, quelle capacité par pack ?
- [ ] La pose standard est-elle incluse ? Quelles limites : longueur de câble, hauteur, déplacement, percement, goulottes, onduleur, écran ?
- [ ] Prix définitifs des packs 8, 12, 16, 20 et 32 caméras.
- [ ] Les prix sont-ils HT ou TTC ? Quelles conditions de garantie et de paiement ?

## 4. Contenus de preuve à remplacer par du réel

Les éléments ci-dessous sont encore des exemples de démonstration et doivent être remplacés avant communication commerciale définitive :

- [ ] Chiffres : années d’expérience, nombre d’installations, clients, caméras, villes couvertes, taux de satisfaction.
- [ ] Témoignages clients : noms, fonctions/villes et autorisations de publication.
- [ ] Équipe : noms, rôles et photos réelles.
- [ ] Réalisations : photos de vos chantiers avec autorisation des clients, ville, type de site et équipements installés.
- [ ] Produits : marques réellement distribuées, références fournisseur, disponibilité, garanties et photos produits propres.

## 5. Domaine, hébergement et SEO technique

- [ ] Choisir le domaine définitif. Les fichiers `robots.txt` et `sitemap.xml` utilisent pour le moment `https://www.touvoir.ci/` comme base de travail : remplacez ce domaine partout si besoin avant publication.
- [ ] Déposer le contenu du dossier `touvoir/` sur l’hébergement statique choisi.
- [ ] Vérifier que `robots.txt` et `sitemap.xml` sont accessibles à la racine du domaine.
- [ ] Soumettre le sitemap dans Google Search Console après mise en ligne.

## 6. Formulaires, Supabase et Vercel

État actuel : la base **Supabase** du projet `touvoir` est créée, les formulaires y enregistrent les demandes et le module d’e-mail automatique vers `touvoirci@gmail.com` est branché (fonction `notify-lead`). WhatsApp reste proposé en option après l’envoi.

- [x] Devis : table `quote_requests`, référence `TV-DEV-...`
- [x] Demande de prix produit : table `price_requests`, référence `TV-PRX-...`
- [x] Panne : table `fault_reports`, référence `TV-PAN-...`
- [x] RLS activé : insertion publique autorisée au statut `nouveau`, lecture publique des demandes interdite.
- [x] Projet **Vercel** `touvoir` créé avec les variables Supabase publiques ; voir `SUPABASE-VERCEL.md`.

À finaliser avant production :

- [ ] Vérifier que `WHATSAPP_NUMBER` et les liens `api.whatsapp.com/send?phone=...` restent alignés si le numéro change à l’avenir.
- [ ] Lancer le déploiement Vercel (dépôt Git ou Vercel CLI) et brancher le domaine définitif.
- [ ] Créer le premier utilisateur admin dans Supabase Auth + sa ligne `profiles` si une interface staff est ajoutée.
- [x] **Expéditeur e-mail activé** : clé Resend enregistrée comme secret Supabase `RESEND_API_KEY` ; envoi réel validé vers `touvoirci@gmail.com` (journal `notification_logs` = `envoye`).
- [ ] Sécurité : la première clé Resend ayant transité par cette conversation, créer plus tard une nouvelle clé Resend « Sending access », remplacer le secret Supabase, puis supprimer l’ancienne clé.
- [ ] Option pro : vérifier un domaine d’envoi dans Resend et remplacer `onboarding@resend.dev` par une adresse du domaine (secret `LEAD_FROM_EMAIL`).

## 7. Pages légales

Les pages « Mentions légales » et « Politique de confidentialité » sont créées et reliées depuis les pieds de page. Aucune référence administrative fictive n’y est affichée.

- [ ] Fournir puis ajouter les informations légales définitives : raison sociale exacte, RCCM / compte contribuable si applicables et responsable de publication nommé.
- [ ] Faire relire la politique de confidentialité par l’entreprise ou un conseil : durées de conservation réelles, responsable du traitement et modalités d’exercice des droits.
