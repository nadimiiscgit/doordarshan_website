-- ADDITIVE STAGING/PREPARATION STEP. Review schema and back up first.
-- Keeps existing base-products policies so the current public site can keep working.
-- Follow with database-security-hardening.sql AFTER the new site is deployed.
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
insert into public.site_content (id, published, draft) values
  ('main', '{"phone":"917020209281","whatsapp":"917020209281","address":"Samta Colony, Dharashiv, Maharashtra","featured_ids":[],"new_ids":[]}'::jsonb,
   '{"phone":"917020209281","whatsapp":"917020209281","address":"Samta Colony, Dharashiv, Maharashtra","featured_ids":[],"new_ids":[]}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.catalogue_products (
  id bigint primary key, name text not null, brand text, category text,
  subcategory text, type jsonb not null default '[]'::jsonb,
  model text, price numeric(12,2), size text,
  is_new boolean not null default false, is_featured boolean not null default false,
  specs jsonb not null default '{}'::jsonb, description text, image text,
  images jsonb not null default '[]'::jsonb
);
alter table public.site_admins enable row level security;
alter table public.site_content enable row level security;
alter table public.catalogue_products enable row level security;
revoke all on public.site_admins, public.site_content, public.catalogue_products from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.site_admins to authenticated;
grant select (id,published,published_at) on public.site_content to anon;
grant select, update on public.site_content to authenticated;
grant select on public.catalogue_products to anon, authenticated;

drop policy if exists site_admin_self_read on public.site_admins;
create policy site_admin_self_read on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists site_content_public_read on public.site_content;
drop policy if exists site_content_admin_read on public.site_content;
drop policy if exists site_content_admin_update on public.site_content;
create policy site_content_public_read on public.site_content for select to anon using (id = 'main');
create policy site_content_admin_read on public.site_content for select to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
create policy site_content_admin_update on public.site_content for update to authenticated
  using (exists (select 1 from public.site_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins where user_id = (select auth.uid())));
drop policy if exists catalogue_public_read on public.catalogue_products;
create policy catalogue_public_read on public.catalogue_products for select to anon, authenticated using (true);

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

create index if not exists catalogue_category_id_idx on public.catalogue_products(category,id);
create index if not exists catalogue_brand_idx on public.catalogue_products(brand);
commit;
