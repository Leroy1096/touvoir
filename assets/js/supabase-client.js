/* ============================================================
   TOUVOIR — Mini-client Supabase (REST) pour site statique
   Insertion des demandes publiques sans dépendance externe.
   En cas d’échec, les formulaires gardent WhatsApp en secours ;
   seules les références de demandes sont conservées localement.
   ============================================================ */
(function(){
  'use strict';

  const cfg = window.TOUVOIR_SUPABASE || {};

  function isEnabled(){
    return !!(
      cfg.enabled &&
      cfg.url &&
      cfg.publishableKey &&
      !String(cfg.publishableKey).includes('REMPLACER')
    );
  }

  async function insert(table, payload){
    if(!isEnabled() || !window.fetch){
      return { ok:false, skipped:true };
    }

    try{
      const res = await fetch(String(cfg.url).replace(/\/$/, '') + '/rest/v1/' + encodeURIComponent(table), {
        method: 'POST',
        headers: {
          'apikey': cfg.publishableKey,
          'Authorization': 'Bearer ' + cfg.publishableKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload),
        keepalive: true
      });

      if(!res.ok){
        let details = '';
        try{ details = await res.text(); }catch(e){}
        return { ok:false, status:res.status, error:String(details || res.statusText).slice(0, 500) };
      }

      return { ok:true, status:res.status };
    }catch(err){
      return { ok:false, error:String((err && err.message) || err) };
    }
  }

  function makeRef(prefix){
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    return prefix + '-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + '-' + rand;
  }

  function sourceParams(){
    const out = {};
    try{
      const params = new URLSearchParams(window.location.search);
      params.forEach((value, key) => { if(value) out[key] = value; });
      if(document.referrer) out.referrer = document.referrer;
    }catch(e){}
    return out;
  }

  window.TouvoirDB = {
    insert,
    makeRef,
    sourceParams,
    pageUrl: () => window.location.href,
    userAgent: () => window.navigator ? (window.navigator.userAgent || '') : '',
    isEnabled
  };
})();
