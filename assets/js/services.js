/* ============================================================
   TOUVOIR — Page Services : grille + fiche détaillée
   ============================================================ */
(function(){
  'use strict';
  const grid = document.getElementById('services-grid');
  if(!grid || typeof SERVICES === 'undefined') return;

  /* ---------- Rendu des cartes services ---------- */
  grid.innerHTML = SERVICES.map((s, i) => `
    <article class="service-card reveal d${(i % 3) + 1}">
      <div class="service-media">
        <img src="${escapeAttr(s.img)}" alt="${escapeAttr(s.title)}" loading="lazy">
      </div>
      <div class="service-body">
        <span class="service-icon">${ICONS[s.icon] || ICONS.video}</span>
        <h3>${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.short)}</p>
        <button type="button" class="card-link" data-service="${escapeAttr(s.slug)}">En savoir plus ${ICONS.arrow}</button>
      </div>
    </article>`).join('');

  /* ---------- Fiche détaillée (modale) ---------- */
  const modal = document.getElementById('service-modal');
  function openService(slug){
    const s = SERVICES.find(x => x.slug === slug);
    if(!s || !modal) return;
    document.getElementById('sm-img').src = s.img;
    document.getElementById('sm-img').alt = s.title;
    document.getElementById('sm-title').textContent = s.title;
    document.getElementById('sm-desc').textContent = s.long;
    document.getElementById('sm-meta').innerHTML =
      `<span>${ICONS.users} ${escapeHtml(s.ideal)}</span><span>${ICONS.clock} ${escapeHtml(s.duree)}</span>`;
    document.getElementById('sm-includes').innerHTML = s.includes.map(item =>
      `<li><span class="ck">${ICONS.check}</span>${escapeHtml(item)}</li>`).join('');
    const serviceCta = document.getElementById('sm-cta');
    if(s.slug === 'maintenance-depannage'){
      serviceCta.href = 'panne.html';
      serviceCta.textContent = 'Signaler une panne';
    } else {
      serviceCta.href = 'contact.html?service=' + s.slug;
      serviceCta.textContent = 'Demander un devis pour ce service';
    }
    document.getElementById('sm-wa').href = waLink('Bonjour TOUVOIR, je suis intéressé par votre service : ' + s.title + '. Pouvez-vous me faire un devis ?');
    window.openModal('service-modal');
  }

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-service]');
    if(btn) openService(btn.dataset.service);
  });

  /* Ouverture automatique depuis un lien externe : services.html?s=slug */
  const wanted = new URLSearchParams(location.search).get('s');
  if(wanted) setTimeout(() => openService(wanted), 350);
})();
