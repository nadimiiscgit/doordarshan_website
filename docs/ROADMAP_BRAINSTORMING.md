# Doordarshan Electronics — Remediation Plan

> Updated 30 September 2026. This plan consolidates the review with the first implementation pass. Checkboxes reflect repository changes only; deployed Supabase/Vercel state and real product data remain unverified.

## Scope and assumptions

The agreed near-term model is a product catalogue with call/WhatsApp-assisted sales; there is no online checkout. The admin account holder manages catalog data, subject to production authorization policy. The deployed Supabase policies, Vercel project settings, real inventory, and business policies cannot be confirmed from this repository alone; verify those directly before relying on them.

Keep the call/WhatsApp model, make catalog/admin information trustworthy, and treat full checkout as a separate project. Do not advertise a browser-side cart or a WhatsApp message as a completed order or payment. Other phases remain parked until the P0 data/security questions are reviewed.

## Priority summary

1. **P0 — Release safety:** homepage selector/asset defects, not-found behavior, strict admin data loading, verified mutation responses, and CI checks have received a first code pass; browser/device and deployed checks remain.
2. **P0 — Customer/data trust:** rate-bearing CSV and production Supabase data still need deliberate reconciliation; the two current stock CSVs contain no prices.
3. **P1 — Security:** close broad write policies, prevent stored/reflected HTML execution, harden uploads/imports, then tighten the Content Security Policy.
4. **P2 — Sustainable architecture:** choose one active frontend/data path, consolidate duplicated page logic, and add test/build/release checks.
5. **P2 — Growth:** accessibility, performance, local SEO, and conversion measurement.
6. **Separate scope — Full ecommerce:** server-authoritative orders, payments, inventory transactions, refunds, and fulfillment.

## Phase 0 — Decide the operating model and establish a baseline

**Priority: immediate; before feature work.**

- [x] Confirm call/WhatsApp-assisted sales are the near-term contact path; no website checkout is planned in this pass. Treat full ecommerce as a separately scoped future project.
- [x] Record the operational catalog editor as the admin account holder. This describes operational ownership, not verified database authorization; avoid shared admin credentials and verify the deployed role policy.
- [ ] Reconcile the production Supabase catalogue against a timestamped snapshot and the static fallback. Resolve mismatched names, stale stock, missing prices, and category differences before publishing current data.
- [ ] Capture a baseline: deployed routes, browser console/network errors, broken images, mobile screenshots, current Vercel headers, and a read-only export/snapshot of relevant Supabase schema and policies (using authorized access).
- [ ] Mark production-only facts as **unverified** until checked. In particular, repository policy examples do not prove that the same policies are active in Supabase.

**Done when:** the selected sales model and data owners are written down; known production state is recorded without exposing credentials or customer data.

## Phase 1 — Fix release-blocking behavior and admin correctness

**Priority: P0. Do before visual polish or growth features.**

### Homepage and route integrity

- [x] Fix malformed homepage selectors and add a JavaScript syntax check for inline and external scripts.
- [x] Add the missing HTML doctype and correct broken local brand/arrow asset paths.
- [x] Add a local asset/config checker. Manual desktop/mobile and deployed nested-route smoke tests remain open.
- [ ] Confirm homepage search, hero controls, navigation, category filters, product links, and mobile menu all work on desktop and mobile.
- [ ] Parse and honor supported query parameters consistently (including category, subcategory, search, and brand where shown); provide an empty-results state and pagination or progressive loading for larger catalogues.
- [x] Show a not-found UI for unknown product IDs/slugs rather than falling back to the first product. An HTTP 404 response still needs hosting support/configuration.

### Product page and availability behavior

- [x] Read either `description` or legacy `desc`; use the primary `image` when the image array is missing or empty and reject unsafe image URL schemes.
- [ ] Normalize the product schema at one boundary and verify selected images are real product photos rather than logos/unrelated products.
- [ ] Bound quantity by available stock, handle zero/unknown stock explicitly, and disable or replace purchase/enquiry actions when unavailable. Do not imply that a WhatsApp enquiry reserves stock.
- [ ] Remove fabricated/default review counts and ratings (for example, a fallback rating when no review data exists). Display ratings only when they are real, attributable, and maintained.
- [ ] Reconcile category names and available categories between navigation, filters, static data, and the live catalogue.

### Admin write-path correctness

