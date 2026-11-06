-- Barber_Pro - Schema Supabase (LOT B)
-- Tables, RLS permissive anon/authenticated, index et publication realtime.
-- SQL uniquement : aucune modification applicative.

-- -------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------
create table if not exists public.shop_settings (
  key text primary key,
  value text
);

create table if not exists public.barbers (
  id text primary key,
  name text not null,
  initials text not null default '',
  specialties text[] not null default '{}',
  status text not null default 'online',
  avg_time integer not null default 25
);

create table if not exists public.services (
  id text primary key,
  name text not null,
  price numeric not null default 0,
  duration integer not null default 20,
  category text
);

create table if not exists public.queue_items (
  id text primary key,
  client_name text not null,
  phone text,
  barber_id text not null,
  service_id text not null,
  service_name text not null,
  price numeric not null default 0,
  status text not null default 'waiting',
  joined_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.transactions (
  id text primary key,
  client_name text not null,
  service_name text not null,
  price numeric not null default 0,
  timestamp timestamptz not null default now(),
  barber_name text not null,
  barber_id text not null
);

create table if not exists public.shops (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  address text not null default '',
  phone text not null default '',
  is_open boolean not null default true,
  owner_id text
);

-- -------------------------------------------------------------
-- Index
-- -------------------------------------------------------------
create index if not exists idx_queue_items_joined_at
  on public.queue_items (joined_at);

create index if not exists idx_queue_items_barber_status
  on public.queue_items (barber_id, status);

create index if not exists idx_transactions_timestamp
  on public.transactions (timestamp desc);

-- -------------------------------------------------------------
-- Privileges (les tables sont accedees via la cle anon)
-- -------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on public.shop_settings,
     public.barbers,
     public.services,
     public.queue_items,
     public.transactions,
     public.shops
  to anon, authenticated;

-- -------------------------------------------------------------
-- Row Level Security - policies permissives
-- -------------------------------------------------------------
alter table public.shop_settings enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.queue_items enable row level security;
alter table public.transactions enable row level security;
alter table public.shops enable row level security;

drop policy if exists "permissive_all_shop_settings" on public.shop_settings;
create policy "permissive_all_shop_settings"
  on public.shop_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "permissive_all_barbers" on public.barbers;
create policy "permissive_all_barbers"
  on public.barbers
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "permissive_all_services" on public.services;
create policy "permissive_all_services"
  on public.services
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "permissive_all_queue_items" on public.queue_items;
create policy "permissive_all_queue_items"
  on public.queue_items
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "permissive_all_transactions" on public.transactions;
create policy "permissive_all_transactions"
  on public.transactions
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "permissive_all_shops" on public.shops;
create policy "permissive_all_shops"
  on public.shops
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- -------------------------------------------------------------
-- Publication realtime sur les 5 tables critiques
-- -------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'queue_items'
    ) then
      execute 'alter publication supabase_realtime add table public.queue_items';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'transactions'
    ) then
      execute 'alter publication supabase_realtime add table public.transactions';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'barbers'
    ) then
      execute 'alter publication supabase_realtime add table public.barbers';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'services'
    ) then
      execute 'alter publication supabase_realtime add table public.services';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'shop_settings'
    ) then
      execute 'alter publication supabase_realtime add table public.shop_settings';
    end if;
  end if;
end $$;
