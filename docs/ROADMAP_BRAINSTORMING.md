# Website roadmap and release state

Updated 5 October 2026. Checked items mean implemented **in this branch**, not deployed or verified on production. The chosen product is a local, WhatsApp/call-only catalogue; checkout, cart, payments and orders are explicitly out of scope.

## Implemented locally

- [x] Replace the generated Vijay Sales-like public homepage and inconsistent public scripts with an original, minimal local-showroom design shared across home, catalogue, product and store pages.
- [x] Remove banners, bottom “Explore our products”, discounts, fake ratings/reviews, stock promises and checkout-like actions from the public UI.
- [x] Add category-first home, visible search, admin-curated featured/new sections (four each), server-side catalogue filtering/sorting/paging, product gallery/specs/related items, and WhatsApp/call enquiries.
- [x] Add product approval, category photo field, Site Content draft/preview/publish/restore editor, and allowlist-aware admin sign-in in code.
- [x] Provide fail-closed SQL policy blueprint and a sanitized, price-free snapshot path. Distinguish valid empty live results from API failures.
- [x] Replace raw-table backup commits in this branch's workflow with a read-only live-versus-snapshot comparison. The schedule is not active until the workflow reaches the default branch; configure the GitHub variable/secret first.
- [x] Add public boundary checks, catalogue tests, and update Markdown documentation.

## Mandatory before the one-site switchover

- [ ] Verify actual Supabase schema, Auth accounts, grants, RLS, Storage policies and backups; test the additive preparation and later lockdown SQL on staging. Seed only verified owner UUIDs in `site_admins`. Run allow/deny policy tests and security advisors. This workspace had no authenticated Supabase database access.
- [ ] Audit and approve each public product: model, imagery, description, highlights, specifications and genuine rates. Current stock-summary CSVs do not carry rate fields. Do not treat old placeholder prices or brand logos as verified.
- [ ] Add real showroom/category images and publish Site Content. Refresh and review the sanitized snapshot after product approval. Its initial empty state is intentional.
- [ ] Run browser/device and Vercel preview smoke tests, including console, images, redirects, headers, draft/publish/restore, WhatsApp and calls. Browser preview was unavailable in the current sandbox.
- [x] Configure GitHub `main` protection to require pull requests and the CI status check, with bypass disabled (including administrators). Separate review approval is not required.
- [ ] Verify the protection blocks a pull request when its CI check fails.
- [ ] Review a public shareable Vercel preview, merge **one** chosen site version, then point/verify the single production domain. Keep a rollback deployment. Do not combine the old main design with this branch's design.

## Follow-up hardening

- [ ] Decompose the inline admin app and remove unused legacy CSV/public modules and styles after regression testing.
- [ ] Finish an admin XSS sink audit and move inline handlers/scripts out of HTML. Tighten CSP and remote image-host allowlist after testing.
- [ ] Add a dedicated catalogue brand-facets query for more than 1,000 approved rows; improve slug lookup/indexing or use stable IDs only.
- [ ] Add automated browser accessibility, responsive, broken-image and end-to-end admin tests. Validate missing-product HTTP status and per-product SEO strategy. A framework migration remains optional for significant SEO, scale or new transactional needs.
- [ ] Consider full content revision history; the implemented restore currently supports only the immediately previous published version.