- [x] Make product saves/deletes, bulk image updates, and CSV writes require loaded live data and an active admin session; verify returned database rows before reporting success.
- [ ] Audit category changes, image upload, and every remaining admin mutation for the same fail-closed/session/response guarantees.
- [ ] Exercise all admin operations against authorized test data with no network, expired session, RLS rejection, duplicates, partial failure, and successful persistence. No production writes were run in this pass.
- [ ] Add an audit trail for meaningful admin changes in the trusted backend/database layer, including actor, operation, record, and timestamp; do not rely on browser-only logs.

**Done when:** no console parse errors or broken primary assets; product routes fail correctly; stock and image states are truthful; every admin mutation either persists or reports failure without a false success.

### Price/stock CSV and reconciliation decision

The checked-in stock-summary CSVs contain item names and quantities only; there is no `Rate`, `Selling Price`, `Price`, or `MRP` column to recover. `js/csv-import.js` accepts common rate/price headers and shows a row-level preview. Stock-only imports do not change price/MRP and require a unique exact existing product name/model. Do not infer database IDs from spreadsheet serial numbers or use fuzzy matching. A rate-bearing CSV is needed to update prices.

Recommended cadence: run an automated snapshot diff weekly, and require admin review before every bulk catalogue import/publication. Put parsing/diff logic in a Node script under `scripts/`, invoked from GitHub Actions alongside the existing weekly snapshot; keep HTML presentation-only. The repository currently has the weekly snapshot workflow but no comparison script/job. Before implementing it, confirm snapshot visibility/retention and the matching key (database ID/model), and avoid exposing private supplier/customer data in a public repository.

## Phase 2 — Secure Supabase authorization and admin access

**Priority: P0 before allowing production writes.**

- [ ] Inspect the actual deployed schema, grants, RLS state, table policies, Storage policies, and Auth settings using authorized Supabase access. Reconcile them with checked-in SQL/docs; do not assume documentation or a local SQL file matches production.
- [ ] Enable and test RLS on every table reachable through the public API. Define least-privilege policies for anonymous reads, authenticated users, and administrators according to the chosen product model.
- [ ] Replace broad `TO authenticated` write access with a real server-controlled admin authorization check. Authenticated is not synonymous with administrator. Use a trusted claim/role or a server-side function; never authorize from user-editable metadata or a client-side flag.
- [ ] Review the current use of `auth.role()` and policy examples; use current supported Supabase/Postgres policy patterns when implementing. Ensure `UPDATE` access has the corresponding read policy and validates both old-row access and new-row values.
- [ ] Apply equivalent least-privilege controls to Storage: approved bucket and path, admin-only writes/deletes, file constraints, and only the reads the storefront needs.
- [ ] Verify signup policy, allowed redirect URLs, password reset, session lifetime, admin recovery, and account offboarding. Remove public admin creation if it is not an intended flow.
- [ ] Check whether the legacy `admin_users` table still exists or contains data. If obsolete, plan a verified backup/migration and removal or lock-down; do not delete it until its use and data are confirmed.
- [ ] Confirm that no service-role/secret key is shipped to browser code, build artifacts, or public repository history. The publishable/anon key can be public only with correct RLS and grants.
- [ ] Test access as anonymous, authenticated non-admin, and admin for every read/write/upload path. Include direct API calls, not only the UI, and prove that unauthorized writes are rejected.

**Done when:** a recorded policy matrix matches deployed policies and automated/manual tests prove non-admin callers cannot mutate catalog or Storage data.

## Phase 3 — Prevent injection and harden file/data handling

**Priority: P1; start after or in parallel with Phase 2.**

- [ ] Inventory all database/import/user-controlled values rendered through `innerHTML`, template strings, or inline event handlers in storefront and admin code. Replace with DOM APIs and `textContent`; where rich text is truly needed, sanitize with a maintained allowlist sanitizer.
- [ ] Validate URL schemes and hosts before using data-driven image/link URLs; reject `javascript:` and other unsafe schemes. Add `rel="noopener noreferrer"` to external links opened in a new tab.
- [ ] Move inline scripts, inline handlers, and styles toward external same-origin assets. The enforced CSP now adds explicit base/object/frame/form policies and pins Supabase connect-src; a source-restricted report-only candidate is present. Remove `unsafe-inline`, pin/self-host the SDK, inventory dynamic image hosts, and verify deployed headers before further enforcement.
- [ ] For image uploads, allowlist formats, verify actual content/MIME (not just extension), cap byte size and dimensions, generate safe storage paths, and handle upload/DB rollback or orphan cleanup.
- [x] Make the import UI truthful: accept CSV only. The quote-aware parser handles quoted delimiters, escaped quotes, multiline values, BOM, CRLF, and comma/semicolon/tab delimiters.
- [x] Validate required fields, numeric ranges, category/brand membership, duplicate targets, row count, and image URL schemes. Show a row preview/error report; never default missing prices or stock.
- [x] Quote CSV export fields and neutralize spreadsheet formula-leading values. Automated tests cover quotes, Indian currency, alternate delimiters, actual stock reports, exact matching, and malformed quotes.
- [ ] Pin third-party runtime versions and add dependency integrity controls where applicable; avoid an unbounded `@2` CDN reference.

