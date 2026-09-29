// ============================================================
// Doordarshan Electronics — Main JS
// Hero slider · Mega menu · Product rendering · Countdown
// ============================================================

// ── Product Image Pool (Unsplash IDs — real TV photos) ─────
const TV_IMAGES = {
  Sony:    [
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1461151304267-38374dc58dfd?w=480&h=360&fit=crop&auto=format',
  ],
  Samsung: [
    'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&h=360&fit=crop&auto=format',
  ],
  LG:     [
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=480&h=360&fit=crop&auto=format',
  ],
  TCL:    [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=480&h=360&fit=crop&auto=format',
  ],
  Hisense:[
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1461151304267-38374dc58dfd?w=480&h=360&fit=crop&auto=format',
  ],
  default:[
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1461151304267-38374dc58dfd?w=480&h=360&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=480&h=360&fit=crop&auto=format',
  ],
};

function getProductImage(product) {
  if (product && product.image && product.image.trim() !== '') {
    return product.image;
  }
  const pool = TV_IMAGES[product.brand] || TV_IMAGES.default;
  return pool[product.id % pool.length];
}

// ── Render Stars ─────────────────────────────────────────
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Build Product Card HTML (Vijay Sales Format) ───────────────
function buildProductCard(product, compact = false) {
  const discount = getDiscount(product.mrp, product.price);
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const imageUrl = getProductImage(product);
  const brandColor = getBrandColor(product.brand);

  const inStockLabel = typeof t === 'function' ? t('in_stock') : '✓ In Stock';
  const outOfStockLabel = typeof t === 'function' ? t('out_of_stock') : '✗ Out of Stock';
  const lowStockLabel = typeof t === 'function' ? t('low_stock', { n: product.stock }) : `⚡ Only ${product.stock} left!`;
  const addToCartLabel = typeof t === 'function' ? t('add_to_cart') : 'Add to Cart';

  const stockHtml = product.stock === 0
    ? `<span class="product-stock stock-out">${outOfStockLabel}</span>`
    : isLowStock
      ? `<span class="product-stock stock-low">${lowStockLabel}</span>`
      : `<span class="product-stock stock-in">${inStockLabel}</span>`;

  const emiPerMonth = Math.round(product.price / 12);
  const savingsAmount = product.mrp > product.price ? (product.mrp - product.price) : 0;

  // Build spec chips
  const specChips = [];
  if (product.size) specChips.push(`${product.size}" Screen`);
  if (product.type && Array.isArray(product.type)) {
    product.type.slice(0, 2).forEach(t => specChips.push(t));
  } else if (product.subcategory) {
    specChips.push(product.subcategory);
  }

  const specChipsHtml = specChips.length > 0
    ? `<div class="card-spec-chips">${specChips.map(c => `<span class="card-spec-chip">${c}</span>`).join('')}</div>`
    : '';

  const isChecked = typeof CompareEngine !== 'undefined' && CompareEngine.has(product.id) ? 'checked' : '';

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="card-top-badges">
        <span class="card-brand-pill">${product.brand}</span>
        ${discount ? `<span class="card-discount-badge">${discount}% OFF</span>` : '<span class="card-brand-pill" style="color:var(--primary);">GENUINE</span>'}
      </div>

      <div class="product-img-wrap">
        <a href="product.html?id=${product.id}" style="display:block;width:100%;height:100%;">
          <img
            src="${imageUrl}"
            alt="${product.name}"
            loading="lazy"
            style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
          />
          <div class="product-img-placeholder" style="display:none;background:${brandColor.bg};">
            <span class="product-brand-logo" style="color:${brandColor.text}">${product.brand}</span>
            <span class="product-model-text" style="color:rgba(255,255,255,0.6)">${product.model}</span>
            <span class="product-tv-icon">📺</span>
          </div>
        </a>
        <button class="wishlist-btn" title="Add to Wishlist" onclick="Toast.show('Saved to wishlist! ❤️')">♡</button>
      </div>

      <div class="product-info">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <div class="card-rating-pill">
            <span class="star-icon">★</span> ${product.rating || '4.2'}
            <span class="card-rating-count">(${product.reviews || '48'})</span>
          </div>
          ${stockHtml}
        </div>

        <a href="product.html?id=${product.id}" class="product-name" title="${product.name}">
          ${product.name}
        </a>

        ${specChipsHtml}

        <div class="product-price">
          <span class="price-current" style="color:var(--primary);font-size:1.22rem;font-weight:800;">
            ${formatPrice(product.price)}
          </span>
          ${product.mrp > product.price ? `
            <span class="price-mrp">${formatPrice(product.mrp)}</span>
            <span class="price-save" style="color:var(--success);font-weight:700;">Save ${formatPrice(savingsAmount)}</span>
          ` : ''}
        </div>

        <div class="card-emi-tag">
          <span>💳</span> 0% EMI from ₹${emiPerMonth.toLocaleString('en-IN')}/mo (Bajaj)
        </div>

        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn-whatsapp-buy" title="Order / Inquire on WhatsApp" onclick="Cart.openWhatsApp(${product.id})">
            💬 WhatsApp Deal
          </button>
          <button class="btn-vj-cart" onclick="Cart.add(${product.id})" ${product.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            🛒 ${addToCartLabel}
          </button>
        </div>

        <label class="card-compare-label">
          <input type="checkbox" data-compare-id="${product.id}" ${isChecked} onchange="CompareEngine.toggle(${product.id}, this)">
          <span>Compare Specs</span>
        </label>
      </div>
    </div>
  `;
}

// ── Hero Slider ───────────────────────────────────────────
const HERO_SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1400&h=600&fit=crop&auto=format',
    kicker: '🔥 Authorized Store Deals — Best Local Prices',
    title: 'Premium <span>LED TVs</span><br>At Unbeatable Prices',
    subtitle: 'Sony, Samsung, LG, TCL & more — Genuine models with official brand warranty',
    btn1: { text: '🛒 Shop LED TVs', href: 'category.html?cat=tv' },
    btn2: { text: 'View All Offers', href: '#offers' },
  },
  {
    bg: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1400&h=600&fit=crop&auto=format',
    kicker: '⚡ New Arrivals 2026',
    title: '<span>Sony Bravia</span> Google TV<br>Now In Stock',
    subtitle: 'Experience Google TV with Dolby Vision & Atmos — Safe doorstep delivery & installation',
    btn1: { text: '🛒 Shop Sony', href: 'category.html?cat=tv&brand=Sony' },
    btn2: { text: 'Order on WhatsApp', href: '#', onclick: "Cart.openWhatsApp()" },
  },
  {
    bg: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=1400&h=600&fit=crop&auto=format',
    kicker: '🏷️ EMI Starting ₹999/month',
    title: 'Easy <span>EMI</span> on All<br>Electronics',
    subtitle: '6 / 12 / 24 month EMI options — No Cost EMI available on select models',
    btn1: { text: '📞 Call 7020209281', href: 'tel:7020209281' },
    btn2: { text: '💬 WhatsApp Order', href: '#', onclick: "Cart.openWhatsApp()" },
  },
];

let heroIndex = 0;
let heroTimer = null;

function initHeroSlider() {
  const container = document.getElementById('hero-slides');
  const dotsContainer = document.getElementById('hero-dots');
  if (!container) return;

  // Build slides
  container.innerHTML = HERO_SLIDES.map((s, i) => `
    <div class="hero-slide${i === 0 ? ' active' : ''}" data-index="${i}">
      <div class="hero-slide-bg" style="background-image:url('${s.bg}')"></div>
      <div class="hero-content">
        <div class="hero-kicker">${s.kicker}</div>
        <h1 class="hero-title">${s.title}</h1>
        <p class="hero-subtitle">${s.subtitle}</p>
        <div class="hero-actions">
          <a href="${s.btn1.href}" class="btn-hero-primary">${s.btn1.text} →</a>
          <a href="${s.btn2.href}" class="btn-hero-secondary" ${s.btn2.onclick ? `onclick="${s.btn2.onclick};return false;"` : ''}>${s.btn2.text}</a>
        </div>
      </div>
    </div>
  `).join('');

  // Build dots
  dotsContainer.innerHTML = HERO_SLIDES.map((_, i) =>
    `<div class="hero-dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></div>`
  ).join('');

  startHeroTimer();
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  heroIndex = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
  slides[heroIndex].classList.add('active');
  dots[heroIndex].classList.add('active');
  clearTimeout(heroTimer);
  startHeroTimer();
}

