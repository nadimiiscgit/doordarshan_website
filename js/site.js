/* Public showroom runtime. Data is text-only at the DOM boundary. */
(function () {
  'use strict';
  const fallbackContent = {
    intro: 'At Doordarshan Electronics, browse at your own pace and speak with our team when you need help choosing.',
    address: 'Samta Colony, Dharashiv, Maharashtra',
    phone: '917020209281', whatsapp: '917020209281',
    store_image: '', category_images: {}, featured_ids: [], new_ids: []
  };
  const state = { content: fallbackContent, categories: [], snapshot: null };
  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page;

  function node(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value != null) el.textContent = String(value);
    return el;
  }
  function replace(target, children) { target.replaceChildren(...children); }
  function validImage(value) {
    const url = safeImageUrl(value);
    return url && !/\/brands?\//i.test(url) && !/brand_images/i.test(url) ? url : '';
  }
  function picture(url, alt) {
    const safe = validImage(url);
    if (!safe) return node('span', 'image-placeholder', 'Image coming soon');
    const image = node('img');
    image.src = safe; image.alt = alt; image.loading = 'lazy';
    image.addEventListener('error', () => image.replaceWith(node('span', 'image-placeholder', 'Image coming soon')), { once: true });
    return image;
  }
  function price(product, source) {
    const amount = Number(product.price);
    return source === 'live' && Number.isFinite(amount) && amount > 1
      ? `₹${amount.toLocaleString('en-IN')}` : 'Ask for current price';
  }
  function contact(message) {
    const phone = String(state.content.phone || '').replace(/\D/g, '');
    const whatsApp = String(state.content.whatsapp || '').replace(/\D/g, '');
    return {
      call: phone.length >= 10 ? `tel:+${phone}` : 'store.html',
      whatsapp: whatsApp.length >= 10 ? `https://wa.me/${whatsApp}?text=${encodeURIComponent(message)}` : 'store.html'
    };
  }
  function applyContactLinks() {
    const links = contact('Hello, I would like to enquire about products at Doordarshan Electronics. Please confirm current price and availability.');
    document.querySelectorAll('[data-call]').forEach(a => a.href = links.call);
    document.querySelectorAll('[data-whatsapp]').forEach(a => { a.href = links.whatsapp; a.rel = 'noopener noreferrer'; a.target = '_blank'; });
  }
  function card(product, source) {
    const a = node('a', 'product-card'); a.href = `product.html?id=${encodeURIComponent(product.id)}`;
    const media = node('div', 'product-media'); media.append(picture(product.image, product.name || 'Product'));
    const copy = node('div', 'product-copy');
    copy.append(node('small', '', product.brand || 'Electronics'), node('h3', '', product.name || 'Product'));
    if (product.model) copy.append(node('p', '', `Model ${product.model}`));
    const p = node('div', 'product-price', price(product, source));
    p.append(node('small', '', 'Confirm price and availability with the store'));
    copy.append(p); a.append(media, copy); return a;
  }
  function empty(message) { return node('div', 'empty-state', message); }
  function slugify(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function safeSnapshotProduct(item) {
    return { id: item.id, name: item.name, brand: item.brand, model: item.model,
      category: item.category, subcategory: item.subcategory, image: validImage(item.image), images: (Array.isArray(item.images) ? item.images : []).map(validImage).filter(Boolean),
      type: Array.isArray(item.type) ? item.type : [], specs: item.specs || {}, description: item.description || '', price: null };
  }
  async function snapshot() {
    if (state.snapshot) return state.snapshot;
    const response = await fetch('data/catalog-snapshot.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Snapshot unavailable');
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('Invalid snapshot');
    state.snapshot = { ...data, products: data.products.map(safeSnapshotProduct) };
    return state.snapshot;
  }
  async function withFallback(filters) {
    try { return await fetchPublicProducts(filters); }
    catch (error) {
      console.warn('Live catalogue unavailable; using reviewed snapshot.', error);
      try {
        const saved = await snapshot();
        let list = saved.products;
        if (filters.id != null) list = list.filter(p => String(p.id) === String(filters.id));
        if (filters.ids) list = list.filter(p => filters.ids.includes(Number(p.id)));
        if (filters.category) list = list.filter(p => p.category === filters.category);
        if (filters.subcategory) list = list.filter(p => p.subcategory === filters.subcategory);
        if (filters.brand) list = list.filter(p => p.brand === filters.brand);
        if (filters.search) { const q = filters.search.toLowerCase(); list = list.filter(p => `${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(q)); }
        const order = { name_asc: 1, name_desc: -1 }[filters.sort];
        if (order) list = [...list].sort((a, b) => order * a.name.localeCompare(b.name));
        const pageNumber = Math.max(1, Number(filters.page) || 1);
        const size = filters.pageSize || 12;
        return { products: list.slice((pageNumber - 1) * size, pageNumber * size), count: list.length,
          source: 'snapshot', capturedAt: saved.captured_at };
      } catch (snapshotError) {
        return { products: [], count: 0, source: 'unavailable' };
      }
    }
  }
  async function loadContent() {
    try {
      const row = await fetchPublishedSiteContent();
      if (row && row.published && typeof row.published === 'object') state.content = { ...fallbackContent, ...row.published };
    } catch (error) { console.warn('Published site content unavailable; using basic store contact.', error); }
    if (params.get('preview') === '1') {
      try { const draft = JSON.parse(localStorage.getItem('site-content-preview') || 'null'); if (draft) state.content = { ...state.content, ...draft }; }
      catch (error) { /* Invalid local preview is ignored. */ }
    }
    applyContactLinks();
    const address = document.getElementById('home-address') || document.getElementById('store-address');
    if (address) address.textContent = state.content.address || fallbackContent.address;
    const intro = document.getElementById('store-intro');
    if (intro) intro.textContent = state.content.intro || fallbackContent.intro;
    for (const [id, value] of [['hero-title', state.content.hero_title], ['hero-emphasis', state.content.hero_emphasis], ['hero-description', state.content.hero_description]]) {
      const element = document.getElementById(id);
      if (element && value) element.textContent = value;
    }
    const photo = document.getElementById('store-photo');
    if (photo && validImage(state.content.store_image)) replace(photo, [picture(state.content.store_image, 'Doordarshan Electronics showroom')]);
  }
  async function loadCategories() {
    state.categories = await fetchCategoriesFromDB();
    return state.categories;
  }
  function categoryLabel(key) { return state.categories.find(c => c.key === key)?.name || key; }
  async function home() {
    const categories = await loadCategories();
    const grid = document.getElementById('home-categories');
    replace(grid, categories.length ? categories.map(c => {
      const a = node('a', 'category-card'); a.href = `category.html?cat=${encodeURIComponent(c.key)}`;
      const symbol = node('span', 'category-symbol');
      const image = validImage(c.image);
      if (image) { const img = picture(image, ''); img.style.width = '58px'; img.style.height = '50px'; img.style.objectFit = 'cover'; img.style.borderRadius = '8px'; symbol.append(img); }
      else symbol.textContent = '↗';
      const name = node('div'); name.append(node('strong', '', c.name));
      if (c.description) name.append(node('small', '', c.description));
      a.append(symbol, name); return a;
    }) : [empty('Categories are being prepared. Please contact the store for help.')]);
    for (const [key, target] of [['featured_ids', 'featured-products'], ['new_ids', 'new-products']]) {
      const ids = (state.content[key] || []).map(Number).filter(Number.isSafeInteger).slice(0, 4);
      const container = document.getElementById(target);
      if (!ids.length) { replace(container, [empty('Our team is curating this section. Explore all products in the meantime.')]); continue; }
      const result = await withFallback({ ids, pageSize: 4 });
      const ordered = ids.map(id => result.products.find(p => Number(p.id) === id)).filter(Boolean);
      replace(container, ordered.length ? ordered.map(p => card(p, result.source)) : [empty('No approved products are ready for this section yet.')]);
    }
  }
  function currentFilters() {
    return { category: params.get('cat') || '', subcategory: params.get('sub') || '', brand: params.get('brand') || '',
      search: params.get('q') || '', sort: params.get('sort') || 'name_asc',
      page: Math.max(1, Number(params.get('page')) || 1), pageSize: 12 };
  }
  function pageLink(number, label, active) {
    const q = new URLSearchParams(location.search); q.set('page', String(number));
    const a = node('a', active ? 'current' : '', label); a.href = `category.html?${q}`;
    if (active) a.setAttribute('aria-current', 'page'); return a;
  }
  async function catalogue() {
    const categories = await loadCategories(); const filters = currentFilters();
    const form = document.getElementById('catalogue-filters');
    const catSelect = document.getElementById('filter-category');
    categories.forEach(c => { const o = node('option', '', c.name); o.value = c.key; catSelect.append(o); });
    catSelect.value = filters.category;
    const brandSelect = document.getElementById('filter-brand');
    try { (await fetchPublicBrands()).forEach(brand => { const o = node('option', '', brand); o.value = brand; brandSelect.append(o); }); }
    catch (error) { try { [...new Set((await snapshot()).products.map(p => p.brand).filter(Boolean))].sort().forEach(brand => { const o = node('option', '', brand); o.value = brand; brandSelect.append(o); }); } catch (ignored) {} }
    brandSelect.value = filters.brand;
    document.getElementById('filter-sort').value = filters.sort;
    document.getElementById('site-search').value = filters.search;
    form.addEventListener('submit', event => {
      event.preventDefault(); const q = new URLSearchParams();
      for (const [name, value] of [['cat', catSelect.value], ['sub', filters.subcategory], ['brand', brandSelect.value], ['sort', document.getElementById('filter-sort').value], ['q', document.getElementById('site-search').value]]) if (value) q.set(name, value);
      location.href = `category.html?${q}`;
    });
    const result = await withFallback(filters);
    const status = document.getElementById('catalogue-status');
    status.textContent = result.source === 'unavailable' ? 'The catalogue is temporarily unavailable. Please call or WhatsApp us.'
      : `${result.count} product${result.count === 1 ? '' : 's'}${filters.category ? ` in ${categoryLabel(filters.category)}` : ''}${result.source === 'snapshot' ? ` · Offline snapshot from ${result.capturedAt || 'an earlier date'}; confirm all details with us` : ''}`;
    replace(document.getElementById('catalogue-products'), result.products.length
      ? result.products.map(p => card(p, result.source))
      : [empty(result.source === 'live' ? 'No approved products match these filters. Try another search or ask our team.' : 'No reviewed catalogue entries are available offline. Please contact our team.')]);
    const pages = document.getElementById('catalogue-pages'); const count = Math.ceil(result.count / filters.pageSize);
    const links = [];
    if (filters.page > 1) links.push(pageLink(filters.page - 1, '← Previous'));
    for (let i = Math.max(1, filters.page - 2); i <= Math.min(count, filters.page + 2); i++) links.push(pageLink(i, i, i === filters.page));
    if (filters.page < count) links.push(pageLink(filters.page + 1, 'Next →'));
    replace(pages, links);
  }
  function detailMessage(product) { return `Hello, I am enquiring about ${product.name}${product.model ? ` (model ${product.model})` : ''}. ${location.href} Please confirm the current price and availability.`; }
  function renderDetail(product, source) {
    const holder = document.getElementById('product-detail'); holder.replaceChildren();
    const gallery = node('div'); const main = node('div', 'detail-main-image');
    const images = [product.image, ...(Array.isArray(product.images) ? product.images : [])].map(validImage).filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 6);
    main.append(picture(images[0], product.name)); gallery.append(main);
    if (images.length > 1) {
      const thumbs = node('div', 'thumbs');
      images.forEach((url, index) => {
        const button = node('button', index === 0 ? 'active' : ''); button.type = 'button'; button.setAttribute('aria-label', `Show image ${index + 1}`); button.append(picture(url, ''));
        button.addEventListener('click', () => { replace(main, [picture(url, product.name)]); thumbs.querySelectorAll('button').forEach(b => b.classList.remove('active')); button.classList.add('active'); });
        thumbs.append(button);
      }); gallery.append(thumbs);
    }
    const info = node('div', 'detail-info'); info.append(node('span', 'detail-brand', product.brand || 'Electronics'), node('h1', '', product.name));
    if (product.model) info.append(node('p', 'detail-model', `Model ${product.model}`));
    info.append(node('div', 'detail-price', price(product, source)), node('p', 'detail-note', 'Please confirm price and availability with our team.'));
    if (product.description) info.append(node('p', '', product.description));
    const actions = node('div', 'detail-actions'); const links = contact(detailMessage(product));
    const wa = node('a', 'button primary', 'Enquire on WhatsApp'); wa.href = links.whatsapp; wa.target = '_blank'; wa.rel = 'noopener noreferrer';
    const call = node('a', 'button secondary', 'Call the showroom'); call.href = links.call;
    actions.append(wa, call); info.append(actions);
    const highlights = Array.isArray(product.type) ? product.type.filter(Boolean).slice(0, 5) : [];
    if (highlights.length) { info.append(node('h2', '', 'Highlights')); const ul = node('ul', 'highlights'); highlights.forEach(v => ul.append(node('li', '', v))); info.append(ul); }
    const specs = product.specs && typeof product.specs === 'object' ? Object.entries(product.specs).filter(([key, value]) => key && value != null && value !== '') : [];
    if (specs.length) { const details = node('details', 'specs'); details.append(node('summary', '', 'Full specifications')); const dl = node('dl'); specs.forEach(([key, value]) => { const row = node('div'); row.append(node('dt', '', key), node('dd', '', value)); dl.append(row); }); details.append(dl); info.append(details); }
    holder.append(gallery, info); document.title = `${product.name} — Doordarshan Electronics`;
  }
  async function product() {
    const id = params.get('id'); const slug = params.get('slug') || location.pathname.split('/product/')[1];
    let result;
    if (id && /^\d+$/.test(id)) result = await withFallback({ id: Number(id), pageSize: 1 });
    else if (slug) {
      for (let pageNumber = 1; pageNumber <= 50; pageNumber++) {
        const batch = await withFallback({ page: pageNumber, pageSize: 24 });
        const match = batch.products.find(p => slugify(p.name) === slugify(slug));
        if (match) { result = { ...batch, products: [match] }; break; }
        if (pageNumber * 24 >= batch.count) { result = { ...batch, products: [] }; break; }
      }
    }
    else result = { products: [], source: 'live' };
    result ||= { products: [], source: 'unavailable' };
    const item = result.products[0];
    if (!item) { replace(document.getElementById('product-detail'), [empty('This product is not available in the approved catalogue. Browse products or contact our team.')]); document.getElementById('related-heading').closest('section').hidden = true; return; }
    renderDetail(item, result.source);
    if (!item.category) return;
    const related = await withFallback({ category: item.category, pageSize: 5 });
    replace(document.getElementById('related-products'), related.products.filter(p => String(p.id) !== String(item.id)).slice(0, 4).map(p => card(p, related.source)));
  }
  async function start() { await loadContent(); if (page === 'home') await home(); if (page === 'catalogue') await catalogue(); if (page === 'product') await product(); }
  start().catch(error => { console.error('Page load failed:', error); const target = document.getElementById('catalogue-status') || document.getElementById('product-detail'); if (target) target.textContent = 'Something went wrong loading this page. Please contact the showroom.'; });
})();
