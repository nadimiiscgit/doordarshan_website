# JavaScript ownership

| File | Status |
|---|---|
| `site.js` | Active shared public runtime: home, catalogue, product, store contact links and snapshot fallback. Uses DOM text insertion for database strings. |
| `supabase-config.js` | Active shared Supabase client/repository helper. Public functions query explicit fields from `catalogue_products`; admin functions handle Auth and base-table writes. No service-role key. |
| `admin-site-content.js` | Active Admin Site Content editor: draft/preview/publish/one-level restore, curated approved product IDs, store/category image uploads. |
| `csv-import.js`, `admin-csv-ui.js` | Active CSV parsing/validation and admin preview/import. Stock-only files do not invent prices. Catalogue imports unapprove touched rows for re-review. |
| `products-data.js` | Historical unreviewed static catalogue with placeholder rates; intentionally unwired. Do not use as public fallback. |
| `main.js`, `cart.js`, `i18n.js` | Legacy/unwired; not part of the active public site. |

The public page script load order is pinned Supabase UMD client → `supabase-config.js` → `site.js`. Admin loads the same client/helper plus CSV/content modules. The `site_content` and `is_approved` contracts require the reviewed SQL rollout before public catalogue launch.
