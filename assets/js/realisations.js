/* ============================================================
   TOUVOIR — Réalisations : galerie filtrable + lightbox
   ============================================================ */
(function(){
  'use strict';
  const grid     = document.getElementById('projects-grid');
  const chipsBox = document.getElementById('project-chips');
  if(!grid || typeof PROJECTS === 'undefined') return;

  let activeCat = 'tous';
  let currentList = PROJECTS.slice();
  let currentIdx = 0;

  /* ---------- Filtres ---------- */
  const cats = [['tous','Tous les projets']].concat(Object.entries(PROJECT_CATS));
  chipsBox.innerHTML = cats.map(([key,label], i) =>
    `<button type="button" class="chip${i===0 ? ' active' : ''}" data-cat="${escapeAttr(key)}">${escapeHtml(label)}</button>`).join('');

  chipsBox.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if(!chip) return;
    chipsBox.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCat = chip.dataset.cat;
    render();
  });

  /* ---------- Rendu de la galerie ---------- */
  function render(){
    currentList = PROJECTS.filter(p => activeCat === 'tous' || p.cat === activeCat);
    grid.innerHTML = currentList.map((p, i) => `
      <button type="button" class="real-card" data-idx="${i}" aria-label="Voir le projet : ${escapeAttr(p.title)}">
        <img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.title)} — ${escapeAttr(p.lieu)}" loading="lazy">
        <span class="real-zoom">${ICONS.zoom}</span>
        <span class="real-overlay">
          <span class="real-cat">${escapeHtml(PROJECT_CATS[p.cat])}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${ICONS.pin} ${escapeHtml(p.lieu)} · ${escapeHtml(p.meta[0])}</p>
        </span>
      </button>`).join('');
  }
  render();

  /* ---------- Lightbox ---------- */
  const lbImg   = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbDesc  = document.getElementById('lb-desc');
  const lbMeta  = document.getElementById('lb-meta');
  const lbCount = document.getElementById('lb-count');
  const lbCta   = document.getElementById('lb-cta');

  function show(i){
    currentIdx = (i + currentList.length) % currentList.length;
    const p = currentList[currentIdx];
    lbImg.src = p.img;
    lbImg.alt = p.title + ' — ' + p.lieu;
    lbTitle.textContent = p.title;
    lbDesc.textContent = p.desc;
    lbMeta.innerHTML = `<span>${ICONS.pin} ${escapeHtml(p.lieu)}</span>` + p.meta.map(m => `<span>${ICONS.check} ${escapeHtml(m)}</span>`).join('');
    lbCount.textContent = (currentIdx + 1) + ' / ' + currentList.length;
    lbCta.href = waLink('Bonjour TOUVOIR, je souhaite un projet similaire à : « ' + p.title + ' » (' + p.lieu + '). Pouvez-vous me faire un devis ?');
  }

  grid.addEventListener('click', e => {
    const card = e.target.closest('[data-idx]');
    if(!card) return;
    show(parseInt(card.dataset.idx, 10));
    window.openModal('lightbox');
  });

  document.getElementById('lb-prev').addEventListener('click', () => show(currentIdx - 1));
  document.getElementById('lb-next').addEventListener('click', () => show(currentIdx + 1));
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if(!lb.classList.contains('open')) return;
    if(e.key === 'ArrowLeft')  show(currentIdx - 1);
    if(e.key === 'ArrowRight') show(currentIdx + 1);
  });
})();
