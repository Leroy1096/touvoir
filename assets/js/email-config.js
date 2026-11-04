/* ============================================================
   TOUVOIR — Configuration des notifications e-mail automatiques

   Objectif : chaque devis, demande de prix et panne part
   automatiquement vers l’e-mail du site, en plus de
   l’enregistrement dans Supabase.

   Ordre d’essai (premier canal qui répond gagne) :
   1) Fonction Supabase `notify-lead` (envoi serveur via Resend,
      clé API à placer dans les secrets Supabase : RESEND_API_KEY).
   2) Web3Forms (clé d’accès publique gratuite à coller ci-dessous).
   3) FormSubmit (secours désactivé tant qu’il n’est pas activé dans la boîte e-mail).

   Statut au 03/11/2026 : le canal 1 est ACTIF. La clé Resend est
   enregistrée comme secret Supabase `RESEND_API_KEY` et un envoi
   réel vers touvouci@gmail.com a été validé.

   Aucune clé secrète ne doit être mise dans ce fichier :
   la clé Resend reste côté Supabase. Seule la clé publique
   Web3Forms peut être renseignée ici.
   ============================================================ */
window.TOUVOIR_EMAIL = {
  enabled: true,
  notifyEmail: 'touvoirci@gmail.com',

  supabaseFunction: {
    enabled: true,
    name: 'notify-lead'
  },

  web3forms: {
    enabled: true,
    accessKey: '' // À compléter : clé gratuite reçue par e-mail sur web3forms.com
  },

  formsubmit: {
    enabled: false,
    endpoint: 'https://formsubmit.co/ajax/touvoirci@gmail.com'
  }
};
