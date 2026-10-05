# Security — current `main` branch

This is a code-level assessment, **not proof of live Supabase or Vercel configuration**. Previous versions of this document mixed old vulnerabilities, proposed fixes and unverified claims of resolution.

## Implemented in code

- Admin login uses Supabase Auth email/password and session checks. The former plaintext `admin_users` login and hardcoded fallback credential are not in the current `js/supabase-config.js` flow.
- `vercel.json` defines frame, MIME, referrer, permissions, HSTS and CSP headers. Whether the production deployment serves these headers has not been checked.
- The browser ships a publishable key, which is normal. It is **not** a private admin credential. Never place a service-role/secret key in client code or GitHub logs.

## Open risks and checks

1. Inspect actual table grants, RLS policies, Auth users and `product-images` Storage policies in Supabase. A valid Auth session is not proof that the user is an authorized store admin; if policies grant writes to every `authenticated` user, sign-up access could become edit access. Test anonymous, ordinary signed-in and intended-admin roles. Do not assume the old SQL snippets in history were safely applied.
2. Public pages query the full base `products` table and use unreviewed static fallback data on errors **and valid empty responses**. Review exposed columns, prices, stock and claims. Never treat the static copy as a backup of current rates.
3. Audit database strings inserted through `innerHTML` and inline handlers, plus the admin CSV parser and uploads, for XSS and malformed input. Admin password hint text still mentions a default password although Auth is active; remove it in the site redesign.
4. The CSP still permits `unsafe-inline` and all HTTPS image hosts. Test actual response headers, image loads and console before narrowing policy. Avoid claiming a strict CSP.
5. `cart.html` is linked but missing. No checkout/payment/order-record system exists despite cart wording on the site. Do not imply online ordering is complete.
6. GitHub branch protection now requires a pull request and the `Security, Linting & Architecture Guardrails` check on `main`; bypass is disabled for administrators too. It does not require a separate reviewer, and its blocking behavior has not yet been tested with an intentionally failing PR. The Action does not test live RLS, browser behavior or Vercel deployment.

The redesigned branch contains staged SQL and a separate approved-only public projection. Its database preparation and lockdown must be reviewed and tested before a site switch; applying lockdown while old `main` remains live would break its base-table product reads. [Supabase's Data API guidance](https://supabase.com/docs/guides/api/securing-your-api) distinguishes grants from row-level policies; check both.
