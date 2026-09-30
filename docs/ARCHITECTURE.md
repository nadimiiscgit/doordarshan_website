# ARCHITECTURE.md — Current Website Architecture

> Updated 30 September 2026 from the code currently present in the repository. This document describes the implementation that is actually served, not the earlier intended shared-runtime design.

## Executive summary

The project is a static Vercel site with three different browser runtimes:

1. `index.html` is a generated homepage snapshot with inline carousel/search controllers.
2. `category.html` and `product.html` are separate inline-script catalogue views that load Supabase and the static product catalogue.
3. `admin.html` is a large inline-script administration application using Supabase Auth.

The files `js/main.js`, `js/cart.js`, and `js/i18n.js` describe an older shared-runtime design, but none of the current HTML entry points references them. `css/style.css` is likewise not referenced by the current HTML pages.

## Runtime map

```text
                           Vercel static hosting
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
             index.html        category.html        product.html
           generated snapshot   inline catalogue     inline detail view
           + inline scripts     + Supabase           + Supabase
                 │                  │                  │
                 │                  └────────┬─────────┘
                 │                           │
                 │                   supabase-config.js
                 │                           │
                 │                  products-data.js fallback
                 │
                 └────────────── no shared live catalogue runtime

                              admin.html
                                  │
                         Supabase Auth session
                                  │
                  products / categories / Storage mutations
```

## Active page inventory

| Page | Active implementation | Data source | Current limitations |
|---|---|---|---|
| `index.html` | Generated HTML plus inline scripts | Embedded snapshot and assets; no live product query | Product tiles contain contact prompts rather than snapshot prices/stock; names, imagery, product claims, and featured lists can still drift |
| `category.html` | Inline filtering/rendering script | Static fallback followed by Supabase refresh | Loads all products; no pagination; fallback prices/stock are suppressed |
| `product.html` | Inline product detail script | Static fallback followed by Supabase refresh | Unknown IDs/slugs show not-found UI; static hosting may still return HTTP 200; fallback prices/stock are suppressed |
| `admin.html` | Inline admin application plus CSV UI module | Supabase Auth, Postgres, Storage | Large unbundled file; authorization depends on deployed RLS |
| `about.html` / `contact.html` | Static HTML | None | Mostly informational/WhatsApp contact pages |

## Catalogue data flow

```text
category.html or product.html loads
             │
             ▼
      products-data.js
      static PRODUCTS[]
             │
             ├── Render immediately from local data
             │
             └── fetchProductsFromDB()
                    │
                    ├── Supabase returns rows
                    │       └── map DB fields to frontend fields
                    │           replace PRODUCTS[] in memory
                    │
                    └── Error, empty result, or missing client
                            └── retain static fallback
```

The fallback improves availability but is not an inventory synchronization mechanism. Rows are tagged `_catalogSource: 'static-fallback'`; category and product pages suppress their price/availability fields and ask visitors to contact the store. The homepage is an independent static snapshot with contact prompts instead of baked-in prices/stock; it is still not a live catalogue feed.

The current database query uses `select('*')` and retrieves the complete product table. Filtering and sorting happen in the browser. There is no pagination, query limit, cache layer, timeout, or server-side filtering.

## Category page flow

`category.html` reads `cat`, `sub`, and `q` from the query string. It then applies category, search, brand, size, type, price, offer, and stock filters in browser memory.

Current caveats:

- The `brand` query parameter is not converted into an active brand filter.
- Product cards use their own inline markup rather than a shared card component.
- The page reports a product count but does not paginate.
- Price/stock filters operate only on live Supabase rows; fallback values are not presented as current.

## Product detail flow

```text
product.html?id=<number> or /product/<slug>
             │
             ▼
   static PRODUCTS[] lookup
             │
             ├── exact ID lookup
             ├── exact slug lookup
             └── not-found UI when no record matches
                     │
                     ▼
              renderProduct()
                     │
                     ├── show price/stock only for live Supabase rows
                     ├── gallery and thumbnails
                     ├── highlights and specifications
                     ├── related products
                     └── WhatsApp enquiry and phone-call links
```

The page no longer falls back to the first product or uses fuzzy slug matching. Its not-found UI is client-rendered; a static Vercel rewrite may still serve HTTP 200 unless separately configured.

Product detail pages do not currently load `cart.js`; the primary action is WhatsApp rather than an internal cart/checkout flow.

## Admin flow

