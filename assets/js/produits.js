/* ============================================================
   TOUVOIR — Catalogue produits : recherche, filtres, tri
   ============================================================ */
(function(){
  'use strict';
  const grid     = document.getElementById('products-grid');
  const chipsBox = document.getElementById('cat-chips');
  const search   = document.getElementById('product-search');
  const sortSel  = document.getElementById('product-sort');
  const countEl  = document.getElementById('result-count');
  if(!grid || typeof PRODUCTS === 'undefined') return;

  let activeCat = 'tous';

  /* ---------- Filtres par catégorie ---------- */
  const cats = [['tous','Tous les produits']].concat(Object.entries(PRODUCT_CATS));
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

  /* ---------- Rendu des produits ---------- */
  function productCard(p){
    const badge = p.badge ? `<span class="p-badge ${escapeAttr(p.badge.c)}">${escapeHtml(p.badge.t)}</span>` : '';
    const wa = waLink('Bonjour TOUVOIR, je souhaite connaître le prix du produit : ' + p.name + ' (réf. ' + p.ref + ').');
    return `
    <article class="product-card">
      <div class="product-media">${badge}<img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.name)}" loading="lazy"></div>
      <div class="product-body">
        <p class="p-cat">${escapeHtml(PRODUCT_CATS[p.cat])}</p>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="p-ref">Référence : ${escapeHtml(p.ref)} · Garantie 2 ans</p>
        <ul class="p-specs">${p.specs.map(s => `<li>${ICONS.check}${escapeHtml(s)}</li>`).join('')}</ul>
        <div class="p-actions">
          <button type="button" class="btn btn-primary btn-sm" data-price="${escapeAttr(p.id)}">Demander le prix</button>
          <a class="btn-wa-mini" href="${escapeAttr(wa)}" target="_blank" rel="noopener" aria-label="Demander le prix de ${escapeAttr(p.name)} sur WhatsApp" title="WhatsApp">${ICONS.wa}</a>
        </div>
      </div>
    </article>`;
  }

  function getFiltered(){
    const q = (search.value || '').trim().toLowerCase();
    let list = PRODUCTS.filter(p => {
      const inCat = activeCat === 'tous' || p.cat === activeCat;
      const inSearch = !q || (p.name + ' ' + p.ref + ' ' + PRODUCT_CATS[p.cat] + ' ' + p.specs.join(' ')).toLowerCase().includes(q);
      return inCat && inSearch;
    });
    if(sortSel.value === 'az') list = list.slice().sort((a,b) => a.name.localeCompare(b.name, 'fr'));
    if(sortSel.value === 'za') list = list.slice().sort((a,b) => b.name.localeCompare(a.name, 'fr'));
    return list;
  }

  function render(){
    const list = getFiltered();
    countEl.innerHTML = list.length
      ? `<strong>${list.length}</strong> produit${list.length > 1 ? 's' : ''} trouvé${list.length > 1 ? 's' : ''}${activeCat !== 'tous' ? ' dans « ' + escapeHtml(PRODUCT_CATS[activeCat]) + ' »' : ''}`
      : '';
    grid.innerHTML = list.length ? list.map(productCard).join('') : `
      <div class="empty-state" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        <h3>Aucun produit trouvé</h3>
        <p>Essayez un autre mot-clé, ou contactez-nous : nous pouvons commander le matériel adapté à votre besoin.</p>
        <p style="margin-top:18px"><button type="button" class="btn btn-blue btn-sm" id="reset-filters">Réinitialiser les filtres</button></p>
      </div>`;
    const reset = document.getElementById('reset-filters');
    if(reset) reset.addEventListener('click', () => {
      search.value = ''; sortSel.value = 'pertinence'; activeCat = 'tous';
      chipsBox.querySelectorAll('.chip').forEach((c,i) => c.classList.toggle('active', i === 0));
      render();
    });
  }

  search.addEventListener('input', render);
  sortSel.addEventListener('change', render);
  render();

  /* ---------- Modale « Demander le prix » ---------- */
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-price]');
    if(!btn) return;
    const p = PRODUCTS.find(x => x.id === parseInt(btn.dataset.price, 10));
    if(!p) return;
    document.getElementById('pm-product-name').textContent = p.name;
    document.getElementById('pm-product-ref').textContent = 'Référence : ' + p.ref + ' · ' + PRODUCT_CATS[p.cat];
    document.getElementById('pm-img').src = p.img;
    document.getElementById('pm-img').alt = p.name;
    document.getElementById('pm-wa').href = waLink('Bonjour TOUVOIR, je souhaite connaître le prix du produit : ' + p.name + ' (réf. ' + p.ref + ').');
    window.openModal('price-modal');
  });

  /* Ouverture directe depuis un lien : produits.html?p=ID */
  const wantedId = new URLSearchParams(location.search).get('p');
  if(wantedId){
    const p = PRODUCTS.find(x => x.id === parseInt(wantedId, 10));
    if(p) setTimeout(() => {
      document.getElementById('pm-product-name').textContent = p.name;
      document.getElementById('pm-product-ref').textContent = 'Référence : ' + p.ref + ' · ' + PRODUCT_CATS[p.cat];
      document.getElementById('pm-img').src = p.img;
      document.getElementById('pm-img').alt = p.name;
      document.getElementById('pm-wa').href = waLink('Bonjour TOUVOIR, je souhaite connaître le prix du produit : ' + p.name + ' (réf. ' + p.ref + ').');
      window.openModal('price-modal');
    }, 350);
  }
})();