function startHeroTimer() {
  heroTimer = setTimeout(() => goToSlide(heroIndex + 1), 5000);
}

// ── Deal Countdown (Always active & rolling daily target) ──
function initCountdown() {
  function getTargetTime() {
    const now = new Date();
    // Daily target: midnight of current day
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    // If less than 1 minute remains in the day, roll over to tomorrow midnight
    if (end.getTime() - now.getTime() < 60000) {
      end.setDate(end.getDate() + 1);
    }
    return end;
  }

  let target = getTargetTime();

  function tick() {
    const now = new Date();
    let diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      target = getTargetTime();
      diff = target.getTime() - now.getTime();
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val).padStart(2, '0');
    };
    set('timer-h', h);
    set('timer-m', m);
    set('timer-s', s);
  }
  tick();
  setInterval(tick, 1000);
}

// ── Render Product Sections ───────────────────────────────
function renderSection(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el || !products.length) return;
  el.innerHTML = products.map(p => buildProductCard(p)).join('');
}

// ── Mega Menu ─────────────────────────────────────────────
function initMegaMenu() {
  const items = document.querySelectorAll('.nav-item');
  items.forEach(item => {
    const mega = item.querySelector('.mega-menu');
    if (!mega) return;
    let timer;
    item.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      mega.style.opacity   = '1';
      mega.style.visibility = 'visible';
      mega.style.transform  = 'translateY(0)';
    });
    item.addEventListener('mouseleave', () => {
      timer = setTimeout(() => {
        mega.style.opacity   = '0';
        mega.style.visibility = 'hidden';
        mega.style.transform  = 'translateY(-8px)';
      }, 120);
    });
  });
}

