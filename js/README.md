# js/ — JavaScript Files Reference

This directory contains all client-side JavaScript for the Doordarshan Electronics website. No build step, no bundler — files are loaded directly via `<script>` tags.

---

## Script Load Order

Every page loads scripts in this exact order at the bottom of `<body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>  <!-- 1. Supabase SDK -->
<script src="js/supabase-config.js"></script>   <!-- 2. DB client setup -->
<script src="js/i18n.js"></script>              <!-- 3. Language system -->
<script src="js/products-data.js"></script>     <!-- 4. Static product catalogue -->
<script src="js/cart.js"></script>              <!-- 5. Cart & toast -->
<script src="js/main.js"></script>             <!-- 6. Page rendering & init -->
```

**Order matters**: `supabase-config.js` must load before anything that calls `dbClient`. `products-data.js` must load before `main.js` which references `PRODUCTS`.

---

## File Overview

| File | Lines | Purpose |
|---|---|---|
| `supabase-config.js` | 169 | DB client, all Supabase queries |
| `products-data.js` | 1097 | Static product catalogue + utility functions |
| `cart.js` | 126 | Cart logic (localStorage) + Toast notifications |
| `i18n.js` | 351 | English/Marathi translation system |
| `main.js` | 473 | Homepage rendering, hero, menus, search, countdown |

---

## supabase-config.js

Initialises the Supabase client and exports all database interaction functions.

### Constants
```javascript
const SUPABASE_URL = 'https://lodiiprfdimohskhcpyf.supabase.co';
const SUPABASE_ANON_KEY = '...';  // Public read-only key
```

The anon key is intentionally public. Its write permissions depend on RLS policies in Supabase. See `SECURITY.md`.

### `dbClient`
A global Supabase client instance. `null` if the SDK failed to load. All functions check for `dbClient` before making API calls.

### `DEFAULT_CATEGORIES`
A hardcoded array of 8 category objects used as fallback when the Supabase `categories` table is empty or unreachable:
```javascript
{ key: 'tv', name: 'LED Televisions', description: '...', icon: '📺' }
```

### Functions

#### `verifyAdminLoginFromDB(username, password)`
**Type**: `async`
**Purpose**: Authenticates admin login against the `admin_users` Supabase table.

Flow:
1. If `dbClient` is null → falls back to hardcoded check (⚠️ security issue — see SECURITY.md C3)
2. Queries `admin_users` table matching username + password
3. Returns `true` if a matching row is found
4. On error → falls back to hardcoded check

```javascript
const isValid = await verifyAdminLoginFromDB('admin', 'password');
```

---

#### `updateAdminPasswordInDB(username, newPassword)`
**Type**: `async`
**Purpose**: Updates the password for an admin user in the `admin_users` table.
**Throws** if `dbClient` is null or if the update fails.

---

#### `fetchCategoriesFromDB()`
**Type**: `async`
**Returns**: Array of category objects
**Purpose**: Fetches all rows from the `categories` table ordered by `id`.

Fallback chain:
1. Try Supabase
2. If error or empty → return `DEFAULT_CATEGORIES`
3. If `dbClient` null → return `DEFAULT_CATEGORIES`

---

#### `saveCategoryToDB(categoryObj)`
**Type**: `async`
**Purpose**: Upserts (insert or update) a single category row.
**Throws** on error.

---

#### `fetchProductsFromDB()`
**Type**: `async`
**Returns**: Array of product objects in frontend schema format
**Purpose**: Fetches all rows from the `products` table and maps them to the product schema used by the frontend.

Fallback chain:
1. If `dbClient` null → return static `PRODUCTS` array
2. If Supabase query errors → return static `PRODUCTS` array
3. If result is empty → return static `PRODUCTS` array

Field mapping from Supabase columns → frontend schema:
```javascript
{
  id: item.id,
  name: item.name,
  brand: item.brand,
  category: item.category || 'tv',
  subcategory: item.subcategory,
  type: item.type || [],
  model: item.model,
  mrp: parseFloat(item.mrp || 0),
  price: parseFloat(item.price || 0),
  stock: parseInt(item.stock || 0),
  size: item.size,
  rating: parseFloat(item.rating || 4.0),
  reviews: parseInt(item.reviews || 0),
  isNew: item.is_new,           // Note: DB column is snake_case
  isFeatured: item.is_featured, // Note: DB column is snake_case
  specs: item.specs || {},
  description: item.description,
  image: item.image || '',
  images: item.images || []
}
```