**Done when:** adversarial product/import strings render as inert text; upload/import limits and failures are tested; CSP is restrictive without breaking required flows.

## Phase 4 — Make the catalogue a reliable source of truth

**Priority: P1 after immediate safety fixes.**

- [ ] Define and document one product contract: stable ID/slug, title, brand, category, model, description, price/MRP, stock/availability, images, specifications, offer fields, and timestamps. Normalize legacy field names once at the data boundary.
- [ ] Choose a source-of-truth model. Recommended: Supabase for maintained catalogue data; retain the static dataset only as a clearly versioned emergency snapshot, never as an indistinguishable source of current price/stock.
- [x] Suppress fallback prices/stock on category/product pages and remove snapshot prices/stock from homepage product tiles; ask customers to confirm current price and availability.
- [ ] Replace `select('*')` with the explicitly required public columns; add server-side category/brand/search filters, stable ordering, pagination, and an appropriate cache/revalidation strategy.
- [ ] Add request timeouts, retry/backoff where safe, loading/error/empty states, and a visible degraded/offline state. Avoid showing an empty catalogue as if the store has no products when a request failed.
- [ ] Validate prices, MRP, stock, required attributes, category, and image references at the database boundary. Define who reconciles online stock against physical-store inventory and what “in stock” means.
- [ ] Reconcile the static catalogue’s all-positive stock snapshot, placeholder price note, incomplete category set, and inconsistent images against current store records.
- [ ] Replace brand-logo-as-product-photo and category-mismatched image fallbacks with actual, licensed product photography. Add dimensions, responsive sizes, compression, and descriptive alt text.
- [ ] Clean up orphaned/replaced Storage objects through a safe, auditable process after confirming references; do not delete files solely based on a local scan.

**Done when:** each product has one traceable source and schema; stale fallback cannot masquerade as live inventory; filters and large catalogues do not require downloading every record.

## Phase 5 — Simplify the frontend and raise engineering quality

**Priority: P2; avoid a risky rewrite before Phase 1–4 requirements are clear.**

- [ ] Decide which runtime is active. The checked-in site is primarily static HTML with inline/embedded page code; `main.js`, `cart.js`, `i18n.js`, and `css/style.css` are not consistently wired into current pages. Either integrate and test them deliberately or retire dead code and document the chosen path.
- [ ] Break the oversized homepage and admin scripts into testable modules. Extract shared header/footer, catalog access, formatting, validation, and UI primitives instead of copying near-identical implementations across pages.
- [ ] Choose one styling strategy and remove unused/duplicated CSS after verifying visual parity. Avoid a broad framework migration unless there is a clear maintenance or SEO benefit.
- [ ] Add a package manifest and reproducible lockfile/build/test commands if dependencies or compilation are introduced. Pin dependency versions and define supported browser targets.
- [ ] Expand `scripts/validate-architecture.js` and `scripts/validate-assets.js` with route/link, policy/docs drift, and broader schema checks.
- [x] Add initial Node tests for CSV parsing/validation and CI checks for inline/external JS syntax, local assets/Vercel config, architecture, secrets, and CSV tests. Product routing, stock/quantity behavior, and admin mutation failure-mode coverage remain.
- [ ] Add a production build if a build step is introduced, and a preview/staging browser smoke test before deploy. GitHub branch protection must require the CI status before a failed run can block merges.
- [ ] Add runtime error reporting and privacy-conscious monitoring for page errors, failed catalogue loads, broken images, admin failures, and conversion events. Document rollback and incident ownership.
- [ ] Document backup scope, retention, restore procedure, and perform a restore exercise for business-critical catalogue/order data.

**Done when:** a fresh checkout can run the documented checks; CI catches the classes of defects found in this review; a staged release can be verified and rolled back.

## Phase 6 — Customer trust, accessibility, performance, and local SEO

**Priority: P2, after product facts and purchase behavior are reliable.**

### Trust and conversion

