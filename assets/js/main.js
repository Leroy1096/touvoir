/* ============================================================
   TOUVOIR — Interactions générales du site
   ============================================================ */
(function(){
  'use strict';
  const $  = (s, c) => (c||document).querySelector(s);
  const $$ = (s, c) => Array.from((c||document).querySelectorAll(s));

  /* ---------- Supabase + e-mail automatique des demandes (WhatsApp en option) ---------- */
  const DB = window.TouvoirDB || null;
  const EMAIL = window.TouvoirEmail || null;
  function makeRequestRef(prefix){
    if(DB && typeof DB.makeRef === 'function') return DB.makeRef(prefix);
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
    return prefix + '-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + '-' + rand;
  }
  function dbMeta(){
    return {
      source: 'site_web',
      source_params: DB && typeof DB.sourceParams === 'function' ? DB.sourceParams() : {},
      page_url: window.location.href,
      user_agent: window.navigator ? (window.navigator.userAgent || '') : ''
    };
  }
  function urgencyLevel(label){
    const txt = String(label || '').toLowerCase();
    if(txt.includes('très urgente') || txt.includes('tres urgente')) return 3;
    if(txt.includes('urgente')) return 2;
    return 1;
  }
  async function saveLead(table, payload, successMessage, emailPayload){
    let dbRes = { ok:false, skipped:true };

    // 1) Enregistrement d'abord : la fonction e-mail ne notifie que
    //    les demandes réellement présentes dans Supabase.
    if(DB && typeof DB.insert === 'function'){
      try{
        dbRes = await DB.insert(table, payload);
      }catch(err){
        dbRes = { ok:false, error:String((err && err.message) || err) };
      }

      if(dbRes && dbRes.ok){
        try{ localStorage.setItem('touvoir_last_db_sync', new Date().toISOString()); }catch(e){}
        showToast('Demande enregistrée', successMessage);
      } else if(dbRes && !dbRes.skipped){
        try{ console.warn('Enregistrement Supabase non confirmé', table, dbRes); }catch(e){}
        showToast('Enregistrement en ligne non confirmé', 'Utilisez le bouton WhatsApp ou appelez le +225 01 40 81 04 15 pour une prise en charge immédiate.', 'error');
      }
    }

    // 2) E-mail ensuite. En cas d'indisponibilité de la base, les
    //    canaux de secours éventuellement configurés restent essayés.
    if(EMAIL && typeof EMAIL.send === 'function' && emailPayload){
      try{
        const res = await EMAIL.send(emailPayload);
        if(res && res.ok){
          try{ localStorage.setItem('touvoir_last_email_sync', new Date().toISOString() + '|' + (res.provider || 'email')); }catch(e){}
        } else {
          try{ console.info('Notification e-mail non confirmée (demande conservée dans Supabase)', res); }catch(e){}
        }
      }catch(e){}
    }
    return dbRes;
  }

  function rememberRequest(storageKey, type, reference, createdAt){
    // Ne jamais conserver les coordonnées complètes du visiteur dans
    // le navigateur : seule la référence de suivi est gardée.
    try{
      const old = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const minimal = old.filter(item => item && item.ref).map(item => ({
        ref: item.ref,
        type: item.type || type,
        createdAt: item.createdAt || ''
      }));
      minimal.push({ ref: reference, type: type, createdAt: createdAt });
      localStorage.setItem(storageKey, JSON.stringify(minimal.slice(-20)));
    }catch(e){}
  }

  /* ---------- Année automatique ---------- */
  $$('.js-year').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Header : ombre au défilement ---------- */
  const header = $('.header');
  const backtop = $('.backtop');
  function onScroll(){
    const y = window.scrollY;
    if(header) header.classList.toggle('scrolled', y > 10);
    if(backtop) backtop.classList.toggle('show', y > 500);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if(backtop) backtop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger'), nav = $('.nav');
  if(burger && nav){
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    document.addEventListener('click', e => {
      if(nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target))
        nav.classList.remove('open');
    });
  }

  /* ---------- Animations à l’apparition ---------- */
  const revealEls = $$('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  /* ---------- Compteurs animés ---------- */
  const counters = $$('[data-count]');
  if(counters.length){
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        io2.unobserve(en.target);
        const target = parseInt(en.target.dataset.count, 10);
        const suffix = en.target.dataset.suffix || '';
        const dur = 1600, t0 = performance.now();
        (function tick(now){
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          en.target.textContent = String(Math.round(target * eased));
          if(suffix){
            const suffixEl = document.createElement('em');
            suffixEl.textContent = suffix;
            en.target.appendChild(suffixEl);
          }
          if(p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, {threshold:.5});
    counters.forEach(c => io2.observe(c));
  }

  /* ---------- Carrousel témoignages ---------- */
  const track = $('.testi-track');
  if(track){
    const slides = $$('.testi-slide', track);
    const dotsBox = $('.testi-dots');
    let idx = 0, timer;
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.setAttribute('aria-label', 'Témoignage ' + (i+1));
      d.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(d);
    });
    const dots = $$('button', dotsBox);
    function go(i){
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach((d, j) => d.classList.toggle('active', j === idx));
    }
    function restart(){ clearInterval(timer); timer = setInterval(() => go(idx + 1), 5500); }
    const prev = $('.testi-prev'), next = $('.testi-next');
    if(prev) prev.addEventListener('click', () => { go(idx - 1); restart(); });
    if(next) next.addEventListener('click', () => { go(idx + 1); restart(); });
    let startX = null;
    track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
    track.addEventListener('touchend', e => {
      if(startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if(Math.abs(dx) > 45){ go(idx + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    }, {passive:true});
    go(0); restart();
  }

  /* ---------- FAQ accordéon ---------- */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item), a = $('.faq-a', item);
    if(!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach(o => { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = '0px'; $('.faq-q', o).setAttribute('aria-expanded','false'); });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded','true');
      }
    });
  });

  /* ---------- Système de notifications (toast) ---------- */
  const toastBox = document.createElement('div');
  toastBox.className = 'toast-box';
  toastBox.setAttribute('aria-live','polite');
  document.body.appendChild(toastBox);

  const TOAST_ICONS = {
    success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };
  window.showToast = function(title, message, type){
    type = type === 'error' ? 'error' : 'success';
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');

    const icon = document.createElement('span');
    icon.className = 't-icon';
    icon.innerHTML = TOAST_ICONS[type]; // SVG interne de confiance uniquement.

    const body = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = String(title || '');
    const text = document.createElement('span');
    text.textContent = String(message || '');
    body.append(strong, text);

    t.append(icon, body);
    toastBox.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, 4600);
  };

  /* ---------- WhatsApp dans un aperçu intégré (iframe) ---------- */
  // Sur le site ouvert normalement, les liens restent des ancres HTML
  // natives. En revanche, certains aperçus intégrés chargent
  // api.whatsapp.com dans leur cadre ; WhatsApp refuse alors
  // l'affichage et l'utilisateur voit une page blanche. Ce contournement
  // ne s'active donc que si la page est réellement dans une iframe.
  (function setupEmbeddedWhatsApp(){
    let embedded = false;
    try{ embedded = window.self !== window.top; }catch(e){ embedded = true; }
    if(!embedded) return;

    function parseWhatsAppUrl(raw){
      try{
        const url = new URL(raw, window.location.href);
        if(!['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) return null;
        let phone = '';
        if(url.hostname === 'wa.me') phone = url.pathname.replace(/\D/g, '');
        else phone = String(url.searchParams.get('phone') || '').replace(/\D/g, '');
        if(!phone && typeof WHATSAPP_NUMBER !== 'undefined') phone = String(WHATSAPP_NUMBER).replace(/\D/g, '');
        if(!phone) return null;
        return { phone, text: url.searchParams.get('text') || '', webUrl: url.href };
      }catch(e){ return null; }
    }

    async function copyText(value){
      try{
        if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
          await navigator.clipboard.writeText(value);
          return true;
        }
      }catch(e){}
      try{
        const area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(area);
        area.select();
        area.setSelectionRange(0, area.value.length);
        const ok = document.execCommand && document.execCommand('copy');
        area.remove();
        return !!ok;
      }catch(e){ return false; }
    }

    function showEmbeddedHelp(info){
      const old = document.getElementById('wa-embedded-help');
      if(old) old.remove();

      const overlay = document.createElement('div');
      overlay.id = 'wa-embedded-help';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'wa-embedded-help-title');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(7,24,44,.72);backdrop-filter:blur(3px)';

      const card = document.createElement('div');
      card.style.cssText = 'width:min(420px,100%);background:#fff;color:#16283C;border-radius:20px;padding:26px 24px;box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:left';

      const title = document.createElement('h3');
      title.id = 'wa-embedded-help-title';
      title.textContent = 'Ouvrir WhatsApp';
      title.style.cssText = 'margin:0 0 10px;font-size:1.25rem;color:#0B1F3A';

      const message = document.createElement('p');
      message.textContent = 'Cet aperçu bloque l’ouverture des applications externes. Essayez le bouton d’application ci-dessous ; si rien ne se passe, copiez le lien, fermez l’aperçu, ouvrez un nouvel onglet du navigateur puis collez le lien.';
      message.style.cssText = 'margin:0 0 18px;color:#5C6F82;line-height:1.55;font-size:.95rem';

      const phone = document.createElement('p');
      phone.textContent = 'WhatsApp TOUVOIR : +225 01 40 81 04 15';
      phone.style.cssText = 'margin:0 0 18px;font-weight:800;color:#128C4B';

      const ua = navigator.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      let openApp = null;
      if(isMobile){
        openApp = document.createElement('a');
        openApp.href = 'whatsapp://send?phone=' + encodeURIComponent(info.phone) + '&text=' + encodeURIComponent(info.text);
        openApp.textContent = 'Ouvrir dans l’application WhatsApp';
        openApp.style.cssText = 'display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border-radius:12px;padding:13px 16px;background:#128C4B;color:#fff;font-weight:800;cursor:pointer;margin-bottom:10px';
      }

      const copyLink = document.createElement('button');
      copyLink.type = 'button';
      copyLink.textContent = 'Copier le lien WhatsApp';
      copyLink.style.cssText = 'width:100%;border:0;border-radius:12px;padding:13px 16px;background:#25D366;color:#07351d;font-weight:800;cursor:pointer;margin-bottom:10px';
      copyLink.addEventListener('click', async () => {
        const ok = await copyText(info.webUrl);
        showToast(ok ? 'Lien WhatsApp copié' : 'Copie impossible', ok ? 'Collez-le dans Chrome ou Safari pour ouvrir la conversation.' : 'Composez directement le +225 01 40 81 04 15 dans WhatsApp.', ok ? 'success' : 'error');
        if(ok) overlay.remove();
      });

      const copyPhone = document.createElement('button');
      copyPhone.type = 'button';
      copyPhone.textContent = 'Copier le numéro';
      copyPhone.style.cssText = 'width:100%;border:1.5px solid #145DA0;border-radius:12px;padding:12px 16px;background:#fff;color:#145DA0;font-weight:800;cursor:pointer;margin-bottom:10px';
      copyPhone.addEventListener('click', async () => {
        const ok = await copyText('+2250140810415');
        showToast(ok ? 'Numéro copié' : 'Copie impossible', ok ? 'Collez ce numéro dans WhatsApp pour démarrer la conversation.' : 'Le numéro est +225 01 40 81 04 15.', ok ? 'success' : 'error');
        if(ok) overlay.remove();
      });

      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = 'Fermer';
      close.style.cssText = 'width:100%;border:0;border-radius:12px;padding:11px 16px;background:#EDF1F5;color:#16283C;font-weight:700;cursor:pointer';
      close.addEventListener('click', () => overlay.remove());

      overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
      overlay.addEventListener('keydown', e => { if(e.key === 'Escape') overlay.remove(); });
      card.append(title, message, phone);
      if(openApp) card.appendChild(openApp);
      card.append(copyLink, copyPhone, close);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      (openApp || copyLink).focus();
    }

    document.addEventListener('click', event => {
      if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if(!link) return;
      const info = parseWhatsAppUrl(link.href);
      if(!info) return;

      // Empêche la navigation de l'iframe vers api.whatsapp.com
      // (page blanche « n’autorise pas la connexion »).
      event.preventDefault();
      event.stopPropagation();

      let leftPage = false;
      const markLeft = () => { leftPage = true; };
      document.addEventListener('visibilitychange', () => { if(document.hidden) markLeft(); }, { once:true });
      window.addEventListener('pagehide', markLeft, { once:true });

      // Important : dans ce cadre, ne jamais relancer une URL HTTPS
      // WhatsApp (window.open ou target=_top). Certains navigateurs
      // mobiles la rechargent alors dans l'iframe, ce qui reproduit
      // exactement la page blanche « n’autorise pas la connexion ».
      const ua = navigator.userAgent || '';
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if(!isMobile){
        showEmbeddedHelp(info);
        return;
      }

      // Schéma natif : sur mobile, il vise directement l'application
      // installée sans passer par la page web api.whatsapp.com. Si le
      // cadre bloque aussi ce schéma, la page reste affichée et l'aide
      // de copie apparaît.
      window.location.href = 'whatsapp://send?phone=' + encodeURIComponent(info.phone) + '&text=' + encodeURIComponent(info.text);
      setTimeout(() => {
        if(!leftPage && !document.hidden) showEmbeddedHelp(info);
      }, 1000);
    }, true);
  })();

  /* ---------- Réseaux sociaux (URL à compléter dans data.js) ---------- */
  $$('[data-social-link]').forEach(link => {
    const key = link.dataset.socialLink;
    const url = (typeof SOCIAL_LINKS !== 'undefined' && SOCIAL_LINKS[key]) ? String(SOCIAL_LINKS[key]).trim() : '';
    if(url){
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.classList.remove('is-pending');
    } else {
      link.href = '#';
      link.classList.add('is-pending');
      link.addEventListener('click', e => {
        e.preventDefault();
        showToast('Bientôt disponible', 'Retrouvez bientôt TOUVOIR sur ce réseau social.');
      });
    }
  });

  /* ---------- WhatsApp ---------- */
  // Aucune interception JavaScript : les boutons sont des ancres HTML
  // natives en target="_blank", y compris sur mobile.

  /* ---------- Packs vidéosurveillance ---------- */
  const packGrids = $$('[data-packs-grid]');
  if(packGrids.length && typeof PACKS !== 'undefined'){
    const checkIcon = (typeof ICONS !== 'undefined' && ICONS.check) ? ICONS.check : '✓';
    const waIcon = (typeof ICONS !== 'undefined' && ICONS.wa) ? ICONS.wa : '';
    const money = (typeof prixFCFA === 'function') ? prixFCFA : (n => n + ' FCFA');
    function packCard(pack){
      const title = 'Pack ' + pack.cameras + ' caméras ' + pack.name + ' — ' + money(pack.price);
      const contactUrl = 'contact.html?pack=' + encodeURIComponent(title);
      const waUrl = (typeof waLink === 'function')
        ? waLink('Bonjour TOUVOIR, je souhaite un devis pour le ' + title + '. Merci de me recontacter pour l’étude de site.')
        : '#';
      const features = [
        pack.cameras + ' caméras HD intérieur / extérieur',
        pack.dvr,
        pack.power,
        pack.hdd,
        'Pose standard + vision sur smartphone'
      ];
      return `
      <article class="pack-card${pack.featured ? ' featured' : ''}">
        <div class="pack-top"><span class="pack-kicker">Pack ${escapeHtml(pack.cameras)} caméras</span><span class="pack-badge">${escapeHtml(pack.badge)}</span></div>
        <h3>${escapeHtml(pack.name)}</h3>
        <p class="pack-usage">${escapeHtml(pack.usage)}</p>
        <div class="pack-price"><span>À partir de</span><strong>${escapeHtml(money(pack.price))}</strong><small>Tarif indicatif à revoir après étude de site</small></div>
        <ul class="pack-list">${features.map(f => `<li><span class="pack-check" aria-hidden="true">${checkIcon}</span><span>${escapeHtml(f)}</span></li>`).join('')}</ul>
        <div class="pack-actions">
          <a class="btn btn-primary" href="${escapeAttr(contactUrl)}">Demander ce pack</a>
          <a class="btn-wa-mini" href="${escapeAttr(waUrl)}" target="_blank" rel="noopener" aria-label="Demander le ${escapeAttr(title)} sur WhatsApp" title="WhatsApp">${waIcon}</a>
        </div>
      </article>`;
    }
    packGrids.forEach(grid => {
      const limit = parseInt(grid.getAttribute('data-packs-grid'), 10);
      const list = (Number.isFinite(limit) && limit > 0) ? PACKS.slice(0, limit) : PACKS;
      grid.innerHTML = list.map(packCard).join('');
    });
  }

  /* ---------- Modales (ouverture / fermeture générique) ---------- */
  window.openModal = function(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add('open');
    document.body.classList.add('no-scroll');
    const f = m.querySelector('input, select, textarea, button.modal-close');
    if(f) setTimeout(() => f.focus({preventScroll:true}), 120);
  };
  window.closeModal = function(m){
    if(typeof m === 'string') m = document.getElementById(m);
    if(!m) return;
    m.classList.remove('open');
    document.body.classList.remove('no-scroll');
  };
  $$('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', e => { if(e.target === bd) window.closeModal(bd); });
    $$('[data-close]', bd).forEach(btn => btn.addEventListener('click', () => window.closeModal(bd)));
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') $$('.modal-backdrop.open').forEach(m => window.closeModal(m));
  });

  /* ---------- Validation de formulaires ---------- */
  function validateForm(form){
    let valid = true, firstBad = null;
    $$('[required]', form).forEach(field => {
      const group = field.closest('.form-group');
      let ok = field.value.trim() !== '';
      if(ok && field.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      if(ok && field.type === 'tel')   ok = field.value.replace(/[\s.\-()]/g,'').length >= 8;
      if(group) group.classList.toggle('error', !ok);
      if(!ok){ valid = false; if(!firstBad) firstBad = field; }
      field.addEventListener('input', () => { if(group) group.classList.remove('error'); }, {once:true});
    });
    if(firstBad) firstBad.focus();
    return valid;
  }
  window.validateForm = validateForm;

  /* Formulaire de contact / devis (page Contact) */
  const contactForm = $('#contact-form');
  if(contactForm){
    /* Pré-remplissage depuis l’URL (?service=… ou ?produit=…) */
    const params = new URLSearchParams(location.search);
    const serviceSel = $('#cf-service', contactForm);
    const msgField = $('#cf-message', contactForm);
    if(params.get('service') && serviceSel){
      const wanted = params.get('service');
      $$('option', serviceSel).forEach(o => { if(o.value === wanted) serviceSel.value = wanted; });
    }
    if(params.get('produit') && msgField){
      const p = params.get('produit');
      msgField.value = 'Bonjour, je souhaite obtenir le prix du produit suivant : ' + p + '. Merci de me recontacter pour plus d’informations.';
      if(serviceSel) serviceSel.value = 'produit';
      setTimeout(() => showToast('Produit ajouté à votre demande', 'Le produit « ' + p + ' » a été pré-rempli dans le formulaire.'), 600);
    }

    if(params.get('pack') && msgField){
      const pk = params.get('pack');
      msgField.value = 'Bonjour TOUVOIR, je souhaite un devis pour le ' + pk + '. Merci de me recontacter pour l’étude de site et la confirmation du tarif.';
      if(serviceSel && $$('option', serviceSel).some(o => o.value === 'pack-videosurveillance')) serviceSel.value = 'pack-videosurveillance';
      else if(serviceSel) serviceSel.value = 'installation-cctv';
      setTimeout(() => showToast('Pack ajouté à votre demande', 'Le pack choisi a été pré-rempli dans le formulaire.'), 600);
    }

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      if(!validateForm(contactForm)){
        showToast('Formulaire incomplet', 'Merci de vérifier les champs entourés en rouge.', 'error');
        return;
      }
      const field = id => {
        const el = document.getElementById(id);
        return el && el.value ? el.value.trim() : '';
      };
      const selectedService = (serviceSel && serviceSel.options && serviceSel.selectedIndex >= 0)
        ? serviceSel.options[serviceSel.selectedIndex].textContent.trim()
        : field('cf-service');
      const now = new Date();
      const ref = makeRequestRef('TV-DEV');
      const data = {
        ref: ref,
        nom: field('cf-nom'),
        tel: field('cf-tel'),
        email: field('cf-email'),
        service: selectedService,
        serviceValue: field('cf-service'),
        message: field('cf-message'),
        source: location.search ? location.search.slice(1) : 'formulaire-contact',
        createdAt: now.toISOString()
      };
      const lines = [
        'NOUVELLE DEMANDE DE DEVIS — TOUVOIR',
        'Référence : ' + data.ref,
        '',
        'CLIENT',
        'Nom : ' + data.nom,
        'Téléphone / WhatsApp : ' + data.tel,
        'E-mail : ' + data.email,
        '',
        'DEMANDE',
        'Type de service : ' + data.service
      ];
      if(params.get('pack')) lines.push('Pack sélectionné : ' + params.get('pack'));
      if(params.get('produit')) lines.push('Produit sélectionné : ' + params.get('produit'));
      if(params.get('service')) lines.push('Service choisi depuis le site : ' + params.get('service'));
      lines.push('', 'Description du besoin :', data.message, '', 'Merci de me recontacter pour l’étude de site et le devis.');
      const message = lines.join('\n');
      const url = (typeof waLink === 'function') ? waLink(message) : 'https://wa.me/2250140810415?text=' + encodeURIComponent(message);
      rememberRequest('touvoir_devis', 'devis', data.ref, data.createdAt);
      saveLead('quote_requests', Object.assign({
        reference: data.ref,
        customer_name: data.nom,
        phone: data.tel,
        email: data.email || null,
        service_slug: data.serviceValue || null,
        service_label: data.service || null,
        selected_pack: params.get('pack') || null,
        selected_product: params.get('produit') || null,
        message: data.message,
        status: 'nouveau'
      }, dbMeta()), 'Votre demande de devis est transmise par e-mail à notre équipe et enregistrée dans notre système de suivi.', {
        type: 'devis',
        reference: data.ref,
        subject: '[TOUVOIR] Nouvelle demande de devis ' + data.ref,
        text: message,
        replyTo: data.email,
        name: data.nom,
        phone: data.tel,
        fields: {
          'Référence': data.ref,
          'Nom': data.nom,
          'Téléphone / WhatsApp': data.tel,
          'E-mail': data.email,
          'Type de service': data.service,
          'Pack sélectionné': params.get('pack') || '',
          'Produit sélectionné': params.get('produit') || '',
          'Message': data.message
        }
      });
      const ok = $('#form-success');
      const waBtn = $('#contact-wa-send');
      const refEl = $('#contact-ref');
      const sumEl = $('#contact-summary');
      if(waBtn) waBtn.href = url;
      if(refEl) refEl.textContent = data.ref;
      if(sumEl) sumEl.textContent = data.nom + ' · ' + data.service;
      contactForm.style.display = 'none';
      if(ok) ok.classList.add('show');
      showToast('Demande envoyée', 'Merci ! Votre demande part automatiquement par e-mail à notre équipe. Référence ' + data.ref + '.');
      if(ok) ok.scrollIntoView({behavior:'smooth', block:'center'});
    });

    const again = $('#success-again');
    if(again) again.addEventListener('click', () => {
      contactForm.reset();
      contactForm.style.display = '';
      $('#form-success').classList.remove('show');
    });
  }

  /* Formulaire de signalement de panne (page Panne) */
  const panneForm = $('#panne-form');
  if(panneForm){
    const field = id => {
      const el = document.getElementById(id);
      return el && el.value ? el.value.trim() : '';
    };
    panneForm.addEventListener('submit', e => {
      e.preventDefault();
      if(!validateForm(panneForm)){
        showToast('Signalement incomplet', 'Merci de vérifier les champs entourés en rouge : nom, téléphone, ville et description de la panne.', 'error');
        return;
      }
      const now = new Date();
      const ref = makeRequestRef('TV-PAN');
      const data = {
        ref: ref,
        nom: field('pf-nom'),
        tel: field('pf-tel'),
        email: field('pf-email'),
        ville: field('pf-ville'),
        quartier: field('pf-quartier'),
        typeClient: field('pf-client'),
        equipement: field('pf-equipement'),
        cameras: field('pf-cameras'),
        depuis: field('pf-depuis'),
        urgence: field('pf-urgence'),
        disponibilite: field('pf-disponibilite'),
        description: field('pf-description'),
        createdAt: now.toISOString()
      };
      const lines = [
        'NOUVEAU SIGNALEMENT DE PANNE — TOUVOIR',
        'Référence : ' + data.ref,
        '',
        'CLIENT',
        'Nom : ' + data.nom,
        'Téléphone / WhatsApp : ' + data.tel
      ];
      if(data.email) lines.push('E-mail : ' + data.email);
      lines.push(
        '',
        'LOCALISATION',
        'Ville : ' + data.ville,
        'Quartier / adresse du site : ' + data.quartier,
        '',
        'PANNE SIGNALÉE',
        'Type de client : ' + data.typeClient,
        'Équipement concerné : ' + data.equipement,
        'Nombre de caméras : ' + (data.cameras || 'Non précisé'),
        'Panne constatée depuis : ' + (data.depuis || 'Non précisé'),
        'Niveau d’urgence : ' + data.urgence,
        'Description : ' + data.description,
        '',
        'Disponibilité pour intervention : ' + (data.disponibilite || 'À convenir')
      );
      const message = lines.join('\n');
      const url = (typeof waLink === 'function') ? waLink(message) : 'https://wa.me/2250140810415?text=' + encodeURIComponent(message);
      rememberRequest('touvoir_pannes', 'panne', data.ref, data.createdAt);
      const camerasCount = parseInt(data.cameras, 10);
      saveLead('fault_reports', Object.assign({
        reference: data.ref,
        customer_name: data.nom,
        phone: data.tel,
        email: data.email || null,
        city: data.ville,
        district: data.quartier,
        customer_situation: data.typeClient || null,
        equipment_type: data.equipement,
        cameras_count: Number.isFinite(camerasCount) ? camerasCount : null,
        problem_since_label: data.depuis || null,
        urgency_label: data.urgence,
        urgency_level: urgencyLevel(data.urgence),
        availability_label: data.disponibilite || null,
        description: data.description,
        status: 'nouveau'
      }, dbMeta()), 'Votre signalement est transmis par e-mail à notre équipe technique et enregistré dans notre système de suivi.', {
        type: 'panne',
        reference: data.ref,
        subject: '[TOUVOIR][PANNE] ' + data.ref + ' — ' + data.ville + ' — ' + data.urgence,
        text: message,
        replyTo: data.email,
        name: data.nom,
        phone: data.tel,
        fields: {
          'Référence': data.ref,
          'Nom': data.nom,
          'Téléphone / WhatsApp': data.tel,
          'E-mail': data.email || '',
          'Ville': data.ville,
          'Quartier / adresse': data.quartier,
          'Type de client': data.typeClient,
          'Équipement': data.equipement,
          'Nombre de caméras': data.cameras || '',
          'Depuis': data.depuis || '',
          'Urgence': data.urgence,
          'Disponibilité': data.disponibilite || '',
          'Description': data.description
        }
      });
      const success = $('#panne-success');
      const waBtn = $('#panne-wa-send');
      const refEl = $('#panne-ref');
      const sumEl = $('#panne-summary');
      if(waBtn) waBtn.href = url;
      if(refEl) refEl.textContent = data.ref;
      if(sumEl) sumEl.textContent = data.nom + ' · ' + data.ville + ' · ' + data.equipement + ' · Urgence : ' + data.urgence;
      panneForm.style.display = 'none';
      if(success) success.classList.add('show');
      showToast('Signalement envoyé', 'Merci ! Votre panne part automatiquement par e-mail à notre équipe technique. Référence ' + data.ref + '.');
      if(success) success.scrollIntoView({behavior:'smooth', block:'center'});
    });
    const panneAgain = $('#panne-again');
    if(panneAgain) panneAgain.addEventListener('click', () => {
      panneForm.reset();
      panneForm.style.display = '';
      const success = $('#panne-success');
      if(success) success.classList.remove('show');
    });
  }

  /* Mini-formulaires (demande de prix produit) */
  $$('.js-mini-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if(!validateForm(form)){
        showToast('Formulaire incomplet', 'Merci de renseigner votre nom et votre téléphone.', 'error');
        return;
      }
      const backdrop = form.closest('.modal-backdrop');
      const byId = id => document.getElementById(id);
      const value = id => {
        const el = byId(id);
        return el && el.value ? el.value.trim() : '';
      };
      const text = id => {
        const el = byId(id);
        return el ? el.textContent.trim() : '';
      };
      const installSel = byId('pm-install');
      const installLabel = (installSel && installSel.options && installSel.selectedIndex >= 0)
        ? installSel.options[installSel.selectedIndex].textContent.trim()
        : value('pm-install');
      const now = new Date();
      const ref = makeRequestRef('TV-PRX');
      const data = {
        ref: ref,
        produit: text('pm-product-name') || 'Produit TOUVOIR',
        referenceProduit: text('pm-product-ref'),
        nom: value('pm-nom'),
        tel: value('pm-tel'),
        quantite: value('pm-qte') || '1',
        installation: installLabel,
        message: value('pm-msg'),
        createdAt: now.toISOString()
      };
      const lines = [
        'NOUVELLE DEMANDE DE PRIX — TOUVOIR',
        'Référence : ' + data.ref,
        '',
        'CLIENT',
        'Nom : ' + data.nom,
        'Téléphone / WhatsApp : ' + data.tel,
        '',
        'PRODUIT',
        'Produit : ' + data.produit
      ];
      if(data.referenceProduit) lines.push(data.referenceProduit);
      lines.push('Quantité souhaitée : ' + data.quantite, 'Installation : ' + data.installation);
      if(data.message) lines.push('', 'Message :', data.message);
      lines.push('', 'Merci de me communiquer le prix et la disponibilité.');
      const message = lines.join('\n');
      const url = (typeof waLink === 'function') ? waLink(message) : 'https://wa.me/2250140810415?text=' + encodeURIComponent(message);
      rememberRequest('touvoir_demandes_prix', 'prix', data.ref, data.createdAt);
      const productRefMatch = data.referenceProduit ? data.referenceProduit.match(/TV-[A-Z0-9-]+/) : null;
      const quantityValue = parseInt(data.quantite, 10);
      saveLead('price_requests', Object.assign({
        reference: data.ref,
        customer_name: data.nom,
        phone: data.tel,
        email: null,
        product_reference: productRefMatch ? productRefMatch[0] : (data.referenceProduit || null),
        product_name: data.produit,
        quantity: Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1,
        installation_option: value('pm-install') || null,
        installation_label: data.installation || null,
        message: data.message || null,
        status: 'nouveau'
      }, dbMeta()), 'Votre demande de prix est transmise par e-mail à notre équipe et enregistrée dans notre système de suivi.', {
        type: 'prix',
        reference: data.ref,
        subject: '[TOUVOIR] Nouvelle demande de prix ' + data.ref + ' — ' + data.produit,
        text: message,
        replyTo: '',
        name: data.nom,
        phone: data.tel,
        fields: {
          'Référence demande': data.ref,
          'Nom': data.nom,
          'Téléphone / WhatsApp': data.tel,
          'Produit': data.produit,
          'Référence produit': data.referenceProduit || '',
          'Quantité': data.quantite,
          'Installation': data.installation,
          'Message': data.message || ''
        }
      });
      const pmWa = byId('pm-wa');
      if(pmWa) pmWa.href = url;
      if(backdrop) window.closeModal(backdrop);
      showToast('Demande envoyée', 'Merci ! Votre demande de prix part automatiquement par e-mail à notre équipe. Référence ' + data.ref + '.');
      form.reset();
      const qte = byId('pm-qte');
      if(qte) qte.value = '1';
    });
  });
})();