---

#### `uploadProductImageToStorage(file)`
**Type**: `async`
**Returns**: Public URL string of the uploaded image
**Purpose**: Uploads an image file to Supabase Storage bucket `product-images` under `uploads/`.

Generates a unique filename: `{timestamp}_{random5chars}.{ext}`

Throws on:
- `dbClient` null
- Upload error
- Public URL generation failure

---

## products-data.js

The static product catalogue seeded from the 2017-2026 stock CSV. This is the fallback when Supabase is unavailable.

### `PRODUCTS`
A global array of ~50+ product objects. Used by all pages for fallback rendering.

### Product Object Schema

```javascript
{
  id: Number,           // Unique numeric ID (1, 2, 3...)
  name: String,         // Full display name e.g. 'Sony Bravia 43" 4K TV'
  brand: String,        // Brand name e.g. 'Sony', 'Samsung', 'LG'
  category: String,     // Category key: 'tv' | 'refrigerator' | 'ac' | 'washing' | 'kitchen' | 'phones' | 'laptop' | 'small'
  subcategory: String,  // Sub-filter e.g. '43-inch', 'double-door', '1.5-ton'
  type: String[],       // Feature tags e.g. ['4K', 'Google TV', 'OLED', 'QLED', 'Smart TV']
  model: String,        // Model number e.g. 'KD-43X75K'
  mrp: Number,          // Original MRP in ₹ (0 or 1 = "Call for Price")
  price: Number,        // Sale price in ₹
  stock: Number,        // Units in stock (0 = out of stock)
  size: Number,         // Screen size in inches (TVs) or litres (fridges)
  rating: Number,       // 1.0–5.0
  reviews: Number,      // Count of reviews
  isNew: Boolean,       // Shows "New 2026" badge
  isFeatured: Boolean,  // Shows in Featured Products section
  specs: Object,        // Key-value pairs shown in product specs tab
  description: String,  // Short description shown in product page
  image: String,        // Direct image URL (overrides auto-select if set)
  images: String[],     // Multiple images (future use)
}
```

### Utility Functions

#### `getProductById(id)`
Returns a single product by numeric `id` or `null`.

#### `getProductsByCategory(category, filters)`
Returns filtered products by category. Supports filters:
- `filters.brand` — exact brand match
- `filters.subcategory` — exact subcategory match
- `filters.type` — value must exist in product's `type` array
- `filters.maxPrice` / `filters.minPrice` — price range

#### `getFeaturedProducts(limit = 8)`
Returns products where `isFeatured === true`, up to `limit`.

#### `getNewArrivals(limit = 8)`
Returns products where `isNew === true`, up to `limit`.

#### `formatPrice(num)`
Returns `'₹1,23,456'` (Indian locale format) or `'Call for Price'` if `num <= 1`.

#### `getDiscount(mrp, price)`
Returns integer percentage discount or `null` if no valid discount.
```javascript
getDiscount(36990, 29999) // → 19
getDiscount(0, 29999)     // → null (no MRP)
```

#### `getBrandColor(brand)`
Returns `{ bg: '#hex', text: '#hex' }` for the brand's official colour scheme. Used for image placeholder cards when no product photo is available.

### `BRAND_COLORS`
Object mapping brand names to their official colour palette:
```javascript
Sony: { bg: '#0033A0', text: '#ffffff' }
Samsung: { bg: '#1428A0', text: '#ffffff' }
LG: { bg: '#A50034', text: '#ffffff' }
// ...
```

---

## cart.js

Manages the shopping cart stored in `localStorage` and provides Toast notifications.

### Constants
```javascript
const CART_KEY = 'de_cart_v1';      // localStorage key
const WHATSAPP_NUM = '917020209281'; // WhatsApp number with country code
```

### `Cart` Object

#### `Cart.get()`
Reads and parses cart from `localStorage`. Returns `[]` on error.

