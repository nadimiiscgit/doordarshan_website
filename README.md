# Doordarshan Electronics — Website

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)
[![Stack](https://img.shields.io/badge/Stack-HTML%20%2F%20CSS%20%2F%20JS-blue)]()
[![DB](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com)

Official website for **Doordarshan Electronics**, a consumer electronics retail store in Maharashtra, India. The site allows customers to browse products, view deals, and place orders via WhatsApp.

---

## 🌐 Live Site

Deployed via Vercel. Auto-deploys on every push to `main`.

---

## 📁 Project Structure

```
doordarshan_website/
│
├── index.html          Homepage — hero, categories, product strips, deals
├── category.html       Category/search page — filters, product grid
├── product.html        Product detail page — specs, EMI, delivery info
├── admin.html          Admin panel — stock management, CSV upload (login required)
│
├── css/
│   └── style.css       Complete design system (1,389 lines, vanilla CSS)
│
├── js/
│   ├── supabase-config.js   Supabase client + all DB/storage functions
│   ├── products-data.js     Static product catalogue (fallback, 1,097 lines)
│   ├── cart.js              Shopping cart (localStorage) + toast notifications
│   ├── i18n.js              English/Marathi bilingual system
│   └── main.js              Homepage rendering, hero, menus, countdown
│
├── assets/             (Currently empty — product images stored in Supabase Storage)
│
├── README.md           ← You are here
├── SECURITY.md         Security audit and fix plan
└── ARCHITECTURE.md     System design and data flow diagrams
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Structure** | HTML5 | No framework needed for a small catalogue site |
| **Styling** | Vanilla CSS | Maximum control, zero dependencies |
| **Logic** | Vanilla JavaScript (ES6+) | No build step, loads instantly |
| **Database** | Supabase (Postgres) | Managed DB with REST API, free tier |
| **Hosting** | Vercel | Free static hosting, global CDN, instant deploys |
| **Fonts** | Google Fonts (Outfit) | Modern, readable, free |
| **Orders** | WhatsApp | No payment gateway needed at current scale |

**No Node.js. No npm. No build step.** The site can be opened directly in a browser with `index.html`.

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/nadimiiscgit/doordarshan_website.git
cd doordarshan_website

# Start a local server (required — browser blocks some features on file:// protocol)
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

No `.env` file needed. The Supabase anon key is embedded in `js/supabase-config.js` (it's a public read key — see SECURITY.md for caveats).

---

## ⚙️ How Deployment Works

```
git push origin main
        ↓
GitHub webhook triggers Vercel
        ↓
Vercel copies files to CDN (no build step)
        ↓
Live in ~30 seconds
```

Every commit to `main` is automatically deployed. There is no staging environment currently.

---

## 🗄️ Database (Supabase)

**Project**: `lodiiprfdimohskhcpyf.supabase.co`

### Tables

| Table | Purpose |
|---|---|
| `products` | All product listings with price, stock, specs |
| `categories` | Category definitions (key, name, icon) |
| `admin_users` | Admin login credentials |

### Supabase Storage

Bucket: `product-images`  
Path: `uploads/{timestamp}_{random}.{ext}`

Images are uploaded from the admin panel and their public URLs are stored in the `products.image` column.

### Fallback Behaviour

If Supabase is unreachable (paused, down, or slow), the site falls back to the static `js/products-data.js` file, which contains the full product catalogue as a JavaScript array. The customer-facing site continues to work. Only the admin panel fails.

---

## 🔐 Admin Panel

Access: `/admin.html` (direct URL only — link removed from public footer)

The admin panel allows:
- Viewing and editing all products
- Updating stock quantities
- Uploading product images
- Importing products via CSV
- Changing the global admin password
- Managing categories

**Login**: Uses the `admin_users` Supabase table. See `SECURITY.md` for known issues with the current auth implementation.

---

## 🌐 Bilingual Support (EN / मराठी)

The site supports English and Marathi. Language preference is stored in `localStorage` (`de_website_lang`).

Switching is instant — no page reload. All static text uses `data-i18n` attributes. Dynamically rendered UI (product cards, category grid) re-renders when language changes via the `window.updateDynamicLanguageText()` hook.

Translation dictionary lives in `js/i18n.js`.

---

## 🛒 Order Flow

The site does not have online payments. Orders are placed via WhatsApp:

1. Customer adds items to cart (stored in `localStorage`)
2. Customer clicks "Order on WhatsApp"
3. A pre-filled WhatsApp message is generated with product names, model numbers, prices, and total
4. Customer sends the message to `+91 70202 09281`
5. Store confirms availability and arranges delivery

---

## 📊 Product Data

Products are stored in two places:
1. **Supabase DB** — live data, updated by admin panel
2. **`js/products-data.js`** — static fallback, seeded from the 2017–2026 stock CSV

When both are available, Supabase data takes priority (loaded at runtime, replaces the static array in memory).

To add a product: use the admin panel at `/admin.html`.

---

## 📚 Documentation

| File | Contents |
|---|---|
| [`SECURITY.md`](./SECURITY.md) | Vulnerability audit, attack surface analysis, and 4-layer fix plan |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Full data flow diagrams, script dependency graph, DB schema |
| [`css/README.md`](./css/README.md) | Design system, CSS variables, all 19 stylesheet sections explained |
| [`js/README.md`](./js/README.md) | Every JS file and every function documented |

---

## 📝 Recent Changes

| Date | Change |
|---|---|
| Sep 2026 | Fixed frozen countdown timer (rolling daily target) |
| Sep 2026 | Removed admin panel link from public footer |
| Sep 2026 | Replaced exaggerated claims with authentic store promises |
| Sep 2026 | Updated copyright year to 2026 dynamically |
| Sep 2026 | Added Marathi (मराठी) bilingual support |
| Sep 2026 | Removed "Osmanabad" from all page titles |
| Sep 2026 | Implemented horizontal scrollable navigation bars |
| Sep 2026 | Added Supabase admin authentication (global login) |
| Sep 2026 | Seeded fridge stock from 2017–2026 CSV |

---

## ⚠️ Known Issues / TODO

- [ ] Supabase RLS not enabled — anyone with the anon key can write to DB (see SECURITY.md)
- [ ] Admin password stored as plaintext in DB
- [ ] Hardcoded fallback credentials in supabase-config.js
- [ ] No online payment integration (Razorpay — planned)
- [ ] No order tracking system
- [ ] Product images mostly from Unsplash (not real store photos)
- [ ] No pagination on category page
- [ ] Supabase free tier may pause after 7 days of no traffic
