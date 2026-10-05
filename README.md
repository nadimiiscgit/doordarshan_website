# Doordarshan Electronics — `main`

This branch contains the older static storefront, not the minimal redesign on `vijay-sales-theme`. Do not combine both visual formats during the one-site switchover. The repository alone does not establish which Vercel project or domain is currently serving this branch.

## What is implemented

- `index.html`, `category.html` and `product.html` load `css/style.css` and the global scripts in `js/`. `admin.html` is a separate inline-script admin panel.
- Public pages query Supabase `products` and `categories`. On a failed **or empty** product query they use `js/products-data.js`, including its old prices, stock and claims. This is not an approved or sanitized catalogue fallback.
- Product enquiry opens WhatsApp. `js/cart.js` also stores a local cart and creates a WhatsApp message; there is no payment gateway, server-side checkout or order record. Public pages link to `cart.html`, but that file is absent in this branch.
- Admin sign-in uses Supabase Auth (`signInWithPassword`) and writes products/categories and image uploads through the browser client. The old `admin_users` login described by previous docs is not the active sign-in path. `admin.html` still contains a misleading default-password hint and an older inline CSV parser.
- The browser contains a Supabase **publishable** key. This is expected; database grants, RLS and Storage policies must protect writes. Their live state has not been verified here.

## Local run and checks

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. No build or npm install is required for the site. The Node 20 GitHub Action checks JavaScript file syntax, `vercel.json` JSON and required core files on pushes and pull requests to `main`. Run the same checks locally:

```bash
find js -type f -name '*.js' -print0 | xargs -0 -n1 node --check
node -e "JSON.parse(require('node:fs').readFileSync('vercel.json', 'utf8'))"
```

GitHub branch protection is active on `main`: it requires pull requests and the `Security, Linting & Architecture Guardrails` check, with bypass disabled (including administrators). Review approvals are not required. The rule has not yet been exercised by an intentionally failing PR. The current CI is a baseline, not a browser, image, accessibility or Supabase policy test.

## Known release risks

- The old main UI still has cart/checkout-like cues, unverified rate/stock/review claims, and a broken `cart.html` link. It does not match the agreed WhatsApp/call-only minimal site.
- The public client reads the base `products` table. Do not apply the redesigned branch's base-table lockdown before this site has been replaced and checked.
- The main branch has no scheduled catalogue drift check or sanitized snapshot. The read-only scheduled workflow on `vijay-sales-theme` becomes eligible to run only after it reaches the default branch and its required GitHub variable/secret are configured.
- `vercel.json` defines security headers, but live deployment and console behavior have not been verified. Its CSP allows inline scripts and broad HTTPS image sources.

See [architecture](ARCHITECTURE.md), [security](SECURITY.md), [JavaScript](js/README.md) and [styles](css/README.md). The redesigned branch has its own release checklist and SQL blueprints; they are not active on `main`.
