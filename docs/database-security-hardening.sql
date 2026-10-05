-- FINAL LOCKDOWN: run only after database-preparation.sql, owner/product review,
-- new-site deployment, and production smoke tests. It is also independently
-- bootstrapping for staging tests, but the two-step rollout avoids old-site downtime.
-- REVIEW AND TEST IN A STAGING SUPABASE PROJECT BEFORE PRODUCTION.
-- This script is not auto-applied. See docs/SECURITY.md for the preflight and owner bootstrap.
-- It intentionally makes every existing product unapproved until manually audited.
begin;

alter table public.products add column if not exists is_approved boolean not null default false;
alter table public.categories add column if not exists image text;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.site_content (
  id text primary key check (id = 'main'),
  published jsonb not null default '{}'::jsonb,
  draft jsonb not null default '{}'::jsonb,
  previous jsonb,
  published_at timestamptz,
  version bigint not null default 0
);
-- A separate public projection prevents visitors and ordinary Auth users from
-- querying stock, ratings, supplier data or future internal products columns.
create table if not exists public.catalogue_products (
  id bigint primary key,
  name text not null,
  brand text,
  category text,
  subcategory text,
  type jsonb not null default '[]'::jsonb,
  model text,
  price numeric(12,2),
  size text,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  specs jsonb not null default '{}'::jsonb,
  description text,
  image text,
  images jsonb not null default '[]'::jsonb
);
insert into public.site_content (id, published, draft) values
  ('main', '{"phone":"917020209281","whatsapp":"917020209281","address":"Samta Colony, Dharashiv, Maharashtra","featured_ids":[],"new_ids":[]}'::jsonb,
   '{"phone":"917020209281","whatsapp":"917020209281","address":"Samta Colony, Dharashiv, Maharashtra","featured_ids":[],"new_ids":[]}'::jsonb)
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.site_admins enable row level security;
alter table public.site_content enable row level security;
alter table public.catalogue_products enable row level security;

revoke all on public.products, public.categories, public.site_admins, public.site_content, public.catalogue_products from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.catalogue_products to anon, authenticated;
grant select (id,key,name,description,icon,image) on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select on public.site_admins to authenticated;
grant select (id,published,published_at) on public.site_content to anon;
grant select, update on public.site_content to authenticated;

-- The site_admins allowlist is managed only in the SQL Editor by the project owner.
drop policy if exists site_admin_self_read on public.site_admins;
create policy site_admin_self_read on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()));

-- Remove prior permissive table policies. Review any custom policies before applying.
do $$ declare pol record; begin
  for pol in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('products','categories','site_content','catalogue_products')
  loop execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename); end loop;
end $$;

create policy products_admin_read on public.products for select to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy products_admin_insert on public.products for insert to authenticated
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy products_admin_update on public.products for update to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy products_admin_delete on public.products for delete to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy catalogue_public_read on public.catalogue_products for select to anon, authenticated using (true);

-- Trigger-only projection maintainer. Kept in an unexposed schema and not callable
-- by API clients. The explicit allowlist check is defense in depth for the definer.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.sync_catalogue_product() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists
    (select 1 from public.site_admins where user_id = (select auth.uid())) then
    raise exception 'An allowlisted store admin is required to change products';
  end if;
  if tg_op = 'DELETE' then
    delete from public.catalogue_products where id = old.id;
    return old;
  end if;
  if new.is_approved is not true then
    delete from public.catalogue_products where id = new.id;
  else
    insert into public.catalogue_products
      (id,name,brand,category,subcategory,type,model,price,size,is_new,is_featured,specs,description,image,images)
    values
      (new.id,new.name,new.brand,new.category,new.subcategory,
       coalesce(to_jsonb(new.type),'[]'::jsonb),new.model,new.price,new.size::text,
       coalesce(new.is_new,false),coalesce(new.is_featured,false),
       coalesce(to_jsonb(new.specs),'{}'::jsonb),new.description,new.image,
       coalesce(to_jsonb(new.images),'[]'::jsonb))
    on conflict (id) do update set
      name=excluded.name,brand=excluded.brand,category=excluded.category,
      subcategory=excluded.subcategory,type=excluded.type,model=excluded.model,
      price=excluded.price,size=excluded.size,is_new=excluded.is_new,
      is_featured=excluded.is_featured,specs=excluded.specs,
      description=excluded.description,image=excluded.image,images=excluded.images;
  end if;
  return new;
end $$;
revoke all on function private.sync_catalogue_product() from public, anon, authenticated;
drop trigger if exists sync_catalogue_product on public.products;
create trigger sync_catalogue_product after insert or update or delete on public.products
  for each row execute function private.sync_catalogue_product();

create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin_insert on public.categories for insert to authenticated
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy categories_admin_update on public.categories for update to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy categories_admin_delete on public.categories for delete to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

create policy site_content_public_read on public.site_content for select to anon using (id = 'main');
create policy site_content_admin_read on public.site_content for select to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy site_content_admin_update on public.site_content for update to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));

create or replace function public.publish_site_content() returns void
language sql security invoker set search_path = '' as $$
  update public.site_content set previous = published, published = draft,
    published_at = now(), version = version + 1 where id = 'main';
$$;
create or replace function public.restore_site_content() returns void
language sql security invoker set search_path = '' as $$
  update public.site_content set draft = published, published = previous,
    previous = published, published_at = now(), version = version + 1
  where id = 'main' and previous is not null;
$$;
revoke all on function public.publish_site_content() from public, anon;
revoke all on function public.restore_site_content() from public, anon;
grant execute on function public.publish_site_content() to authenticated;
grant execute on function public.restore_site_content() to authenticated;

create index if not exists products_approved_category_id_idx on public.products(category,id)
  where is_approved = true;
create index if not exists products_approved_brand_idx on public.products(brand)
  where is_approved = true;
create index if not exists catalogue_category_id_idx on public.catalogue_products(category,id);
create index if not exists catalogue_brand_idx on public.catalogue_products(brand);

-- Existing Storage policies must be audited for additional broad grants.
drop policy if exists "Allow anon upload to product-images" on storage.objects;
drop policy if exists "Allow anon update to product-images" on storage.objects;
drop policy if exists "Allow anon delete from product-images" on storage.objects;
drop policy if exists "Allow public read product-images" on storage.objects;
drop policy if exists "Public read storage" on storage.objects;
drop policy if exists "Allow public select on banners" on storage.objects;
drop policy if exists "Allow admin write product-images" on storage.objects;
drop policy if exists "Admin upload storage" on storage.objects;
drop policy if exists "Admin update storage" on storage.objects;
drop policy if exists "Admin delete storage" on storage.objects;
drop policy if exists "Allow anon insert on banners" on storage.objects;
drop policy if exists "Allow anon update on banners" on storage.objects;
drop policy if exists "Allow anon delete on banners" on storage.objects;
drop policy if exists "Allow admin write banners" on storage.objects;
drop policy if exists "Allow public read banners" on storage.objects;
create policy product_images_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (bucket_id = 'product-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and exists (select 1 from public.site_admins where user_id = (select auth.uid())));

commit;
