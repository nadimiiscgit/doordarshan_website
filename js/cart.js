// ============================================================
// Doordarshan Electronics — Cart Manager
// Persists to localStorage, updates badge live
// ============================================================

const CART_KEY = 'de_cart_v1';
const WHATSAPP_NUM = '917020209281';

const Cart = {

  // ── Read/Write ──────────────────────────────────────────
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    Cart.updateBadge();
  },

  // ── Mutations ───────────────────────────────────────────
  add(productId, qty = 1) {
    const items = Cart.get();
    const existing = items.find(i => i.id === productId);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      items.push({ id: productId, qty });
    }
    Cart.save(items);
    Toast.show('✅ Added to cart!');
  },

  remove(productId) {
    const items = Cart.get().filter(i => i.id !== productId);
    Cart.save(items);
  },

  setQty(productId, qty) {
    const items = Cart.get();
    const item = items.find(i => i.id === productId);
    if (item) { item.qty = Math.max(1, Math.min(qty, 10)); }
    Cart.save(items);
  },

  clear() { Cart.save([]); },

  // ── Computed ────────────────────────────────────────────
  count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },

  total() {
    return Cart.get().reduce((s, i) => {
      const p = getProductById(i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },

  lineItems() {
    return Cart.get().map(i => {
      const p = getProductById(i.id);
      return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
    }).filter(Boolean);
  },

  // ── UI ──────────────────────────────────────────────────
  updateBadge() {
    const c = Cart.count();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  },

  // ── WhatsApp Order ──────────────────────────────────────
  openWhatsApp(productId = null) {
    let msg = '';
    if (productId) {
      const p = getProductById(productId);
      if (p) {
        msg = `Hi! I want to order:\n\n` +
              `*${p.name}*\n` +
              `Model: ${p.model}\n` +
              `Price: ${formatPrice(p.price)}\n\n` +
              `Please confirm availability and delivery details.`;
      }
    } else {
      const items = Cart.lineItems();
      if (!items.length) { Toast.show('Your cart is empty!', 'error'); return; }
      msg = `Hi! I want to order the following items:\n\n` +
            items.map(i => `• *${i.name}* (${i.model}) — Qty: ${i.qty} — ${formatPrice(i.price)} each`).join('\n') +
            `\n\n*Total: ${formatPrice(Cart.total())}*\n\nPlease confirm availability and delivery details.`;
    }
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
  },
};

// ── Toast Notifications ──────────────────────────────────
const Toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(msg, type = 'success') {
    if (!this.container) this.init();
    const el = document.createElement('div');
    el.className = `toast${type === 'error' ? ' error' : ''}`;
    el.innerHTML = `<span>${msg}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = '0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  },
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Cart.updateBadge();
});