#### `Cart.save(items)`
Serialises array to `localStorage` and calls `updateBadge()`.

#### `Cart.add(productId, qty = 1)`
Adds product to cart. If already in cart, increments qty (max 10). Shows "Added to cart!" toast.

#### `Cart.remove(productId)`
Removes all qty of a product from cart.

#### `Cart.setQty(productId, qty)`
Sets exact quantity (clamped to 1–10).

#### `Cart.clear()`
Empties the cart.

#### `Cart.count()`
Returns total item count (sum of all qtys).

#### `Cart.total()`
Returns total price in ₹ by looking up each item's price from `PRODUCTS`.

#### `Cart.lineItems()`
Returns enriched array: each cart entry merged with its full product object plus `lineTotal`.

#### `Cart.updateBadge()`
Updates all `.cart-badge` elements with current count. Hides badge if count is 0.

#### `Cart.openWhatsApp(productId = null)`
Opens a pre-filled WhatsApp chat:
- If `productId` provided → single product enquiry message
- If no `productId` → full cart order message listing all items with total

### `Toast` Object

#### `Toast.init()`
Creates the `.toast-container` div and appends to `<body>`.

#### `Toast.show(msg, type = 'success')`
Shows a notification that auto-dismisses after 3 seconds with a fade-out animation. `type = 'error'` adds red styling.

---

## i18n.js

Bilingual (English / Marathi) translation system. No external library — pure vanilla JS.

### `currentYear`
```javascript
const currentYear = new Date().getFullYear(); // → 2026
```
Used in footer copyright and the `rights_reserved` translation key.

### `TRANSLATIONS`
Large dictionary object with keys for both `en` and `mr`:
```javascript
const TRANSLATIONS = {
  en: {
    free_delivery: 'Safe & Fast Doorstep Delivery',
    // ... 100+ keys
  },
  mr: {
    free_delivery: 'सुरक्षित आणि जलद होम डिलिव्हरी',
    // ... same keys in Marathi
  }
};
```

### `LANG_KEY`
```javascript
const LANG_KEY = 'de_website_lang'; // localStorage key storing 'en' or 'mr'
```

### `getCurrentLanguage()`
Returns current language code from `localStorage` or `'en'` as default.

### `t(key, params = {})`
Translation lookup function. Falls back to English if Marathi key missing, then falls back to the key string itself.

Supports parameter interpolation:
```javascript
// Translation: "Only {n} left!"
t('low_stock', { n: 2 }) // → "Only 2 left!"
```

### `setLanguage(lang)`
Switches the entire page to the specified language (`'en'` or `'mr'`).

Steps:
1. Saves choice to `localStorage`
2. Sets `document.documentElement.lang` attribute
3. Updates all `[data-i18n]` elements with translated text via `innerHTML`
4. Updates all `[data-i18n-placeholder]` input placeholders
5. Updates active state on `.lang-btn` elements
6. Updates `.current-year` elements
7. Calls `updateDynamicLanguageText()` if defined (triggers re-render of JS-built UI in `main.js`)

### `initLanguageSwitcher()`
Reads saved language preference and applies it. Called automatically on `DOMContentLoaded`.

---

## main.js

The main application script. Runs on `index.html` only. Handles all homepage rendering, interactive components, and dynamic data loading.

### Image & Display Helpers

#### `TV_IMAGES`
Object mapping brand names to arrays of Unsplash photo URLs. Used when a product has no `image` field set.

#### `getProductImage(product)`
Returns the image URL to display. Priority: `product.image` (DB-stored) → brand pool fallback → default pool.

#### `renderStars(rating)`
Returns a star string e.g. `'★★★★½☆'` from a float rating.

#### `formatPrice(num)` / `getDiscount(mrp, price)`
Re-used here (also defined in `products-data.js`).

#### `getBrandColor(brand)`
Re-used here (also defined in `products-data.js`).

---

### `buildProductCard(product, compact = false)`
**The central UI function**. Returns complete HTML string for a product card.

