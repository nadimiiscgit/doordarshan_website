# 🔐 SECURITY.md — Doordarshan Electronics Website

> **Status**: Core critical & high vulnerabilities RESOLVED.
> **Last audited & hardened**: September 2026

---

## Current Vulnerability Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical | 4 | ✅ Resolved (RLS active, Supabase Auth integrated, fallback removed, keys rotated) |
| 🟠 High | 4 | ✅ 3 Resolved (Brute-force lockout added, Real JWT session auth, HTTP headers in vercel.json) |
| 🟡 Medium | 4 | 🟡 In progress (Admin form validation implemented) |

---

## 🔴 Critical Vulnerabilities

### C1 — No Row Level Security (RLS) on Supabase Tables
**Where**: Supabase dashboard — `products`, `categories`, `admin_users` tables
**Risk**: Anyone who inspects the page source, copies the public anon key, and calls the Supabase REST API directly can **read, write, update, and delete all data** without logging in.

```bash
# Example: Anyone can do this right now without a login
curl -X DELETE \
  'https://lodiiprfdimohskhcpyf.supabase.co/rest/v1/products?id=gt.0' \
  -H 'apikey: <anon_key_from_source>' \
  -H 'Authorization: Bearer <anon_key_from_source>'
# Result: ALL products deleted
```

**Fix**: Enable RLS on all tables (see Layer 1 below).

---

### C2 — Plaintext Passwords Stored in Database
**Where**: `admin_users` table in Supabase
**Risk**: Passwords are visible as plain text strings in the database.

**Fix**: Use Supabase Auth (built-in bcrypt hashing).

---

### C3 — Hardcoded Fallback Credentials in Client-Side JavaScript
**Where**: `js/supabase-config.js` lines 32, 43, 48

```javascript
// Currently in supabase-config.js — visible to all:
return username === 'admin' && password === 'admin123';
```

**Fix**: Remove these fallback lines entirely. Fail closed.

---

### C4 — Anon Key Allows Unauthenticated Writes (No RLS)
**Where**: `js/supabase-config.js` line 6
**Risk**: The anon key is public by design — but **only safe when RLS is active**. Without RLS, the anon key grants full database access to anyone.

---

## 🟠 High Vulnerabilities

### H1 — No Brute-Force Protection on Admin Login
**Where**: `admin.html` — `doLogin()` function
**Risk**: Unlimited login attempts with no lockout.

---

### H2 — Login Session via `sessionStorage` Flag (Bypassable)
**Where**: `admin.html` line 741

```javascript
// Anyone can type in the browser console to bypass login:
sessionStorage.setItem('de_logged_in', 'true');
location.reload();
```

**Fix**: Replace with Supabase Auth session check.

---

### H3 — XSS Risk via `innerHTML` with Database-Supplied Data
**Where**: `category.html:399`, `product.html:337`, `admin.html:869`
**Risk**: DB-fetched product names/descriptions rendered via `innerHTML` — a compromised DB entry could inject scripts.

**Fix**: Use `textContent` for DB-supplied strings.

---

### H4 — No HTTP Security Headers
**Where**: No `vercel.json` exists
**Risk**: No clickjacking protection, no HTTPS enforcement, no CSP.

---

## 🟡 Medium Vulnerabilities

### M1 — No Input Validation on Admin Product Form
**Risk**: Negative stock, ₹0 price, MRP < sale price can be saved with no error.

### M2 — No File Type Validation on CSV Upload
**Risk**: Any file can be submitted as a CSV.

### M3 — No CORS Restriction on Supabase Project
**Risk**: Any website can call your Supabase API using your anon key.

### M4 — Supabase Free Tier 7-Day Inactivity Pause
**Risk**: DB pauses after 7 days of inactivity. Admin panel stops working.
**Fix**: Supabase dashboard → Settings → General → Disable pausing.

---

## Why SQL Injection Is NOT the Main Risk

The Supabase JS SDK generates **parameterized queries** internally:

```javascript
dbClient.from('products').select('*').eq('brand', userInput)
// Internally: SELECT * FROM products WHERE brand = $1
```

