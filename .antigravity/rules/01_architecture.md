# Rule 01: Architecture & Data Isolation

> **Scope**: System architecture, data access patterns, caching laws, and state management.  
> **Hard Ceiling**: < 500 lines. Refactor existing lines on updates; never blindly append.

---

## 1. The Repository Isolation Pattern (Mandatory)

All database queries, mutations, storage calls, authentication, and BaaS client configurations are strictly isolated inside `js/supabase-config.js`.

### Absolute Prohibitions
- **NO Direct Database Calls in UI Views**: Files such as `index.html`, `category.html`, `product.html`, `contact.html`, `about.html`, or `admin.html` MUST NEVER instantiate a database client or execute raw queries like `supabase.from('products').select(...)`.
- **NO Direct Auth Calls in UI**: UI components must never call `supabase.auth.*` directly.
- **NO Inline Storage API calls**: All uploads must invoke the unified repository method.

### Allowed Interface Contract (`js/supabase-config.js`)
UI files may only consume high-level exported functions:
- `fetchProductsFromDB()`: Retrieves catalog with caching and fallback.
- `fetchCategoriesFromDB()`: Retrieves category list with fallback.
- `saveCategoryToDB(categoryObj)`: Upserts a category.
- `uploadProductImageToStorage(file)`: Uploads image to Supabase Storage bucket.
- `signInAdminWithAuth(email, password)`: Authenticates admin via Supabase Auth.
- `signOutAdmin()`: Clears active session.
- `getAdminSession()`: Checks session state.

### Migration Portability
If migrating from Supabase to a custom backend (Node/Go/FastAPI on a VPS) or PocketBase/SQLite, **only `js/supabase-config.js` is modified**. Presentation views and HTML components require zero code changes.

---

## 2. Caching Laws & High-Availability Fallback

The customer-facing storefront must operate with **graceful degradation** and 100% uptime, even if the database is unreachable, paused, or rate-limited.

### Stale-While-Revalidate (SWR) Pattern
1. **Cache First**: Catalog fetches check `localStorage` for a cached catalog with a timestamp (`TTL: 10 minutes`).
2. **Instant Paint**: If cache exists, render the catalog immediately (0 ms network delay).
3. **Background Revalidation**: Fetch fresh data asynchronously; update `localStorage` and re-render only if data changed.
4. **Rate Limit Shield (HTTP 429 / Offline)**: If Supabase returns 429, 500, or a network exception, catch the error and fallback immediately to the static catalog array `PRODUCTS` in `js/products-data.js`.

### Fallback Hierarchy
```
fetchProductsFromDB()
  ├─ 1. SWR Browser Cache (localStorage) ──► Instant UI Render
  ├─ 2. Live Supabase PostgREST API       ──► Update Cache & UI
  └─ 3. Static Array (js/products-data.js) ──► Safe Offline Fallback
```

---

## 3. Disabling Realtime WebSockets

To preserve the 200 concurrent connection limit on the Supabase free tier:
- **Zero Realtime Subscriptions for Browsing**: Never call `supabase.channel()` or `.on('postgres_changes', ...)` for product browsing, search, or category listings.
- **Stateless HTTP/2 Only**: All catalog operations must remain stateless REST queries via PostgREST. PostgREST connection pools multiplex queries efficiently, preventing database connection exhaustion.
- **WebSocket Ban**: 10,000 concurrent visitors must consume 0 persistent WebSocket connections.

---

## 4. Script Load Order & Dependency Chain

Scripts must always be loaded in this strict sequential order at the closing of `<body>`:

1. `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` (External SDK)
2. `js/supabase-config.js` (Initializes `dbClient` and data layer)
3. `js/i18n.js` (Bilingual translation dictionary & switcher)
4. `js/products-data.js` (Static product catalog & schema helper functions)
5. `js/cart.js` (LocalStorage cart state & WhatsApp payload builder)
6. `js/main.js` (UI rendering, carousel controls, event bindings)

---

## 5. Core Data Schemas

### `products` Table / Object
- `id` (bigint / integer): Unique primary key.
- `name` (text): Display name.
- `brand` (text): Brand identifier (Sony, Samsung, LG, Whirlpool, etc.).
- `category` (text): Category slug (`tv`, `refrigerator`, `ac`, `washing`, etc.).
- `subcategory` (text): Filtering subcategory (e.g., `43-inch`, `double-door`).
- `type` (text[]): Feature badges (e.g., `['4K', 'Smart TV', 'QLED']`).
- `model` (text): Manufacturer model number.
- `mrp` (numeric): Maximum Retail Price in INR.
- `price` (numeric): Active selling price in INR.
- `stock` (integer): Available stock count (`0` = Out of Stock).
- `size` (numeric): Screen size in inches or fridge capacity in litres.
- `rating` (numeric): Average rating (1.0–5.0).
- `reviews` (integer): Review count.
- `is_new` (boolean): Flags "New Arrival" tag.
- `is_featured` (boolean): Flags inclusion in featured promo strips.
- `specs` (jsonb): Key-value technical specifications.
- `description` (text): Short product overview.
- `image` (text): Public URL to primary product image.
- `images` (text[]): Array of public URLs for product gallery.

### `categories` Table / Object
- `id` (bigint / integer): Primary key.
- `key` (text): URL filter slug (`tv`, `refrigerator`, `ac`, `washing`, `small`).
- `name` (text): Display title.
- `description` (text): Category summary.
- `icon` (text): Category emoji or icon SVG.

---

## 6. Checkout & Order Flow Architecture

- **WhatsApp-Assisted Checkout**: No third-party payment gateway lock-in at current scale.
- Customers build a cart or click "Buy Now" on a product.
- `Cart.openWhatsApp()` formats an order payload (product names, model codes, prices, total).
- Message targets the verified showroom number: `+91 70202 09281`.
- Store managers verify inventory and arrange direct local doorstep delivery.
