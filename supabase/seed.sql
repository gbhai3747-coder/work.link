-- Seed the static service catalog.
-- Run after schema.sql. Uses fixed UUIDs so the app can rely on stable ids.

insert into public.services (id, name, slug) values
  ('11111111-1111-4111-8111-111111111111', 'Plumbing', 'plumbing'),
  ('22222222-2222-4222-8222-222222222222', 'Electrical', 'electrical'),
  ('33333333-3333-4333-8333-333333333333', 'Cleaning', 'cleaning'),
  ('44444444-4444-4444-8444-444444444444', 'Tutoring', 'tutoring'),
  ('55555555-5555-4555-8555-555555555555', 'Mechanics', 'mechanics'),
  ('66666666-6666-4666-8666-666666666666', 'Painting', 'painting')
on conflict (id) do nothing;