// ── Sticky Header shadow ──────────────────────────────────
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 40
      ? '0 4px 24px rgba(0,0,0,0.12)'
      : '0 2px 8px rgba(0,0,0,0.06)';
  }, { passive: true });
}

// ── Search with Auto-suggest (Vijay Sales Style) ──────────
function initSearch() {
  const form = document.getElementById('search-form');
  if (!form) return;
  const input = form.querySelector('input');
  if (!input) return;

  // Create suggest dropdown container
  const dropdown = document.createElement('div');
  dropdown.id = 'search-suggest-box';
  Object.assign(dropdown.style, {
    position: 'absolute',
    top: '105%',
    left: '0',
    right: '0',
    background: '#fff',
    border: '1.5px solid var(--border)',
    borderRadius: '8px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
    zIndex: '9999',
    display: 'none',
    maxHeight: '380px',
    overflowY: 'auto'
  });
  form.style.position = 'relative';
  form.appendChild(dropdown);

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    if (!val || val.length < 2 || typeof PRODUCTS === 'undefined') {
      dropdown.style.display = 'none';
      return;
    }
    const matches = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(val) ||
      p.brand.toLowerCase().includes(val) ||
      (p.model && p.model.toLowerCase().includes(val))
    ).slice(0, 6);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div style="padding:14px;color:var(--text-muted);font-size:0.82rem;text-align:center;">No matching products found. Press Enter to browse catalog.</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = `
      <div style="padding:8px 12px;background:var(--surface-2);font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">
        Top Results for "${val}"
      </div>
      ${matches.map(p => `
        <a href="product.html?id=${p.id}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid var(--border-light);text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='#fff'">
          <img src="${getProductImage(p)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" alt="${p.name}">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.84rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">${p.brand} · ${p.size ? p.size + '"' : p.category}</div>
          </div>
          <div style="font-size:0.88rem;font-weight:800;color:var(--primary);white-space:nowrap;">
            ${formatPrice(p.price)}
          </div>
        </a>
      `).join('')}
      <a href="category.html?q=${encodeURIComponent(val)}" style="display:block;padding:10px;text-align:center;font-size:0.8rem;font-weight:700;color:var(--primary);background:var(--accent-pale);text-decoration:none;">
        View all results for "${val}" →
      </a>
    `;
    dropdown.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) dropdown.style.display = 'none';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) window.location.href = `category.html?q=${encodeURIComponent(q)}`;
  });
}