- [ ] Publish accurate address, hours, service area, delivery/installation terms, GST/invoice information, and verified contact details.
- [ ] Create real privacy, terms, warranty, returns/replacement, and delivery pages. Replace policy links currently pointing to the contact page.
- [x] Remove unverified live-price/discount/stock, return-window, generic warranty, authenticity, EMI, and delivery promises from the current customer-facing pages; direct customers to confirm product-specific terms with the store. Any affirmative policy claims require business-owner verification before being reintroduced.
- [ ] Replace generic social-platform root links with verified business profiles; use the actual store map/location listing.
- [x] Explain that phone/WhatsApp are enquiry channels, price/availability require confirmation, and a WhatsApp message is not a placed order.
- [ ] Add privacy-aware analytics for product views, calls, WhatsApp clicks, directions, and confirmed sales where measurement is operationally possible. Avoid collecting unnecessary personal data.

### Accessibility and performance

- [ ] Replace placeholder alt text such as `alt="."`; use useful alt for informative images and empty alt for decorative images.
- [ ] Give icon-only controls accessible names; ensure keyboard operation, visible focus, sensible dialog/drawer focus handling, labels/errors for forms, sufficient contrast, and reduced-motion support.
- [ ] Test key journeys with keyboard and screen reader on mobile and desktop. Verify page language and any English/Marathi content switching; `i18n.js` is currently unwired.
- [ ] Set image dimensions/aspect ratios, serve appropriately sized compressed images, lazy-load below-the-fold media, and avoid loading the full catalogue before it is needed.
- [ ] Measure Core Web Vitals and real-device load behavior before selecting further optimization work.

### SEO

- [ ] Provide unique product/category titles and descriptions, canonical URLs, Open Graph metadata, sitemap, robots rules, and a true 404 page.
- [ ] Add accurate Product/LocalBusiness structured data only from verified fields; do not mark up fictional ratings, prices, or availability.
- [ ] Prefer pre-rendered/static product pages or another crawlable server-rendered approach if search visibility is a priority; client-only product rendering may not reliably expose every product to crawlers.
- [ ] Validate Vercel rewrites and product slugs against actual product records; avoid fuzzy matching that routes a wrong URL to an unrelated item.
- [ ] Create local landing pages only for real service locations and unique helpful content.

**Done when:** a shopper can verify the store and terms, complete the intended enquiry flow accessibly, and crawlers receive accurate metadata for valid pages and a not-found response for invalid routes.

## Phase 7 — Full ecommerce (only if explicitly selected)

Treat this as a new backend capability, not a frontend-only extension.

- [ ] Define checkout, customer, address, order, line-item, payment, refund, shipment, tax/invoice, cancellation, return, and installation requirements.
- [ ] Create server-authoritative order and price/stock snapshots. Never trust price, discount, stock, or order totals supplied by browser code.
- [ ] Implement concurrency-safe stock reservation/decrement and idempotent order creation.
- [ ] Integrate a payment provider through server-side APIs and verify signed webhooks; handle retries, duplicate events, failures, refunds, and reconciliation.
- [ ] Implement delivery eligibility and slot/installation operations, order status, customer notifications, invoices, cancellations, replacements, returns, and refunds.
- [ ] Add role-based staff workflows, audit logs, monitoring/alerts, backup/restore, and operational runbooks before launch.
- [ ] Test abuse cases, race conditions, payment webhook replay, abandoned checkout, partial fulfillment, and end-to-end mobile checkout in staging.

## Growth ideas after the fundamentals

- Verified Google reviews and a consent-based review-request workflow.
- Showroom gallery and directions; buying guides for TVs, ACs, refrigerators, and washing machines.
- Product comparison backed by normalized specifications.
- Seasonal landing pages and Marathi content for useful local journeys.
- Finance/EMI calculator backed by current, verified partner terms.
- Wishlist only if it serves a measurable business goal and has a defined privacy/retention model.

## Release gates

Do not consider the next release ready until all applicable items are true:

- [ ] Homepage, search, navigation, catalogue, and product routes pass desktop/mobile smoke checks with no uncaught console errors or broken primary assets.
- [ ] Unknown product URLs return not found; product details, prices, images, and stock do not silently fall back to unrelated or placeholder values.
- [ ] Admin mutations are verified against the database and never report success without persistence.
- [ ] Deployed RLS and Storage policies are verified; anonymous and non-admin direct API writes are denied.
- [ ] Stored/imported content is rendered safely; upload/import/export validation and limits pass security tests.
- [ ] Delivery, stock, price, offers, warranty, and returns claims are accurate and have an accountable owner.
- [ ] The chosen WhatsApp or checkout process has a clear operational owner and customer-facing explanation.
- [ ] Automated checks pass in CI and the staging deployment has a documented rollback path.
- [ ] Relevant documentation is updated in the same change as code/schema/config changes, including limitations and verification performed.
