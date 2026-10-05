# Architecture — current `main` branch

This describes repository code, not verified production infrastructure.

```text
Vercel/static host → index.html / category.html / product.html
                   → css/style.css
                   → Supabase UMD SDK → js/supabase-config.js
                                       → js/i18n.js, js/products-data.js,
                                         js/cart.js, js/main.js
                   → Supabase products + categories
                   → static PRODUCTS array on error or empty result

admin.html → Supabase Auth session → browser CRUD on products/categories
                                  → product-images Storage
```

The pages have inline scripts as well as shared JavaScript. `js/supabase-config.js` owns the Supabase client and `fetchProductsFromDB()`, but `admin.html` also directly calls `dbClient.from('products')` for mutations. `js/cart.js` persists a cart to local storage and composes WhatsApp messages; there is no online checkout or order backend. The three public pages contain `cart.html` links even though that page does not exist in `main`.

Products are queried from the base `products` table, mapped to the frontend schema, and fall back to the static `PRODUCTS` array when the client is unavailable, the API errors, or the response is empty. This conflates a valid empty catalogue with an outage and can display stale price/stock information. Categories have a similar hardcoded fallback. Images may come from remote hosts or Supabase Storage.

`admin.html` uses Auth email/password and a browser session; it has product/category editing, image upload, CSV import and password change controls. No code-level admin UUID allowlist or approved-only public projection exists on this branch. Server-side authorization depends on remote Supabase grants, RLS and Storage policies, which require independent inspection.

The `main` CI workflow is a baseline syntax/config/file gate. There is no snapshot generator or scheduled database comparison on this branch. The redesign branch adds a distinct public data model and release procedure; its SQL must not be applied blindly to this runtime.
