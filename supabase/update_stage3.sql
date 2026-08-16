-- WORKLINK Stage 3 delta
-- Run ONLY if you already applied `schema.sql` from Stages 1-2.
-- If you are applying schema.sql fresh, skip this file (it's already included).

-- 1) Booking status lifecycle enforced at the database level. Every transition
--    must be allowed AND made by the right party (auth.uid(), never the client).
--      worker:     pending -> accepted/rejected, accepted -> in_progress, in_progress -> completed
--      customer:   pending -> cancelled
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

-- 2) Index for customer-side booking filtering by status.
create index if not exists idx_bookings_customer_status on public.bookings (customer_id, status);

-- 3) Realtime: publish the full bookings row and add it to the realtime publication
--    (idempotent). Existing rows keep their status on the client as the initial state.
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
