# SECURITY.md — Current Security Posture

> Updated 30 September 2026. This is a repository-level review of the browser code and policy blueprint. It cannot prove the current remote Supabase dashboard state; verify deployed RLS, Auth settings, Storage policies, and exposed data before treating the site as production-safe.

## Executive summary

Some important improvements are present:

- Admin login now uses Supabase Auth rather than the old plaintext-table login flow.
- Admin session restoration uses `getAdminSession()`.
- The admin UI includes a per-tab failed-login lockout and inactivity timeout.
- Vercel security headers are present in `vercel.json`.
- The browser uses a Supabase publishable key, not a service-role key.

Important gaps remain:

- The checked-in policy guidance includes broad `authenticated` access patterns, and deployed RLS has not been verified to restrict writes to administrators.
- Active catalogue cards and CSV preview use escaping/text-only DOM insertion, but admin and legacy renderers still need a complete XSS audit.
- File/image uploads have weak validation.
- CSP still permits `unsafe-inline`, because the pages use inline scripts and handlers.
- The public catalogue queries `select('*')`, exposing every product column that exists.
- There is no server-side order, payment, or stock-reservation boundary.

## Severity summary

| Area | Current status | Priority |
|---|---|---|
| Supabase write authorization | Auth exists, but the policy blueprint is broad | Critical |
| XSS/data rendering | Active catalogue/CSV preview hardened; admin and legacy sinks remain to audit | High |
| Upload validation | Extension/URL trust is weak | High |
| Session controls | Supabase Auth plus browser-only lockout/timeout | Medium |
| HTTP headers | Present, but CSP is weakened by inline allowances | Medium |
| Data exposure | Public `select('*')` and public image URLs | Medium |
| Ecommerce integrity | No server-side order or inventory transaction | Business-critical |

## Authentication and authorization

### Current login implementation

`admin.html` calls `signInAdminWithAuth(email, password)` from `js/supabase-config.js`, restores an Auth session on page load, and signs out through Supabase Auth.

The client-side login lockout and inactivity timer are useful UX controls but are not security boundaries:

- The lockout exists only in the current browser tab and can be reset by refreshing.
- The inactivity timer can be bypassed by a user who controls the browser.
- The actual protection must come from Supabase Auth rate limits, short-lived/rotated sessions where appropriate, RLS, and Storage policies.

### Admin role problem

The policy blueprint currently uses:

```sql
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated')
```

That means any authenticated Supabase user can potentially write products, categories, and Storage objects. It is not an admin-only policy.

Use a server-controlled claim such as `app_metadata.role = 'admin'`, or move mutations behind a protected Edge Function. A browser-provided user field must not be trusted for authorization.

Example policy shape:

