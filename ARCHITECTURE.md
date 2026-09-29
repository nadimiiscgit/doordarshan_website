# ARCHITECTURE.md — Doordarshan Electronics Website

System design, data flow, and component relationships.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VISITOR'S BROWSER                               │
│                                                                         │
│  index.html / category.html / product.html                             │
│  ├── css/style.css          (design system)                             │
│  ├── js/supabase-config.js  (DB client)                                 │
│  ├── js/i18n.js             (EN/Marathi)                                │
│  ├── js/products-data.js    (static fallback)                           │
│  ├── js/cart.js             (cart + toasts)                             │
│  └── js/main.js             (render + interactions)                     │
│                                                                         │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ REST API (HTTPS)
                           │ Uses SUPABASE_ANON_KEY
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Backend-as-a-Service)                   │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐                  │
│  │  products   │   │ categories  │   │  admin_users │                  │
│  │  table      │   │  table      │   │  table       │                  │
│  └─────────────┘   └─────────────┘   └──────────────┘                  │
│                                                                          │
│  ┌──────────────────────┐                                                │
│  │  Storage Bucket      │                                                │
│  │  product-images/     │                                                │
│  │  uploads/            │                                                │
│  └──────────────────────┘                                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      ADMIN (admin.html)                                  │
│  ├── Login → verifyAdminLoginFromDB()                                   │
│  ├── View/Edit products → dbClient.from('products').upsert()            │
│  ├── Bulk update images → dbClient.storage.upload()                     │
│  ├── CSV import → parse → dbClient.from('products').upsert()            │
│  └── Change password → updateAdminPasswordInDB()                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    VERCEL (Static Hosting + CDN)                         │
│  GitHub push to main → auto-deploy → serve static files globally        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Product Display

```
DOMContentLoaded fires
        │
        ▼
fetchProductsFromDB()
        │
        ├── [Supabase available] ──→ Query products table
        │                                    │
        │                                    ├── Success + data → map to frontend schema
        │                                    │            → replace PRODUCTS[] in memory
        │                                    │
        │                                    └── Error / empty → use static PRODUCTS[]
        │
        └── [Supabase unavailable] ──→ use static PRODUCTS[]
                │
                ▼
        renderAllHomeSections()
                │
                ├── getFeaturedProducts(8)          → #featured-products
                ├── PRODUCTS.filter(isNew)           → #new-arrivals
                ├── Sony products with >10% discount → #deal-products
                ├── PRODUCTS.filter(tv)              → #tv-products-strip
                └── PRODUCTS.filter(refrigerator)   → #refrigerator-products-strip
```

---

## Data Flow: Category Page

```
URL: category.html?cat=tv&brand=Sony&q=43

URL params parsed on load
        │
        ├── cat=tv      → filter by category
        ├── brand=Sony  → filter by brand
        ├── q=43        → text search across name/model/description
        │
        ▼
fetchProductsFromDB() [same as homepage]
        │
        ▼
renderProducts(filteredProducts)
        │
        └── applies all active filters: category, brand, subcategory, type, price range, search query
```

---

## Data Flow: Admin Stock Update

```
Admin logs in (verifyAdminLoginFromDB)
        │
        ├── Queries admin_users table by username+password
        ├── Sets sessionStorage('de_logged_in', 'true')
        └── Renders admin app
                │
                ▼
        Admin edits product stock
                │
                ▼
        dbClient.from('products').upsert({id, stock, ...})
                │
                ├── Success → liveProducts[] updated in memory → table re-rendered
                └── Error  → toast error message shown
```

---

## Data Flow: WhatsApp Order

```
Customer clicks "Order on WhatsApp" (product card or product detail page)
        │
        ▼
Cart.openWhatsApp(productId)
        │
        ├── Looks up product by ID from PRODUCTS[]
        ├── Builds pre-filled message:
        │     "Hi! I want to order: *Sony Bravia 43"* Model: KD-43X75K Price: ₹45,999..."
        │
        └── window.open('https://wa.me/917020209281?text=...')
                │
                └── Opens WhatsApp (app or web) with pre-filled message
                        │
                        └── Owner receives order details → confirms manually → delivers
```

---

## Static Fallback Architecture

The site is designed with **graceful degradation** — it works even if Supabase is down:

```
                    ┌───────────────────────────────────────┐
                    │           PRODUCTS[] in memory        │
                    │                                       │
         Live data  │  ← fetchProductsFromDB() (Supabase)  │
         (priority) │                                       │
                    │  ← products-data.js (static file)    │  Fallback
                    │    (auto-loaded, always available)    │
                    └───────────────────────────────────────┘
```

