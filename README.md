# Doordarshan Electronics Website

Static catalogue and showroom website for Doordarshan Electronics in Dharashiv, Maharashtra. The current site lets visitors browse products, filter the catalogue, view product details, and contact the store through WhatsApp.

> Documentation status: updated 30 September 2026 from the files currently in this directory. The homepage and catalogue are currently implemented as separate browser runtimes; see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Current stack

| Layer | Current implementation |
|---|---|
| Pages | Static HTML: `index.html`, `category.html`, `product.html`, `contact.html`, `about.html`, `admin.html` |
| Styling | `css/v2-tailwind.css`, inline page styles, and admin-only embedded CSS; `css/style.css` is legacy and is not referenced by the current HTML pages |
| Browser logic | Inline page scripts plus `js/supabase-config.js`, `js/products-data.js`, `js/csv-import.js`, and `js/admin-csv-ui.js` |
| Backend | Supabase Postgres, Supabase Auth, and Supabase Storage |
| Hosting | Vercel static hosting and CDN via `vercel.json` |
| External services | Supabase CDN client, Google Fonts, Unsplash and other remote image hosts, WhatsApp deep links |
| Payments/orders | No online checkout; enquiries use WhatsApp or phone and any order is handled manually outside the site |
| Build/test tooling | No package manifest, lockfile, bundler, or production build; Node.js scripts and built-in `node:test` cover syntax, local assets/config, and CSV import behavior |

## Important current-state notes

- `index.html` is a generated/static homepage snapshot. It does not load the shared `main.js`, `cart.js`, or `i18n.js` runtime.
- `category.html` and `product.html` render their own inline UI and load Supabase plus the static product catalogue.
- `admin.html` contains a large inline admin application and uses Supabase Auth for sign-in.
- `js/main.js`, `js/cart.js`, and `js/i18n.js` are present but currently unwired from the active HTML entry points. They should be treated as legacy/partially implemented code until the runtime is consolidated.
- The Supabase publishable key is embedded in browser code. This is expected for a public client, but database RLS and Storage policies must enforce all write permissions.
- The static catalogue is explicitly marked as a fallback, not a reliable inventory guarantee. Category/product pages suppress fallback prices and stock; homepage product tiles contain contact prompts rather than snapshot prices/stock.
- The checked-in inventory CSVs are stock summaries, not price lists: they contain item descriptions and quantities, but no MRP or selling-rate columns. Their serial numbers are not database product IDs.

## Directory map

```text
/
├── index.html, category.html, product.html, about.html, contact.html, admin.html
├── vercel.json
├── AGENTS.md                   Repository workflow and documentation maintenance rules
├── assets/brand_images/        Brand logos and arrow assets
├── css/                        Shared/generated styles and CSS documentation
├── js/                         Supabase client, CSV import modules, static catalogue, and legacy browser modules
├── data/                       Source stock CSV files
├── docs/                       Architecture, security, and roadmap documentation
├── scripts/                    Architecture, syntax, and local asset/config checks
└── tests/                      Node built-in CSV import tests
```

## Run locally

Use an HTTP server; opening the files directly with `file://` can break relative assets and browser APIs.

```bash
cd doordarshan_website
python3 -m http.server 8080
```

Open `http://localhost:8080`. The browser will attempt to reach the configured Supabase project when the relevant page loads.

There is currently no `.env` workflow. The Supabase URL and publishable key are in `js/supabase-config.js`; do not place a service-role key or any private credential in browser code.

## Supabase integration

The code currently uses:

- `products` for catalogue records, pricing, stock, specifications, and image URLs.
- `categories` for admin-managed category definitions and fallback category labels.
- Supabase Auth for the admin sign-in session.
- `product-images` Storage bucket for product image uploads.

The `admin_users` table is still described in older documentation, but the current browser code does not authenticate against it. Verify whether that table is still needed and remove or lock it down if it is obsolete.

The public category/product pages query the products table and may fall back to `js/products-data.js` when the client is unavailable, the query fails, or the result is empty. Fallback rows are tagged as `static-fallback`; the public catalogue does not present their price or stock as current. The homepage itself is a generated snapshot and has no live catalogue query.

## Admin panel

`admin.html` provides:

- Supabase Auth sign-in and session restoration.
- Product create/edit/delete operations.
- Category management.
- Image upload and bulk image assignment.
- CSV-only import and correctly quoted CSV export. The importer previews and validates rows, distinguishes price/catalog files from stock-only summaries, requires safe product matches, and never invents rates or database IDs.
- Password update for the currently authenticated Supabase user.

The UI has client-side validation, a per-tab login lockout, and an inactivity timer. These are usability controls, not substitutes for server-side authorization. Verify the deployed RLS and Storage policies before allowing production writes; the policy blueprint currently grants writes to the broad `authenticated` role and needs a true admin-role restriction.

## Order flow

The current customer flow is a call/WhatsApp enquiry, not checkout:

1. The visitor views a product.
2. The visitor calls or opens a WhatsApp enquiry; the site asks the store to confirm current price and availability.
3. The store handles any order, payment, delivery, installation, and warranty details outside the website.

There is no checkout procedure, server-side order record, payment capture, stock reservation, invoice generation, or order tracking. A WhatsApp message is not an order confirmation.

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — active page/runtime boundaries and data flows.
- [SECURITY.md](docs/SECURITY.md) — current security posture and remediation plan.
- [ROADMAP_BRAINSTORMING.md](docs/ROADMAP_BRAINSTORMING.md) — prioritized implementation roadmap.
- [js/README.md](js/README.md) — JavaScript file inventory, including currently unwired modules.
- [css/README.md](css/README.md) — active versus legacy stylesheet inventory.

## Known issues

- Homepage, category, product, and admin pages are not built from one shared component/runtime system.
- Some admin/data-rendering and legacy scripts still need a complete XSS audit; catalogue cards and the active CSV preview now escape/render imported values safely.
- Database write policies must be verified and restricted to real admins.
- Product detail now shows a not-found state for unknown IDs/slugs, but static hosting may still return HTTP 200 for that page.
- The cart and translation modules are not wired into the current active pages.
- Catalogue queries load all products with `select('*')`; there is no pagination, caching, or server-side filtering.
- CSV import accepts `.csv` only; the repository's current stock CSVs have no prices, so an authorized admin must supply a rate-bearing file to update prices.
- CI runs on pull requests, but merge blocking is not configured in GitHub: no branch protection or rulesets currently require its checks.
- The weekly Supabase snapshot workflow does not yet compare the snapshot with the static catalogue; comparison logic is planned as a Node/GitHub Actions task, not browser HTML.
- There is no online checkout, payment integration, order tracking, or inventory reservation.
- Product/category pages have limited SEO metadata and no product JSON-LD, canonical strategy, sitemap, or robots file.
