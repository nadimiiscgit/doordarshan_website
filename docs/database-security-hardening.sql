-- =====================================================================
-- Database Security Hardening Blueprint & RLS Access Control
-- Target: Doordarshan Electronics Production Database (Supabase PostgreSQL)
-- =====================================================================

-- 1. Enable Row Level Security (RLS) on Core Tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Drop Any Conflicting Pre-Existing Policies on Tables
DROP POLICY IF EXISTS "Allow public read-only access" ON products;
DROP POLICY IF EXISTS "Allow admin write access" ON products;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admin write products" ON products;

DROP POLICY IF EXISTS "Allow public read-only access" ON categories;
DROP POLICY IF EXISTS "Allow admin write access" ON categories;
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Admin write categories" ON categories;

-- 3. Create Bulletproof Explicit Public Read Policies
CREATE POLICY "Allow public read-only access" ON products 
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read-only access" ON categories 
    FOR SELECT TO anon, authenticated USING (true);

-- 4. Create Strict Admin Write Policies Tied to Authenticated Role
CREATE POLICY "Allow admin write access" ON products 
    FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin write access" ON categories 
    FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =====================================================================
-- 5. Storage Buckets Hardening ('product-images', 'banners')
-- =====================================================================

-- Drop Insecure Anonymous Upload / Update / Delete Policies
DROP POLICY IF EXISTS "Allow anon upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete from product-images" ON storage.objects;

DROP POLICY IF EXISTS "Allow anon insert on banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update on banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete on banners" ON storage.objects;

-- Ensure Public Read-Only Access on Storage Buckets
DROP POLICY IF EXISTS "Public read storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read banners" ON storage.objects;

CREATE POLICY "Allow public read product-images" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'product-images');

CREATE POLICY "Allow public read banners" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'banners');

-- Enforce Authenticated Admin Only for Storage Mutations
DROP POLICY IF EXISTS "Admin upload storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin update storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin write product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin write banners" ON storage.objects;

CREATE POLICY "Allow admin write product-images" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow admin write banners" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'banners' AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
