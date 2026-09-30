# Rule 02: Security & Resource Optimization

> **Scope**: Storage pipelines, API key boundaries, authentication, RLS, and attack surface defense.  
> **Hard Ceiling**: < 500 lines. Refactor existing lines on updates; never blindly append.

---

## 1. Image Upload & Storage Optimization Pipeline

To prevent exceeding Supabase Storage's 1 GB free-tier limit while maintaining instant page loads:

### Client-Side Canvas Compression
- **Mandatory WebP Conversion**: Before uploading via `admin.html`, all image files must be compressed in the browser using an HTML5 `<canvas>` element to `image/webp`.
- **Target Size**: 50 KB – 100 KB per product image (Banners: max 100 KB).
- **Dimension Clamping**: Product photos must be constrained to a maximum bounding box of `1200 × 1200 px` maintaining aspect ratio.
- **Filename Convention**: Sanitized unique filenames formatted as:
  ```
  uploads/{timestamp}_{random5chars}.webp
  ```

### Storage Buckets & Policies
- **`product-images`**: Public read access (`SELECT` allowed for `public`). Insert/Update/Delete restricted to authenticated users.
- **`banners`**: Public read access. Optimized WebP banners (`1920×562` desktop, `750×550` mobile).

---

## 2. Token Safety & Key Boundary Rules

### Public vs. Secret Key Strict Separation
- **Permitted in Client (`js/supabase-config.js`)**:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (Publishable anon key only: `sb_publishable_...` or public JWT anon).
- **Strictly Banned in Client**:
  - `service_role` keys must NEVER exist in client-side code, git history, or comments.
  - No database master passwords, SMTP credentials, or administrative tokens in frontend files.

---

## 3. Database Row Level Security (RLS) Laws

All tables in Supabase must have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

### Policy Structure
- **`products`**:
  - `SELECT`: `true` (Public catalog browsing).
  - `INSERT` / `UPDATE` / `DELETE`: `auth.role() = 'authenticated'`.
- **`categories`**:
  - `SELECT`: `true` (Public categories).
  - `INSERT` / `UPDATE` / `DELETE`: `auth.role() = 'authenticated'`.
- **`storage.objects`**:
  - `SELECT`: Public read for `bucket_id IN ('product-images', 'banners')`.
  - Mutations restricted to authenticated roles.

---

## 4. Admin Authentication & Session Hardening

### Supabase Auth Integration
- The admin panel (`admin.html`) authenticates exclusively through Supabase Auth (`dbClient.auth.signInWithPassword({ email, password })`).
- Legacy plaintext storage in custom tables (e.g. `admin_users`) is deprecated and disabled.
- Passwords must be hashed with bcrypt via Supabase Auth.

### Brute-Force Rate Limiting
- Track consecutive failed authentication attempts in memory.
- If failed attempts reach **5**, lock the sign-in form for **15 minutes** (`Date.now() + 15 * 60 * 1000`).

### Session Inactivity Timeout
- 30-minute idle timer (`inactivityTimer = setTimeout(...)`).
- User activity (`click`, `keydown`, `scroll`, `touchstart`) resets the timer.
- On expiry, invoke `dbClient.auth.signOut()` and redirect to login overlay.

---

## 5. Input Validation & XSS Prevention

### Input Clamping (Admin Forms)
- Product names must be minimum 2 characters.
- Prices must be positive numeric values (`price > 0`).
- MRP cannot be lower than sale price (`mrp >= price`).
- Stock values cannot be negative (`stock >= 0`).
- CSV imports must validate file extensions (`.csv` only) and enforce a 2 MB size ceiling.

### Output Sanitization
- Avoid unescaped `innerHTML` when displaying user-generated or database-supplied strings.
- Prefer `element.textContent` or pre-sanitized attributes to neutralize script injection vectors.

---

## 6. HTTP Security Headers (`vercel.json`)

All responses served via Vercel must enforce defense-in-depth headers:

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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' https://fonts.gstatic.com" }
      ]
    }
  ]
}
```

---

## 7. Supabase Free Tier Inactivity Keep-Alive

To prevent database pausing after 7 days of retail downtime:
- Run a lightweight scheduled heartbeat (via GitHub Action or Vercel Cron) every 3 days.
- Send a simple PostgREST query: `GET /rest/v1/categories?select=id&limit=1`.
- The request registers as active traffic, keeping the project awake indefinitely.
