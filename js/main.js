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

// ── Build Product Card HTML ───────────────────────────────
function buildProductCard(product, compact = false) {
  const discount = getDiscount(product.mrp, product.price);
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const imageUrl = getProductImage(product);
  const brandColor = getBrandColor(product.brand);

  const badges = [
    product.isNew   ? `<span class="badge badge-new">New</span>` : '',
    product.type.includes('OLED') ? `<span class="badge badge-oled">OLED</span>` : '',
    product.type.includes('QLED') ? `<span class="badge badge-qled">QLED</span>` : '',
  ].filter(Boolean).join('');

  const stockHtml = product.stock === 0
    ? `<span class="product-stock stock-out">✗ Out of Stock</span>`
    : isLowStock
      ? `<span class="product-stock stock-low">⚡ Only ${product.stock} left!</span>`
      : `<span class="product-stock stock-in">✓ In Stock</span>`;

  const priceHtml = product.mrp > 1
    ? `<span class="price-current">${formatPrice(product.price)}</span>
       <span class="price-mrp">${formatPrice(product.mrp)}</span>
       ${discount ? `<span class="price-save">${discount}% off</span>` : ''}`
    : `<span class="price-current">${formatPrice(product.price)}</span>`;

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-img-wrap">
        <img
          src="${imageUrl}"
          alt="${product.name}"
          loading="lazy"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        />
        <div class="product-img-placeholder" style="display:none;background:${brandColor.bg};">
          <span class="product-brand-logo" style="color:${brandColor.text}">${product.brand}</span>
          <span class="product-model-text" style="color:rgba(255,255,255,0.6)">${product.model}</span>
          <span class="product-tv-icon">📺</span>
        </div>
        ${badges ? `<div class="product-badges">${badges}</div>` : ''}
        ${discount ? `<div class="product-discount">-${discount}%</div>` : ''}
        <button class="wishlist-btn" title="Add to Wishlist" onclick="Toast.show('Added to wishlist! ❤️')">♡</button>
      </div>
      <div class="product-info">
        <div class="product-brand">${product.brand}</div>
        <a href="product.html?id=${product.id}" class="product-name">${product.name}</a>
        <div class="product-model">${product.model}</div>
        <div class="product-rating">
          <span class="stars">${renderStars(product.rating)}</span>
          <span class="review-count">(${product.reviews})</span>
        </div>
        <div class="product-price">${priceHtml}</div>
        ${stockHtml}
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="add-to-cart-btn" style="flex:1;" onclick="Cart.add(${product.id})" ${product.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            🛒 Add to Cart
          </button>
          <button class="add-to-cart-btn" style="background:#25D366;flex:0 0 auto;padding:10px 12px;" title="Order on WhatsApp" onclick="Cart.openWhatsApp(${product.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Hero Slider ───────────────────────────────────────────
const HERO_SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1400&h=600&fit=crop&auto=format',
    kicker: '🔥 Festive Sale — Up to 40% Off',
    title: 'Premium <span>LED TVs</span><br>At Unbeatable Prices',
    subtitle: 'Sony, Samsung, LG, TCL & more — all in stock at Doordarshan Electronics, Osmanabad',
    btn1: { text: '🛒 Shop LED TVs', href: 'category.html?cat=tv' },
    btn2: { text: 'View All Offers', href: '#offers' },
  },
  {
    bg: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1400&h=600&fit=crop&auto=format',
    kicker: '⚡ New Arrivals 2025',
    title: '<span>Sony Bravia</span> Google TV<br>Now Available',
    subtitle: 'Experience Google TV with Dolby Vision & Atmos — Free delivery anywhere in India',
    btn1: { text: '🛒 Shop Sony', href: 'category.html?cat=tv&brand=Sony' },
    btn2: { text: 'Order on WhatsApp', href: '#', onclick: "Cart.openWhatsApp()" },
  },
  {
    bg: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=1400&h=600&fit=crop&auto=format',
    kicker: '🏷️ EMI Starting ₹999/month',
    title: 'Easy <span>EMI</span> on All<br>Electronics',
    subtitle: '6 / 12 / 24 month EMI options — No Cost EMI available on select products',
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

// ── Deal Countdown ────────────────────────────────────────
function initCountdown() {
  const endTime = new Date();
  endTime.setHours(23, 59, 59, 0); // Ends tonight

  function tick() {
    const now  = new Date();
    let diff   = Math.max(0, endTime - now);
    const h    = Math.floor(diff / 3600000);       diff -= h * 3600000;
    const m    = Math.floor(diff / 60000);          diff -= m * 60000;
    const s    = Math.floor(diff / 1000);

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

// ── Search ────────────────────────────────────────────────
function initSearch() {
  const form = document.getElementById('search-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = form.querySelector('input').value.trim();
    if (q) window.location.href = `category.html?q=${encodeURIComponent(q)}`;
  });
}

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

  // Load live products & categories from Supabase DB if available
  if (typeof fetchProductsFromDB === 'function') {
    const liveProds = await fetchProductsFromDB();
    if (liveProds && liveProds.length > 0 && typeof PRODUCTS !== 'undefined') {
      PRODUCTS.length = 0;
      PRODUCTS.push(...liveProds);
    }
  }

  await renderDynamicCategories();

  // Render featured products
  renderSection('featured-products', getFeaturedProducts(8));
  // Render new arrivals
  renderSection('new-arrivals', PRODUCTS.filter(p => p.isNew).slice(0, 8));
  // Render deal products
  const dealProducts = PRODUCTS.filter(p => p.brand === 'Sony' && getDiscount(p.mrp, p.price) > 10).slice(0, 4);
  renderSection('deal-products', dealProducts);

  // Render LED TV Strip
  const tvProducts = PRODUCTS.filter(p => p.category === 'tv').slice(0, 8);
  renderSection('tv-products-strip', tvProducts.length > 0 ? tvProducts : getFeaturedProducts(8));

  // Render Refrigerator Strip
  const fridgeProducts = PRODUCTS.filter(p => p.category === 'refrigerator').slice(0, 8);
  renderSection('refrigerator-products-strip', fridgeProducts.length > 0 ? fridgeProducts : PRODUCTS.slice(0, 8));

  // Enable mouse drag scrolling for desktop
  initHorizontalDragScroll();
});