Assembles:
- Product image with `onerror` fallback to brand-coloured placeholder
- Badge overlay (New, OLED, QLED)
- Discount % badge
- Wishlist button (UI-only, not persisted)
- Product brand, name (links to `product.html?id=X`), model
- Star rating + review count
- Price display (formatted or "Call for Price")
- Stock status (In Stock / Only N left / Out of Stock)
- Add to Cart button (disabled if stock = 0)
- WhatsApp quick-order button

---

### Hero Slider

#### `HERO_SLIDES`
Array of 3 slide configs:
```javascript
{
  bg: 'Unsplash URL',
  kicker: 'Small top label',
  title: 'Main heading HTML',
  subtitle: 'Subheading text',
  btn1: { text: '...', href: '...' },
  btn2: { text: '...', href: '...', onclick: '...' }
}
```

#### `initHeroSlider()`
Renders all slides and navigation dots from `HERO_SLIDES`. Starts auto-advance timer.

#### `goToSlide(index)`
Navigates to specific slide index (wraps around). Updates dot active state. Restarts 5-second auto-advance timer.

#### `startHeroTimer()`
Sets a `setTimeout` for 5 seconds then calls `goToSlide(heroIndex + 1)`. Stored in `heroTimer` so it can be cleared on manual navigation.

---

### `initCountdown()`
Implements the "Deal of the Day" countdown timer.

**Rolling daily target**: calculates `23:59:59` of the current day. If less than 60 seconds remain, rolls over to the next day's midnight. This ensures the timer is always counting down and never shows `00:00:00`.

Updates `#timer-h`, `#timer-m`, `#timer-s` DOM elements every 1 second.

---

### `renderSection(containerId, products)`
Sets `innerHTML` of a container to the result of mapping `buildProductCard()` over an array of products. No-ops if element not found or array empty.

---

### Mega Menu

#### `initMegaMenu()`
Adds `mouseenter`/`mouseleave` event listeners to all `.nav-item` elements. Shows/hides `.mega-menu` with opacity and transform transitions. Handles keyboard accessibility (Enter/Space/Escape).

---

### Floating UI Elements

#### `initStickyHeader()`
Adds scroll listener to increase header `box-shadow` when page is scrolled > 40px.

#### `initSearch()`
Handles the header search form submit — redirects to `category.html?q={query}`.

#### `initWhatsAppFloat()`
Programmatically creates and appends the green floating WhatsApp button (bottom-left). Links to pre-filled WhatsApp message.

#### `initBackToTop()`
Programmatically creates and appends the back-to-top button (bottom-right). Shows when scrolled > 400px.

---

### `renderDynamicCategories()`
**Type**: `async`

Fetches categories from Supabase (or falls back to `DEFAULT_CATEGORIES`) and:
1. Updates the search bar `<select>` options
2. Rebuilds the `.categories-grid` with live category cards and product counts

---

### `initHorizontalDragScroll()`
Enables click-and-drag horizontal scrolling on desktop for:
- `.scroll-strip`
- `.categories-grid`
- `.brands-grid`
- `.subcat-tabs`

Uses `mousedown` / `mousemove` / `mouseup` / `mouseleave` events with a 2.2x scroll multiplier for feel.

---

### Initialisation (DOMContentLoaded)

Runs in this order:
1. `initHeroSlider()`
2. `initCountdown()`
3. `initMegaMenu()`
4. `initStickyHeader()`
5. `initSearch()`
6. `initWhatsAppFloat()`
7. `initBackToTop()`
8. `fetchProductsFromDB()` → if data returned, replaces `PRODUCTS` array in memory
9. `renderDynamicCategories()`
10. `renderAllHomeSections()`
11. `initHorizontalDragScroll()`

### `renderAllHomeSections()`
Populates all product strips on the homepage:
- `#featured-products` → `getFeaturedProducts(8)`
- `#new-arrivals` → `PRODUCTS.filter(p => p.isNew).slice(0, 8)`
- `#deal-products` → Sony products with > 10% discount, up to 4
- `#tv-products-strip` → first 8 TVs
- `#refrigerator-products-strip` → first 8 refrigerators

### `window.updateDynamicLanguageText`
Global hook registered so `i18n.js`'s `setLanguage()` can trigger a re-render of all product cards in the new language (translated labels like "Add to Cart", "In Stock", "Out of Stock").
