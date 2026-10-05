# JavaScript — current `main` branch

The public pages load the Supabase UMD SDK, then `supabase-config.js`, `i18n.js`, `products-data.js`, `cart.js` and `main.js` in that order. Their global variables and inline page scripts depend on this load order.

| File | Current role |
|---|---|
| `supabase-config.js` | Creates the publishable-key client; wraps Auth sign-in/session/password update, product/category queries and Storage uploads. The product fallback runs on API errors **or empty results**. |
| `products-data.js` | Large static `PRODUCTS` fallback. Rates, stock and marketing claims are not verified against live data. |
| `cart.js` | Local-storage cart, badge/toasts and prefilled WhatsApp messages. No checkout backend. |
| `i18n.js` | English/Marathi strings and language preference. |
| `main.js` | Product card and homepage rendering and interactions. |

`admin.html`, `category.html` and `product.html` contain substantial inline JavaScript. The main CI workflow checks external `.js` file syntax; it does **not** parse those inline scripts or test their behavior. The redesigned branch has a stronger inline-script and public-boundary test suite.
