-- WORKLINK database schema
-- Run this in the Supabase SQL editor (or via `supabase db push` / migrations).
-- Order matters: tables -> triggers -> RLS -> functions.

-- ============================================================
-- 1. Extensions
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 2. Tables
-- ============================================================

-- One row per auth user. Created automatically by a trigger on auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null,
  role text not null default 'customer' check (role in ('customer', 'worker')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Worker-specific profile. 1:1 with profiles where role = 'worker'.
create table if not exists public.worker_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  description text,
  experience_years integer not null default 0 check (experience_years >= 0),
  service_radius_km numeric(5,2) not null default 10 check (service_radius_km > 0 and service_radius_km <= 500),
  is_available boolean not null default false,
  -- Exact live location. Only populated while the worker is available and
  -- sharing their location. Customers NEVER see these columns (see grants).
  lat double precision,
  lng double precision,
  location_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Static service catalog (Plumbing, Electrical, ...).
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Join table: a worker can offer many services.
create table if not exists public.worker_services (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price_hourly numeric(10,2) check (price_hourly is null or price_hourly > 0),
  created_at timestamptz not null default now(),
  unique (worker_id, service_id)
);

-- A booking request between a customer and a worker.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  job_description text not null,
  preferred_time timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled')
  ),
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reviews left by customers for workers after a completed booking.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  worker_id uuid not null references public.worker_profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. Triggers
-- ============================================================

-- Keep updated_at fresh on rows that change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_worker_profiles_updated_at on public.worker_profiles;
create trigger set_worker_profiles_updated_at
  before update on public.worker_profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- Enforce the booking status lifecycle at the database level. Every status
-- change must follow the allowed transitions AND be made by the right party:
--   worker: pending -> accepted/rejected, accepted -> in_progress, in_progress -> completed
--   customer: pending -> cancelled
-- The actor is derived from the request JWT (auth.uid()), never from the client.
create or replace function public.validate_booking_status_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status in ('accepted', 'rejected') then
    if old.status <> 'pending' then
      raise exception 'Only pending bookings can be accepted or rejected.';
    end if;
    if auth.uid() <> old.worker_id then
      raise exception 'Only the worker can accept or reject this booking.';
    end if;
  elsif new.status = 'cancelled' then
    if old.status <> 'pending' then
      raise exception 'Only pending bookings can be cancelled.';
    end if;
    if auth.uid() <> old.customer_id then
      raise exception 'Only the customer can cancel this booking.';
    end if;
  elsif new.status = 'in_progress' then
    if old.status <> 'accepted' then
      raise exception 'Only accepted bookings can be started.';
    end if;
    if auth.uid() <> old.worker_id then
      raise exception 'Only the worker can start this booking.';
    end if;
  elsif new.status = 'completed' then
    if old.status <> 'in_progress' then
      raise exception 'Only in-progress bookings can be completed.';
    end if;
    if auth.uid() <> old.worker_id then
      raise exception 'Only the worker can complete this booking.';
    end if;
  else
    raise exception 'Invalid booking status "%".', new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_booking_status_transition on public.bookings;
create trigger enforce_booking_status_transition
  before update on public.bookings
  for each row execute procedure public.validate_booking_status_transition();

-- Create the profiles + worker_profiles rows when a user signs up.
-- Reads the role/name/phone passed in signUp({ data: {...} }) metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_phone text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_phone := coalesce(new.raw_user_meta_data ->> 'phone', '');

  if v_role not in ('customer', 'worker') then
    v_role := 'customer';
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (new.id, v_full_name, v_phone, v_role)
  on conflict (id) do nothing;

  if v_role = 'worker' then
    insert into public.worker_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.services enable row level security;
alter table public.worker_services enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

-- Restrict direct column reads: exact worker location is never exposed
-- through the table. Access happens via security-definer RPCs. The worker's own
-- last-update timestamp is readable so they can see when their location went stale.
revoke select on public.worker_profiles from anon, authenticated;
grant select (id, description, experience_years, service_radius_km, is_available, location_updated_at, created_at, updated_at)
  on public.worker_profiles to authenticated;

-- Profiles: a user can read/update only their own row via RLS. Cross-user
-- reads (worker cards, booking contact) go through security-definer RPCs or
-- the server-side service-role client.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Worker profiles: owner-only.
create policy "worker_profiles_select_own"
  on public.worker_profiles for select
  using (auth.uid() = id);

create policy "worker_profiles_insert_own"
  on public.worker_profiles for insert
  with check (auth.uid() = id);

create policy "worker_profiles_update_own"
  on public.worker_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Services: public catalog, readable by everyone.
create policy "services_select_all"
  on public.services for select
  using (true);

-- Worker services: readable by everyone, editable by the owning worker.
create policy "worker_services_select_all"
  on public.worker_services for select
  using (true);

create policy "worker_services_insert_own"
  on public.worker_services for insert
  with check (worker_id = auth.uid());

create policy "worker_services_update_own"
  on public.worker_services for update
  using (worker_id = auth.uid())
  with check (worker_id = auth.uid());

create policy "worker_services_delete_own"
  on public.worker_services for delete
  using (worker_id = auth.uid());

-- Bookings: only the customer and worker involved.
create policy "bookings_select_participants"
  on public.bookings for select
  using (customer_id = auth.uid() or worker_id = auth.uid());