```text
admin.html loads
       │
       ▼
getAdminSession()
       │
       ├── session exists → load admin application
       └── no session → show Supabase Auth login

Authenticated admin actions:
       ├── fetch products/categories
       ├── upsert/delete products
       ├── upsert categories
       ├── upload files to product-images Storage
       ├── bulk-update product image URLs
       ├── preview/validate CSV with `js/csv-import.js` and `js/admin-csv-ui.js`
       ├── import catalog rows or stock-only updates through DB helpers
       ├── export quoted CSV
       └── update current Auth user's password
```

The browser session check only controls the UI. Supabase RLS and Storage policies must be the final authorization boundary. The current policy blueprint grants write access to the broad `authenticated` role; it does not establish an admin-only role.

Admin product loading is strict: it does not substitute the static catalogue after an error. Product mutations check for a loaded live catalogue and an active Auth session, and report database-confirmed results. This client guard is not a replacement for RLS.

## Supabase integration

The active helper is `js/supabase-config.js`.

### Active functions

- `signInAdminWithAuth(email, password)`
- `signOutAdmin()`
- `getAdminSession()`
- `updateAdminPasswordInDB(_, newPassword)` — the first argument is currently unused
- `fetchCategoriesFromDB()`
- `saveCategoryToDB(categoryObj)`
- `fetchProductsFromDB({ allowFallback })` — public pages may receive tagged static fallback rows; admin requests strict live data.
- `upsertProductsToDB()`, `updateProductStocksInDB()`, `updateProductImagesInDB()`, `deleteProductFromDB()` — verify database-returned rows.
- `uploadProductImageToStorage(file)`

### Product mapping

Database fields are mapped as follows:

| Database field | Browser field |
|---|---|
| `is_new` | `isNew` |
| `is_featured` | `isFeatured` |
| `description` | `description` |
| `images` | `images` |
| `price`, `mrp`, `stock`, `size` | numeric browser values; current only when `_catalogSource === 'supabase'` |

The mapping should be formalized in one schema module. Renderers accept legacy `desc` as a description fallback, and product galleries use `image` when `images` is missing or empty.

## CSV import

`admin.html` loads `js/csv-import.js` and `js/admin-csv-ui.js`. The first parses common CSV headers and creates a pure validation plan; the second renders a text-only row preview, requires a live catalogue/admin session, and calls the Supabase data helpers. Files are capped at 5 MB and 1,000 data rows.

The checked-in stock-summary CSVs contain names and quantities, not sale rates or MRP. Their row serials are not database IDs. Stock-only imports update stock only, and only when the product name/model has one exact match; ambiguous/unmatched rows are blocked. A rate-bearing file (e.g. a `Rate`, `Selling Price`, or `Price` column) is required to update prices.

## Orders and inventory

There is no checkout or order service. The customer contacts the store by WhatsApp or phone; the store confirms price, availability, payment, delivery, installation, invoice, and warranty outside the site. A WhatsApp enquiry is not an order and does not reserve stock. `localStorage` cart state in the unwired legacy `Cart` object is not authoritative.

```text
Browser product data
       │
       ▼
WhatsApp enquiry or phone call
       │
       ▼
Manual store confirmation
       │
       └── payment, stock, delivery, installation, invoice, and warranty handled outside site
```

## Deployment

```text
Developer commit
      │
      ▼
Git push to configured Vercel branch
      │
      ▼
Vercel serves repository files as static assets
      │
      └── vercel.json supplies rewrites and security headers
```

There is no build step or staging environment documented in the repository. The deploy must therefore be treated as a direct production/static publish unless Vercel project settings provide otherwise.

The GitHub Actions CI workflow runs on pull requests and checks secrets, architecture, JavaScript syntax, local HTML assets/Vercel JSON, and CSV tests. The repository currently has no branch protection/ruleset requiring the CI status, so a failed check does not automatically block merging. The separate scheduled Supabase workflow creates a weekly JSON catalogue snapshot; it does not compare that snapshot with the static catalogue. A future comparator should live in `scripts/` as Node code and run from GitHub Actions, not in HTML. Recommended cadence: weekly automated diff, plus admin review before any bulk catalogue import/publication.

## Known architecture drift

The following earlier assumptions are no longer true:

- All pages do not share one script load order.
- `main.js` is not the active homepage renderer.
- `cart.js` is not wired into the current product detail flow.
- `i18n.js` is not loaded by the current HTML entry points.
- `style.css` is not the active shared stylesheet.
- Login does not query `admin_users`; it uses Supabase Auth.
- The homepage does not receive live product updates from Supabase.

The next architectural step should be to choose one implementation direction: either wire the shared modules into every intended page or remove/archive the unused modules and make the inline/generated runtime the deliberate source of truth.