Every `fetchProductsFromDB()` call has 3 fallback levels:
1. `dbClient` null → use static `PRODUCTS`
2. Supabase error → use static `PRODUCTS`
3. Supabase returns empty → use static `PRODUCTS`

**What works when Supabase is down:**
- ✅ Entire customer-facing website
- ✅ Product browsing, search, filtering
- ✅ WhatsApp ordering

**What fails when Supabase is down:**
- ❌ Admin panel login
- ❌ Stock updates visible to customers
- ❌ Product image uploads

---

## Script Dependency Graph

```
Supabase CDN SDK           (external)
        │
        └── supabase-config.js
                │ exports: dbClient, fetchProductsFromDB(), fetchCategoriesFromDB(),
                │          verifyAdminLoginFromDB(), uploadProductImageToStorage(), ...
                │
                ├── i18n.js
                │   exports: TRANSLATIONS, t(), setLanguage(), getCurrentLanguage()
                │
                ├── products-data.js
                │   exports: PRODUCTS[], getProductById(), formatPrice(), getDiscount(),
                │             getBrandColor(), BRAND_COLORS
                │
                ├── cart.js
                │   depends on: getProductById(), formatPrice() [from products-data.js]
                │   exports: Cart{}, Toast{}
                │
                └── main.js
                    depends on: ALL of the above
                    exports: buildProductCard(), renderSection(), goToSlide()
                             [all via global scope]
```

---

## Supabase Database Schema

### `products` table

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` PK | Auto-incremented |
| `name` | `text` | Full display name |
| `brand` | `text` | Brand name |
| `category` | `text` | Category key (`tv`, `refrigerator`, etc.) |
| `subcategory` | `text` | Sub-filter value |
| `type` | `text[]` | Feature tags array |
| `model` | `text` | Model number |
| `mrp` | `numeric` | Original price |
| `price` | `numeric` | Sale price |
| `stock` | `integer` | Units in stock |
| `size` | `numeric` | Screen size or litres |
| `rating` | `numeric` | 1.0–5.0 |
| `reviews` | `integer` | Review count |
| `is_new` | `boolean` | New arrival flag |
| `is_featured` | `boolean` | Featured product flag |
| `specs` | `jsonb` | Key-value specs object |
| `description` | `text` | Product description |
| `image` | `text` | Primary image URL |
| `images` | `text[]` | Additional images array |

### `categories` table

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` PK | Auto-incremented |
| `key` | `text` | Unique key used in URLs (`tv`, `ac`, etc.) |
| `name` | `text` | Display name |
| `description` | `text` | Short description |
| `icon` | `text` | Emoji icon |

### `admin_users` table

| Column | Type | Description |
|---|---|---|
| `id` | `bigint` PK | Auto-incremented |
| `username` | `text` | Admin username |
| `password` | `text` | ⚠️ Currently plaintext (see SECURITY.md) |
| `updated_at` | `timestamp` | Last password change |

---

## Deployment Pipeline

```
Developer local edits
        │
        ▼
git add . && git commit -m "..."
        │
        ▼
git push origin main
        │
        ▼
GitHub (nadimiiscgit/doordarshan_website)
        │  [webhook trigger]
        ▼
Vercel Build
  └── No build step required (static site)
      Files copied to CDN edge nodes
        │
        ▼
Live at Vercel URL (auto HTTPS)
  └── Every push = new deployment in ~30 seconds
```

---

## Page Structure

### index.html (Homepage)
Sections in order:
1. Topbar (announcement ticker)
2. Header (sticky nav + search)
3. Main nav (category mega menu)
4. Hero slider (3 slides)
5. Offer strip (deals ticker)
6. Categories grid
7. Featured products strip
8. New arrivals strip
9. Deal of the Day (countdown + Sony products)
10. LED TV strip
11. Refrigerators strip
12. Brand strip
13. Why Us (4 cards)
14. WhatsApp order banner
15. Payment options row
16. Footer

### category.html
- Same header/topbar/nav as index
- Filter sidebar (brand, subcategory, type, price)
- Products grid
- Active filter tags
- Pagination (not yet implemented)

### product.html
- Same header/topbar as index
- Breadcrumb
- Product detail (image, price, specs, badges)
- Tab panel (Description / Specifications / EMI / Delivery)
- Similar products strip

### admin.html (74KB, 1554 lines)
- Login screen overlay
- Sidebar navigation
- Tabs: Dashboard / Products / Categories / Bulk Images / CSV Import / Settings
