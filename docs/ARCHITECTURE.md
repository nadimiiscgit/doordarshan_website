# Architecture — branch implementation

This describes the repository as of 5 October 2026. It does not claim the redesigned branch is deployed.

## Runtime

```text
Vercel static routes → index / category / product / store HTML
                    → css/site.css + js/site.js
                    → js/supabase-config.js → Supabase public catalogue_products projection
                                             ↘ data/catalog-snapshot.json on error only

admin.html → Supabase Auth + site_admins allowlist (after SQL rollout)
           → products / categories / site_content / product-images Storage
```

The public HTML is hand-authored and intentionally has no checkout/cart or promotional banners. `about.html` and `contact.html` redirect to `store.html`; Vercel also rewrites `/about`, `/contact`, `/support`, and `/store` to the store page. Other legacy category/product rewrites remain in `vercel.json`.

## Data contracts

- `products`: admin-only CRUD; added `is_approved` defaults false. A trigger copies approved rows into `catalogue_products` and deletes them from that projection when unapproved or deleted. Public clients have no base-table grant. The projection contains no stock, ratings, reviews or MRP. Valid empty query results remain empty. Product cards link to `product.html?id=<id>`; old slug URLs are resolved by paging approved products and exact slug comparison.
- `categories`: admin-managed name, key, description, icon and optional image. Public read; default categories are only a connection fallback, not an override of a valid empty result.
- `site_admins`: SQL-managed Auth UUID allowlist, not browser metadata. Admin UI checks it after sign-in; RLS is the actual write boundary.
- `site_content`: singleton `main` row with published, draft, previous JSON and a version. The admin saves draft, previews in the same browser using local storage, publishes atomically via a security-invoker RPC, or restores the immediately previous version. Published content holds homepage copy, store introduction/address, contact numbers, showroom image and curated product ID lists. There is only one-level restore, not full revision history.
- `product-images` Storage: admin-uploaded product, category and showroom images. Public reads; image URLs must be HTTPS. The browser checks MIME/signature, size and dimensions before upload; Storage policies must be verified remotely.

## Public catalogue and fallback

The catalogue performs server-side category/brand/search/sort/range filtering on the approved-only projection with a 12-item page. Brand options are loaded from at most 1,000 public brand rows; a larger catalogue needs a dedicated facets query. The homepage loads up to four IDs per curated section. Product details load by ID and show at most four related products. Prices display only for valid live values and always ask for confirmation.

Only a network/API error invokes `data/catalog-snapshot.json`. The snapshot generator strips price, stock, MRP, rating and reviews. The initial snapshot is empty. The read-only Action compares the live approved set against the checked-in snapshot and reports drift by failing; it needs the GitHub `SUPABASE_URL` variable and `SUPABASE_ANON_KEY` secret. GitHub schedules run only from the default branch, so its weekly schedule is not active while this workflow exists only on `vijay-sales-theme`. Refresh is a manual, reviewed `--write` operation. This is not a database backup. Snapshot prices are never shown. Offline category data still comes from the built-in category fallback if the category API is unavailable.

## Boundaries and known limits

This is a modular static site, not a server-rendered framework. It is sufficient for a local contact-first catalogue; individual product SEO, a large catalogue, accounts or checkout may justify a later framework migration. The public JS and data helper are distinct, and stable product IDs/routes ease migration. The admin remains inline-heavy and its legacy unused code should be retired separately. No online order, payment, stock reservation, invoice or order-status flow exists.
