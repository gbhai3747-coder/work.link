-- WORKLINK Stage 2 delta
-- Run ONLY if you already applied `schema.sql` from Stage 1.
-- If you are applying schema.sql fresh, skip this file (it's already included).

-- 1) Public nearby-worker search (anonymous visitors can search; the RPC is
--    security definer and returns only sanitized public fields + distance).
grant execute on function public.search_nearby_workers(double precision, double precision, text)
  to authenticated, anon;
revoke execute on function public.search_nearby_workers(double precision, double precision, text)
  from public;

-- 2) Workers can read their own last-location-update timestamp (not the coords).
revoke select on public.worker_profiles from anon, authenticated;
grant select (id, description, experience_years, service_radius_km, is_available, location_updated_at, created_at, updated_at)
  on public.worker_profiles to authenticated;

-- 3) Workers may read back their own stored coordinates via this RPC only.
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