create policy "bookings_insert_customer"
  on public.bookings for insert
  with check (customer_id = auth.uid());

create policy "bookings_update_participants"
  on public.bookings for update
  using (customer_id = auth.uid() or worker_id = auth.uid())
  with check (customer_id = auth.uid() or worker_id = auth.uid());

-- Reviews: public read; customers may only review a completed booking.
create policy "reviews_select_all"
  on public.reviews for select
  using (true);

create policy "reviews_insert_completed_booking"
  on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.worker_id = worker_id
        and b.status = 'completed'
    )
  );

-- ============================================================
-- 5. Indexes
-- ============================================================

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_worker_profiles_available
  on public.worker_profiles (is_available, lat, lng)
  where lat is not null and lng is not null;
create index if not exists idx_worker_services_service on public.worker_services (service_id);
create index if not exists idx_worker_services_worker on public.worker_services (worker_id);
create index if not exists idx_bookings_customer on public.bookings (customer_id, created_at desc);
create index if not exists idx_bookings_worker on public.bookings (worker_id, created_at desc);
create index if not exists idx_bookings_worker_status on public.bookings (worker_id, status);
create index if not exists idx_bookings_customer_status on public.bookings (customer_id, status);
create index if not exists idx_reviews_worker on public.reviews (worker_id);

-- ============================================================
-- 6. Functions / RPCs
-- ============================================================

-- Haversine distance between two coordinates (km).
create or replace function public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371.0 * acos(
    least(1.0, greatest(-1.0,
      sin(radians(lat1)) * sin(radians(lat2)) +
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2 - lng1))
    ))
  );
$$;

-- Find available workers offering a service near a customer location.
-- Security definer so it can read worker coordinates; it only ever returns
-- sanitized, public fields plus the computed distance (never exact coords).
create or replace function public.search_nearby_workers(
  p_lat double precision,
  p_lng double precision,
  p_service_slug text
)
returns table (
  worker_id uuid,
  full_name text,
  avatar_url text,
  service_name text,
  description text,
  experience_years integer,
  rating numeric,
  completed_jobs bigint,
  distance_km numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_freshness interval := interval '6 hours';
begin
  return query
  with ranked as (
    select
      wp.id as worker_id,
      p.full_name,
      p.avatar_url,
      s.name as service_name,
      wp.description,
      wp.experience_years,
      coalesce(avg(r.rating), 0) as rating,
      (select count(*)::bigint
         from public.bookings b
        where b.worker_id = wp.id and b.status = 'completed') as completed_jobs,
      public.haversine_km(p_lat, p_lng, wp.lat, wp.lng) as distance_km,
      wp.service_radius_km
    from public.worker_profiles wp
    join public.profiles p on p.id = wp.id
    join public.worker_services ws on ws.worker_id = wp.id
    join public.services s on s.id = ws.service_id
    left join public.reviews r on r.worker_id = wp.id
    where s.slug = p_service_slug
      and p.role = 'worker'
      and wp.is_available = true
      and wp.lat is not null
      and wp.lng is not null
      and wp.location_updated_at > now() - v_freshness
    group by wp.id, p.full_name, p.avatar_url, s.name, wp.description,
             wp.experience_years, wp.lat, wp.lng, wp.service_radius_km
  )
  select
    ranked.worker_id,
    ranked.full_name,
    ranked.avatar_url,
    ranked.service_name,
    ranked.description,
    ranked.experience_years,
    round(ranked.rating::numeric, 1) as rating,
    ranked.completed_jobs,
    round(ranked.distance_km::numeric, 1) as distance_km
  from ranked
  where ranked.distance_km <= ranked.service_radius_km::double precision
  order by ranked.distance_km asc;
end;
$$;

-- Public search is granted to everyone (incl. anonymous visitors): the function
-- is security definer and only returns sanitized, public fields + distance.
revoke execute on function public.search_nearby_workers(double precision, double precision, text)
  from public;
grant execute on function public.search_nearby_workers(double precision, double precision, text)
  to authenticated, anon;

-- Workers may read back their own stored coordinates via this RPC only.
create or replace function public.get_own_location()
returns table (lat double precision, lng double precision, location_updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select wp.lat, wp.lng, wp.location_updated_at
    from public.worker_profiles wp
    where wp.id = auth.uid();
end;
$$;

revoke execute on function public.get_own_location() from public;
grant execute on function public.get_own_location() to authenticated;

-- Share contact details only between the two parties of a booking.
create or replace function public.get_booking_contact(p_booking_id uuid)
returns table (other_party_phone text, other_party_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_worker_id uuid;
begin
  select b.customer_id, b.worker_id
    into v_customer_id, v_worker_id
    from public.bookings b
   where b.id = p_booking_id;

  if not found then
    return;
  end if;

  if v_customer_id = auth.uid() then
    return query
      select p.phone, p.full_name from public.profiles p where p.id = v_worker_id;
  elsif v_worker_id = auth.uid() then
    return query
      select p.phone, p.full_name from public.profiles p where p.id = v_customer_id;
  end if;
end;
$$;

grant execute on function public.get_booking_contact(uuid) to authenticated;
revoke execute on function public.get_booking_contact(uuid) from anon;

-- ============================================================
-- 7. Storage (worker avatar photos)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 8. Realtime
-- ============================================================

-- Publish the full row so clients can react to booking status changes.
alter table public.bookings replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end;
$$;
