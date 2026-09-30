# JavaScript inventory

> Updated 30 September 2026. This file distinguishes code that is loaded by the current HTML pages from code that is present but currently unwired.

The browser JavaScript is mostly global, unbundled, and loaded with ordinary `<script>` tags. There is no package manifest, lockfile, bundler, or lint configuration. Node.js 20 runs repository scripts and the built-in `node:test` suite in CI.

## Current script loading

The active pages do not share one script order:

| Page | Scripts currently loaded |
|---|---|
| `index.html` | Inline generated homepage controllers only; no shared JS modules |
| `category.html` | Supabase CDN, `supabase-config.js`, `products-data.js`, and an inline catalogue script |
| `product.html` | Supabase CDN, `supabase-config.js`, `products-data.js`, and an inline product script |
| `admin.html` | Supabase CDN, `supabase-config.js`, `products-data.js`, `csv-import.js`, a large inline admin script, and `admin-csv-ui.js` |
| `about.html` / `contact.html` | No shared application JavaScript |

The following files are present but are not referenced by the current HTML entry points:

- `main.js`
- `cart.js`
- `i18n.js`

They represent an older shared homepage/runtime design and should either be wired into the active pages or archived and removed after the replacement is confirmed.

## `supabase-config.js`

This is the active data-access helper for the category, product, and admin pages.

### Configuration

```javascript
const SUPABASE_URL = 'https://lodiiprfdimohskhcpyf.supabase.co';
const SUPABASE_ANON_KEY = '...';
```

The browser-visible key is a Supabase publishable/anon key, not a secret. Its safety depends on RLS and Storage policies.

### Active functions

- `signInAdminWithAuth(email, password)` — Supabase Auth password login.
- `signOutAdmin()` — signs out the current Auth session.
- `getAdminSession()` — restores the current Auth session.
- `updateAdminPasswordInDB(_, newPassword)` — updates the currently authenticated user's password; the first argument is unused.
- `fetchCategoriesFromDB()` — reads categories, falling back to `DEFAULT_CATEGORIES`.
- `saveCategoryToDB(categoryObj)` — upserts one category.
- `fetchProductsFromDB({ allowFallback })` — reads all products; public pages may receive explicitly tagged fallback rows, while admin requests strict live data.
- `upsertProductsToDB()`, `updateProductStocksInDB()`, `updateProductImagesInDB()`, `deleteProductFromDB()` — verify database-returned rows before reporting success.
- `uploadProductImageToStorage(file)` — uploads a file to the public `product-images` bucket and returns its public URL.

### Current limitations

- Product queries use `select('*')` and load the entire table.
- There is no request timeout, pagination, cache, or server-side filtering.
- Public fallback rows carry `_catalogSource: 'static-fallback'`; catalogue/product views suppress their prices and stock. The homepage is a separate generated snapshot, not this API.
- Upload validation still needs MIME/content/size/dimension controls and Storage policy verification.
- This client-side session check is not an authorization boundary; deployed RLS and Storage policies remain unverified.

## `csv-import.js` and `admin-csv-ui.js`

`csv-import.js` contains a quote-aware CSV reader, delimiter detection, common header aliases, Indian currency/quantity parsing, and a pure import-plan validator. `admin-csv-ui.js` reads CSV only (5 MB / 1,000 data rows), builds a text-only preview, and applies a plan only after live product data and an admin session are available.

- Catalog rows require a positive sale rate, valid MRP (or existing MRP), valid category/brand, and valid stock (or existing stock).
- Stock-only rows update stock only and need a unique exact name/model match; serial numbers are never used as database IDs.
- Ambiguous/unmatched rows, duplicate targets, invalid fields, and malformed quoting block confirmation.
- The current two checked-in inventory CSVs do not contain rate/MRP columns, so they cannot update selling prices.
- CSV export uses quoted fields and neutralizes spreadsheet formula-leading values.
- Automated tests live in `tests/csv-import.test.js` and run with `node --test tests/*.test.js`.

## `products-data.js`

Static catalogue fallback and browser utility functions. The current file contains approximately 110 product records across the categories represented in the seed data.

### Product shape

```javascript
{
  id: Number,
  slug: String,             // present for some imported/catalogue records
  name: String,
  brand: String,
  category: String,
  subcategory: String,
  type: String[],
  model: String,
  mrp: Number,
  price: Number,
  stock: Number,
  size: Number,
  rating: Number,
  reviews: Number,
  isNew: Boolean,
  isFeatured: Boolean,
  specs: Object,
  description: String,
  image: String,
  images: String[]
}
```

The canonical data field is `description`; storefront renderers also read legacy `desc` values for compatibility. Database fields `is_new` and `is_featured` are mapped to `isNew` and `isFeatured`.

### Utilities

- `getProductById(id)` — finds one numeric product ID.
- `getProductsByCategory(category, filters)` — legacy filter helper.
- `getFeaturedProducts(limit)` — legacy featured-product helper.
- `getNewArrivals(limit)` — legacy new-arrival helper.
- `formatPrice(num)` — Indian currency formatting or `Call for Price` for values at/below 1.
- `getDiscount(mrp, price)` — integer discount percentage or `null`.
- `getBrandColor(brand)` — placeholder colour pair.

This file should not be treated as the authoritative inventory. It is a static fallback until a single catalogue source and reconciliation process are established.

## `cart.js` — currently unwired

The legacy `Cart` object stores `{ id, qty }` entries in `localStorage` under `de_cart_v1`.

Available operations:

- `Cart.get()`, `save()`, `add()`, `remove()`, `setQty()`, `clear()`
- `Cart.count()`, `total()`, `lineItems()`
- `Cart.updateBadge()`
- `Cart.openWhatsApp(productId)`

Current limitations:

- The product detail page does not load this file.
- Quantities are capped at 10, not at live stock.
- Prices are recalculated from browser data and are not authoritative.
- Unknown/deleted products can remain in local storage.
- WhatsApp handoff does not create an order or reserve stock.

`Toast` creates notifications, but currently renders messages with `innerHTML`; use `textContent` for untrusted content.

## `i18n.js` — currently unwired

Contains an English/Marathi dictionary and local-storage preference key `de_website_lang`.

Main functions:

- `getCurrentLanguage()`
- `t(key, params)`
- `setLanguage(lang)`
- `initLanguageSwitcher()`

The current HTML pages do not load this file, so bilingual behavior described here is not active site-wide. The implementation also uses `innerHTML` for translated nodes and should be reviewed before being reconnected.

## `main.js` — currently unwired legacy homepage runtime

Contains the earlier dynamic homepage implementation:

- Product cards and image fallbacks.
- Hero slider and countdown.
- Mega menu and sticky header.
- Search suggestions.
- Comparison engine.
- Horizontal scrolling and homepage sections.
- Dynamic product/category loading.

It expects DOM IDs and classes that belong to the earlier handcrafted homepage, not the current generated `index.html`. It builds large HTML strings from product data and includes inline event handlers, so it should not be reconnected without XSS and schema review.

## Maintenance guidance

Before adding more JavaScript:

1. Choose the active page/runtime architecture.
2. Define one validated product schema.
3. Move database mutations behind a small, testable data-access boundary.
4. Replace global variables and inline handlers with modules and event listeners.
5. Add syntax checks, linting, unit tests for filtering/pricing, and browser smoke tests.
6. Treat static fallback data as versioned cache data, not live stock.