```sql
CREATE POLICY "admin can manage products"
ON public.products
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

Apply the same principle to `categories` and `storage.objects`, and test anonymous, ordinary-authenticated, and admin users separately.

### Legacy `admin_users` table

The current browser login code does not query `admin_users`; it uses Supabase Auth. Older documentation still describes plaintext credentials in that table. Verify whether the table exists and contains credentials. If it is no longer required, migrate any needed data and remove or lock it down.

## XSS and unsafe HTML construction

Data-to-HTML handling is improved in active catalogue cards/product details and the CSV preview, but is not consistently safe across the repository. Review every remaining dynamic `innerHTML` assignment before considering stored XSS addressed.

Paths to continue reviewing include:

- `admin.html` product/category tables and other inline renderers (the active CSV preview now uses DOM nodes and `textContent`).
- `js/main.js`, `js/cart.js`, and `js/i18n.js` legacy renderers.
- `js/cart.js` toast messages.

This risk is reduced only if write access is genuinely restricted and all stored content is trusted. It should still be fixed:

1. Prefer `textContent`, `setAttribute`, and DOM node creation for user/data strings.
2. Use a single HTML escaping helper for unavoidable templates.
3. Validate image URLs against an allowlist of `https:` origins or trusted Storage paths.
4. Remove inline event handlers and use delegated event listeners.
5. Move toward a strict CSP without `unsafe-inline`.

Do not “sanitize” stored text into HTML entities before saving it. Store canonical text and escape at render time.

## Supabase key and database exposure

The publishable/anon key is visible in browser code by design. It is not a secret. Safety depends on:

- RLS enabled on every exposed table.
- Explicit public `SELECT` policies only for fields intended for public display.
- Admin-only mutation policies.
- No service-role key in the browser.
- No sensitive supplier, margin, credential, or customer data in public tables/views.

The current client uses `select('*')`. Prefer a public catalogue view or explicit column list so future internal columns are not automatically exposed.

## Upload and import risks

`uploadProductImageToStorage(file)` currently derives a path from the filename extension and uploads directly. Add:

- MIME and magic-byte validation.
- Maximum file size and pixel dimensions.
- Allowed image formats only.
- Server-side Storage policy checks.
- Safe generated filenames that do not depend on user input.
- Cleanup of replaced/orphaned images.

The admin accepts `.csv` only (not Excel workbooks), caps input at 5 MB and 1,000 data rows, shows a text-only preview, and blocks imports with row errors or ambiguous matches. It distinguishes catalog/rate imports from stock-only reports, does not turn row serials into product IDs, and does not fabricate default prices or quantities. Current stock-summary files do not include MRP/rates, so they cannot update prices. Stock-only imports are applied row-by-row and may partially complete; the UI reports the completed count and asks the admin to review before retrying. A server-side atomic import remains future work.

## HTTP headers and third-party scripts

`vercel.json` supplies `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, and an enforced CSP. It pins `connect-src` to the configured Supabase project and adds `base-uri`, `object-src`, `frame-ancestors`, and `form-action`. A candidate source-restricted policy is also sent as `Content-Security-Policy-Report-Only` for browser-console observation before tightening the enforced image list.

The CSP is weakened by:

- `script-src 'unsafe-inline'`.
- `style-src 'unsafe-inline'`.
- The Supabase CDN dependency is still floating at `@supabase/supabase-js@2`.
- The enforced `img-src https:` remains broad until dynamic database image hosts have been inventoried; the report-only candidate uses observed repository hosts and may flag legitimate remote catalogue images.

Recommended improvements:

- Self-host or pin the Supabase client version and use integrity protection where feasible.
- Move inline scripts/styles into versioned files.
- Remove `unsafe-inline` after the migration.
- Remove `unsafe-inline` after inline code migration and restrict image sources after all live catalogue image hosts are inventoried.
- Verify both policies in deployed response headers and inspect browser console reports; report-only violations are not centrally collected.

## Link and window safety

Static external links generally use `rel="noopener noreferrer"`, but JavaScript `window.open(..., '_blank')` calls do not consistently provide an equivalent opener restriction. Use a safe feature string such as `noopener,noreferrer` or navigate through an explicit anchor.

## Ecommerce integrity risks

WhatsApp messages contain client-generated product details. The product page now omits fallback prices and asks the store to confirm current price/availability. A customer can still modify local state or page JavaScript; therefore:

- Treat WhatsApp details as an enquiry, not an authoritative order.
- Reconfirm price and stock at the store.
- If real checkout is introduced, create the order and price snapshot server-side.
- Reserve/decrement stock transactionally.
- Validate payment webhooks server-side.
- Generate invoices and audit events from trusted backend data.

## Verification checklist

Before production use, verify:

- [ ] Anonymous users can read only intended catalogue fields.
- [ ] Authenticated non-admin users cannot write products/categories/storage.
- [ ] Admin writes are allowed and auditable.
- [ ] Storage uploads are limited by bucket, path, size, and content type.
- [ ] Supabase Auth public sign-up is disabled unless intentionally required.
- [ ] Password reset and recovery settings use the real production domain.
- [ ] No service-role key or private credential appears in repository files.
- [ ] Product/import text cannot execute as HTML or script.
- [ ] Header/CSP checks pass on the deployed domain.
- [ ] The live database and static fallback are reconciled before publishing prices.

## Remediation order

1. Verify and correct RLS/Storage authorization with a real admin role.
2. Fix the homepage/runtime split and broken JavaScript/assets.
3. Remove unsafe HTML interpolation and inline handlers.
4. Add strict upload/import validation.
5. Restrict public database columns and add monitoring.
6. Retain the agreed call/WhatsApp enquiry model; any future online checkout is a separate project and needs server-authoritative order/payment/inventory controls.