Classic SQL injection is not possible through the SDK. Real risks are unauthenticated API access, weak sessions, and XSS.

---

## Fix Plan — 4 Layers of Defense

```
┌─────────────────────────────────────────┐
│  Layer 4: HTTP Headers (Vercel)         │
├─────────────────────────────────────────┤
│  Layer 3: Input Validation (Frontend)   │
├─────────────────────────────────────────┤
│  Layer 2: Auth & Session (Admin)        │
├─────────────────────────────────────────┤
│  Layer 1: Supabase RLS + DB (Backend)   │  ← Start here
└─────────────────────────────────────────┘
```

---

## Layer 1: Supabase RLS Policies

> Run in Supabase Dashboard → SQL Editor

```sql
-- Products: public read, admin-only write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin write products" ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Categories: same pattern
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin users: no public access at all
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON admin_users FOR ALL USING (false);
```

---

## Layer 2: Admin Auth Fixes

### Remove hardcoded fallback (js/supabase-config.js)
```javascript
// DELETE these lines:
return username === 'admin' && password === 'admin123';
// REPLACE with:
return false;
```

### Migrate to Supabase Auth
```javascript
// New login
const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
if (error) { showLoginError(); return; }
showApp();

// Check session on load
const { data: { session } } = await dbClient.auth.getSession();
if (session) showApp(); else showLoginScreen();
```

### Add login rate limiting
```javascript
const attempts = { count: 0, lockedUntil: null };

function checkLock() {
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const s = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    showError(`Locked. Try again in ${s}s`);
    return false;
  }
  return true;
}

function recordFail() {
  if (++attempts.count >= 5) {
    attempts.lockedUntil = Date.now() + 15 * 60 * 1000;
    attempts.count = 0;
  }
}
```

### Add session timeout (30 minutes)
```javascript
let timer;
const reset = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await dbClient.auth.signOut();
    showLoginScreen();
  }, 30 * 60 * 1000);
};
['click','keypress','mousemove','touchstart'].forEach(e => document.addEventListener(e, reset));
reset();
```

---

## Layer 3: Input Validation

```javascript
// Sanitize text before DB writes
function sanitizeText(str) {
  return String(str || '')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();
}

// Validate product form
function validateProductForm(data) {
  const errors = [];
  if (!data.name || data.name.length < 2) errors.push('Name too short');
  if (!data.brand) errors.push('Brand required');
  if (data.price <= 0) errors.push('Price must be > 0');
  if (data.mrp > 0 && data.mrp < data.price) errors.push('MRP < sale price');
  if (data.stock < 0) errors.push('Stock cannot be negative');
  if (errors.length) throw new Error(errors.join('; '));
}

// Validate CSV file
function validateCSV(file) {
  if (!file.name.endsWith('.csv')) throw new Error('Only .csv files allowed');
  if (file.size > 2 * 1024 * 1024) throw new Error('Max 2MB');
}

// Use textContent for DB data (not innerHTML)
const el = document.createElement('span');
el.textContent = product.name; // safe
```

---

## Layer 4: HTTP Headers (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://*.supabase.co; connect-src 'self' https://*.supabase.co; font-src 'self' https://fonts.gstatic.com" }
      ]
    }
  ]
}
```

---

## Implementation Priority Table

| Priority | Fix | Effort |
|---|---|---|
| 🔴 **Do now** | Enable Supabase RLS on all tables | 30 min |
| 🔴 **Do now** | Remove hardcoded `admin123` fallback | 5 min |
| 🟠 **This week** | Migrate to Supabase Auth | 2 hrs |
| 🟠 **This week** | Add `vercel.json` HTTP headers | 15 min |
| 🟠 **This week** | Login rate limiting + session timeout | 30 min |
| 🟡 **Later** | Input validation on admin forms | 2 hrs |
| 🟡 **Later** | Replace `innerHTML` with `textContent` for DB data | 1–2 hrs |
| 🟡 **Later** | Restrict Supabase CORS to your domain | 10 min |
| 🟡 **Later** | Disable Supabase project auto-pause | 10 min |
