# Doordarshan Electronics

An original, minimal catalogue for the Dharashiv showroom. There is no checkout, cart, online payment or order system. Visitors browse products and contact the store by WhatsApp or phone; the store confirms current price, availability and terms.

## Implementation status

The redesigned public pages and admin controls are implemented **in this branch**, not confirmed live. The production domain and Supabase policy state have not been verified from this workspace. Do not switch `www.dharashivbazar.com` to this version until the [release checklist](#release-checklist) passes.

The public site uses `index.html`, `category.html`, `product.html`, and `store.html` with shared `css/site.css` and `js/site.js`. The former About and Contact `.html` URLs redirect to the store page; legacy Vercel routes are preserved. `admin.html` retains product, category, image and CSV management and adds a Site Content draft/preview/publish/restore editor and product approval control.

Supabase is the live source of truth. An admin-only `products` table publishes approved records into a separate public `catalogue_products` projection without stock, ratings or private columns. The checked-in `data/catalog-snapshot.json` is a sanitized emergency fallback: no price, stock, rating or reviews. It is currently empty pending owner review and migration. A valid empty live response is not treated as an outage. Store contact defaults in code are a temporary safety net until site content is published.

## Run and verify locally

Serve the repository over HTTP (not `file://`):

```bash
python3 -m http.server 8080
```

Run the CI checks:

```bash
node scripts/validate-architecture.js
node scripts/check-js-syntax.js
node scripts/validate-assets.js
node scripts/validate-public-site.js
node --test tests/*.test.js
```

The site has no build step or package manifest. The browser loads a pinned Supabase UMD client from jsDelivr, and `js/supabase-config.js` holds a public publishable key. Never put a service-role key in browser code.

## Release checklist

1. Inspect the current Supabase schema, policies, grants, Storage bucket policies and Auth users. Back up the database. Test both SQL scripts in staging. Apply the **additive** [preparation SQL](docs/database-preparation.sql) first; it leaves the old site’s base-table read path intact. Seed only verified owner Auth UUIDs in `site_admins` through the trusted SQL Editor. Neither script has been applied from this workspace.
2. Verify the new preview can read `catalogue_products` and the owner can sign in. Audit names, models, photos, highlights, specifications and rates. Approve only verified products, then curate up to four featured and four new IDs, preview and publish Site Content.
3. Refresh the sanitized fallback with `SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/refresh-catalog-snapshot.js --write`. Review its diff; it must contain no price, stock or personal information. Configure the GitHub Actions variable `SUPABASE_URL` and secret `SUPABASE_ANON_KEY` with the project's URL and **publishable** key. The read-only drift workflow runs on manual dispatch, and its Sunday 04:00 UTC schedule becomes active only after this workflow is on the default branch. It fails on drift and never commits raw database backups. It is not a database backup.
4. Open a protected pull request to `main`; require the `Security, Linting & Architecture Guardrails` check in GitHub branch protection and require pull requests/no direct pushes. CI running alone does **not** prevent a failed merge. Protection settings must be verified in GitHub, not inferred from YAML. Test a shareable Vercel preview on desktop/mobile: search/filter/pages, galleries, legacy URLs, contact links, empty/error states, admin publishing, console, images and headers.
5. Promote this **one** site version to the production project/domain and verify `https://www.dharashivbazar.com/`. If it fails, roll the site back before the lockdown step. Then apply the reviewed [security hardening SQL](docs/database-security-hardening.sql) to remove old public base-table access and broad writes. Re-test anonymous, ordinary signed-in and allowlisted-admin access plus Storage. After lockdown, rolling back to the old site would also require a reviewed database reversal; keep this distinction explicit.

## Important limitations

- Production DB and Vercel settings remain unverified; no migration or deployment is run automatically.
- The sanitized fallback is empty until refreshed after approval. During a Supabase outage it will show a contact-first empty state, not placeholder rates.
- Static product pages have client-rendered details and limited individual-product SEO; a framework migration can happen later while retaining IDs, data contracts and URLs.
- Admin remains a large inline-script page; it needs further decomposition and browser security testing. Its old legacy CSV functions are present but the active import uses `js/admin-csv-ui.js`.
- The old `js/products-data.js`, `js/main.js`, `js/cart.js`, `js/i18n.js`, `css/style.css`, and `css/v2-tailwind.css` are not loaded by public pages. They remain in the repo for historical reference and should not be reconnected without a deliberate review.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), and the [roadmap](docs/ROADMAP_BRAINSTORMING.md).