// ── Product Comparison Engine (Vijay Sales Style) ────────
const CompareEngine = {
  items: [],

  init() {
    try {
      const saved = sessionStorage.getItem('de_compare_items');
      if (saved) this.items = JSON.parse(saved);
    } catch(e) {}
    this.createDrawer();
    this.updateUI();
  },

  has(id) {
    return this.items.some(p => p.id === id);
  },

  toggle(id, inputEl) {
    if (this.has(id)) {
      this.items = this.items.filter(p => p.id !== id);
      if (inputEl) inputEl.checked = false;
      Toast.show('Removed from comparison');
    } else {
      if (this.items.length >= 3) {
        if (inputEl) inputEl.checked = false;
        Toast.show('You can compare maximum 3 products at a time.', 'error');
        return;
      }
      const prod = typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.id === id) : null;
      if (prod) {
        this.items.push(prod);
        if (inputEl) inputEl.checked = true;
        Toast.show(`Added ${prod.brand} to compare (${this.items.length}/3)`);
      }
    }
    sessionStorage.setItem('de_compare_items', JSON.stringify(this.items));
    this.updateUI();
  },

  remove(id) {
    this.items = this.items.filter(p => p.id !== id);
    sessionStorage.setItem('de_compare_items', JSON.stringify(this.items));
    document.querySelectorAll(`[data-compare-id="${id}"]`).forEach(cb => cb.checked = false);
    this.updateUI();
  },

  clear() {
    this.items = [];
    sessionStorage.removeItem('de_compare_items');
    document.querySelectorAll('[data-compare-id]').forEach(cb => cb.checked = false);
    this.updateUI();
  },

  createDrawer() {
    if (document.getElementById('compare-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'compare-drawer';
    drawer.innerHTML = `
      <div class="compare-drawer-inner">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="font-weight:800;font-size:0.9rem;white-space:nowrap;">
            ⚖️ Product Comparison (<span id="compare-count">0</span>/3)
          </div>
          <div class="compare-slots" id="compare-slots"></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button onclick="CompareEngine.clear()" style="color:#94A3B8;font-size:0.78rem;cursor:pointer;background:none;border:none;">Clear All</button>
          <button class="btn-compare-now" onclick="CompareEngine.openModal()">Compare Now →</button>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    if (!document.getElementById('compare-modal')) {
      const modal = document.createElement('div');
      modal.id = 'compare-modal';
      modal.className = 'modal-overlay';
      modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
      document.body.appendChild(modal);
    }
  },

  updateUI() {
    const drawer = document.getElementById('compare-drawer');
    const badge = document.querySelector('.compare-badge');
    const countEl = document.getElementById('compare-count');
    const slotsEl = document.getElementById('compare-slots');

    if (badge) {
      badge.textContent = this.items.length;
      badge.style.display = this.items.length > 0 ? 'flex' : 'none';
    }

    if (!drawer) return;

    if (this.items.length === 0) {
      drawer.style.display = 'none';
      return;
    }

    drawer.style.display = 'block';
    if (countEl) countEl.textContent = this.items.length;

    if (slotsEl) {
      slotsEl.innerHTML = [0, 1, 2].map(idx => {
        const item = this.items[idx];
        if (item) {
          return `
            <div class="compare-slot filled">
              <span style="font-weight:700;color:var(--primary);">${item.brand}</span>
              <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</span>
              <button class="compare-slot-remove" onclick="CompareEngine.remove(${item.id})">×</button>
            </div>
          `;
        }
        return `
          <div class="compare-slot">
            <span style="color:rgba(255,255,255,0.4);">+ Add Product</span>
          </div>
        `;
      }).join('');
    }
  },

  openModal() {
    if (this.items.length < 2) {
      Toast.show('Please select at least 2 products to compare.', 'error');
      return;
    }
    const modal = document.getElementById('compare-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="compare-modal-card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--border);padding-bottom:12px;">
          <div>
            <h2 style="font-size:1.3rem;font-weight:900;">⚖️ Side-by-Side Product Comparison</h2>
            <p style="font-size:0.8rem;color:var(--text-muted);">Comparing ${this.items.length} products with live store prices</p>
          </div>
          <button onclick="document.getElementById('compare-modal').style.display='none'" style="font-size:1.5rem;cursor:pointer;background:none;border:none;color:var(--text-muted);">&times;</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                ${this.items.map(p => `
                  <td style="text-align:center;min-width:200px;">
                    <img src="${getProductImage(p)}" style="height:100px;object-fit:contain;margin:0 auto 8px;" alt="${p.name}">
                    <div style="font-weight:800;color:var(--primary);font-size:0.78rem;text-transform:uppercase;">${p.brand}</div>
                    <div style="font-weight:700;font-size:0.86rem;margin:4px 0;">${p.name}</div>
                    <div style="font-size:1.15rem;font-weight:900;color:var(--primary);">${formatPrice(p.price)}</div>
                    <div style="font-size:0.75rem;color:var(--text-light);text-decoration:line-through;">${formatPrice(p.mrp)}</div>
                  </td>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Brand & Model</th>
                ${this.items.map(p => `<td>${p.brand} ${p.model || ''}</td>`).join('')}
              </tr>
              <tr>
                <th>Category</th>
                ${this.items.map(p => `<td style="text-transform:capitalize;">${p.category || 'tv'}</td>`).join('')}
              </tr>
              <tr>
                <th>Size / Capacity</th>
                ${this.items.map(p => `<td><strong>${p.size ? p.size + ' inch' : (p.subcategory || 'Standard')}</strong></td>`).join('')}
              </tr>
              <tr>
                <th>Technology / Type</th>
                ${this.items.map(p => `<td>${(p.type || []).join(', ') || 'Smart / Inverter'}</td>`).join('')}
              </tr>
              <tr>
                <th>No-Cost EMI</th>
                ${this.items.map(p => `<td><span style="color:#1D4ED8;font-weight:700;">₹${Math.round(p.price/12).toLocaleString('en-IN')}/mo</span> (Bajaj 0%)</td>`).join('')}
              </tr>
              <tr>
                <th>Customer Rating</th>
                ${this.items.map(p => `<td><span style="color:#F59E0B;font-weight:700;">★ ${p.rating || 4.2}</span> (${p.reviews || 48} reviews)</td>`).join('')}
              </tr>
              <tr>
                <th>Store Stock Status</th>
                ${this.items.map(p => `<td>${p.stock > 0 ? `<span style="color:var(--success);font-weight:700;">✓ In Stock (${p.stock} units)</span>` : '<span style="color:var(--danger);font-weight:700;">Order on Demand</span>'}</td>`).join('')}
              </tr>
              <tr>
                <th>Actions</th>
                ${this.items.map(p => `
                  <td style="text-align:center;">
                    <button class="btn-whatsapp-buy" style="width:100%;margin-bottom:6px;" onclick="Cart.openWhatsApp(${p.id})">💬 WhatsApp Deal</button>
                    <button class="btn-vj-cart" style="width:100%;" onclick="Cart.add(${p.id})">🛒 Add to Cart</button>
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }
};

// ── WhatsApp Floating Button ──────────────────────────────
function initWhatsAppFloat() {
  const btn = document.createElement('a');
  btn.href = `https://wa.me/917020209281?text=${encodeURIComponent('Hi! I want to enquire about a product.')}`;
  btn.target = '_blank';
  btn.id = 'wa-float';
  btn.title = 'Chat on WhatsApp';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  `;
  Object.assign(btn.style, {
    position:       'fixed',
    bottom:         '28px',
    left:           '28px',
    width:          '58px',
    height:         '58px',
    borderRadius:   '50%',
    background:     '#25D366',
    color:          '#fff',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    boxShadow:      '0 6px 24px rgba(37,211,102,0.45)',
    zIndex:         '9990',
    transition:     'transform 0.2s ease, box-shadow 0.2s ease',
  });
  btn.addEventListener('mouseenter', () => {
    btn.style.transform  = 'scale(1.12)';
    btn.style.boxShadow  = '0 10px 32px rgba(37,211,102,0.55)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform  = '';
    btn.style.boxShadow  = '0 6px 24px rgba(37,211,102,0.45)';
  });
  document.body.appendChild(btn);
}

// ── Back to top ───────────────────────────────────────────
function initBackToTop() {
  const btn = document.createElement('button');
  btn.innerHTML = '↑';
  btn.title = 'Back to top';
  Object.assign(btn.style, {
    position:   'fixed',
    bottom:     '28px',
    right:      '28px',
    width:      '46px',
    height:     '46px',
    borderRadius:'50%',
    background: 'var(--primary)',
    color:      '#fff',
    fontSize:   '1.1rem',
    fontWeight: '700',
    boxShadow:  '0 4px 16px rgba(11,44,110,0.3)',
    zIndex:     '9990',
    opacity:    '0',
    transform:  'translateY(10px)',
    transition: '0.3s ease',
    border:     'none',
    cursor:     'pointer',
  });
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    btn.style.opacity   = show ? '1' : '0';
    btn.style.transform = show ? 'translateY(0)' : 'translateY(10px)';
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

async function renderDynamicCategories() {
  const catGrid = document.querySelector('.categories-grid');
  const searchSelect = document.getElementById('search-category');
  let cats = typeof fetchCategoriesFromDB === 'function' ? await fetchCategoriesFromDB() : [];

  if (searchSelect && cats && cats.length > 0) {
    searchSelect.innerHTML = '<option value="">All Categories</option>' + 
      cats.map(c => `<option value="${c.key}">${c.name}</option>`).join('');
  }

  if (catGrid && cats && cats.length > 0) {
    catGrid.innerHTML = cats.map(c => {
      const count = typeof PRODUCTS !== 'undefined' ? PRODUCTS.filter(p => p.category === c.key).length : 0;
      const countText = count > 0 ? `${count} product${count > 1 ? 's' : ''}` : 'In Stock';
      return `
        <a href="category.html?cat=${c.key}" class="cat-card">
          <div class="cat-icon">${c.icon || '📦'}</div>
          <div class="cat-name">${c.name}</div>
          <div class="cat-count">${countText}</div>
        </a>
      `;
    }).join('');
  }
}

// ── Enable Mouse Drag-to-Scroll on Desktop ────────────────
function initHorizontalDragScroll() {
  const containers = document.querySelectorAll('.scroll-strip, .categories-grid, .brands-grid, .subcat-tabs');
  containers.forEach(slider => {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', e => {
      isDown = true;
      slider.style.cursor = 'grabbing';
      slider.style.userSelect = 'none';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.style.cursor = 'default';
      slider.style.userSelect = 'auto';
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.style.cursor = 'default';
      slider.style.userSelect = 'auto';
    });

    slider.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2.2;
      slider.scrollLeft = scrollLeft - walk;
    });
  });
}

// ── Init everything on DOM ready ─────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initHeroSlider();
  initCountdown();
  initMegaMenu();
  initStickyHeader();
  initSearch();
  initWhatsAppFloat();
  initBackToTop();
  if (typeof CompareEngine !== 'undefined') CompareEngine.init();

  // Load live products & categories from Supabase DB if available
  if (typeof fetchProductsFromDB === 'function') {
    const liveProds = await fetchProductsFromDB();
    if (liveProds && liveProds.length > 0 && typeof PRODUCTS !== 'undefined') {
      PRODUCTS.length = 0;
      PRODUCTS.push(...liveProds);
    }
  }

  await renderDynamicCategories();

  // Render all homepage product sections
  renderAllHomeSections();

  // Enable mouse drag scrolling for desktop
  initHorizontalDragScroll();
});

function renderAllHomeSections() {
  if (typeof PRODUCTS === 'undefined') return;
  renderSection('featured-products', getFeaturedProducts(8));
  renderSection('new-arrivals', PRODUCTS.filter(p => p.isNew).slice(0, 8));
  const dealProducts = PRODUCTS.filter(p => p.brand === 'Sony' && getDiscount(p.mrp, p.price) > 10).slice(0, 4);
  renderSection('deal-products', dealProducts);

  const tvProducts = PRODUCTS.filter(p => p.category === 'tv').slice(0, 8);
  renderSection('tv-products-strip', tvProducts.length > 0 ? tvProducts : getFeaturedProducts(8));

  const fridgeProducts = PRODUCTS.filter(p => p.category === 'refrigerator').slice(0, 8);
  renderSection('refrigerator-products-strip', fridgeProducts.length > 0 ? fridgeProducts : PRODUCTS.slice(0, 8));
}

// Global hook for language changes
window.updateDynamicLanguageText = function() {
  renderAllHomeSections();
};
