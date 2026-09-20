-- Pacific Petcare Airways shipments schema with real staff login security.
-- Run in Supabase: SQL Editor -> New query -> paste all -> Run.
-- Safe to re-run: uses "if not exists" / "or replace" throughout.

create table if not exists shipments (
  tracking_number text primary key,
  pet_name text not null,
  species text not null,
  breed text,
  age text,
  photo text,
  origin jsonb not null,
  destination jsonb not null,
  current_stage_index smallint not null default 0 check (current_stage_index between 0 and 4),
  current_location jsonb not null,
  stage_dates jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  origin_address text,
  receiver jsonb not null,
  created_at timestamptz not null default now()
);

alter table shipments enable row level security;

drop policy if exists "Staff can read all shipment data" on shipments;
create policy "Staff can read all shipment data"
  on shipments for select
  to authenticated
  using (true);

drop policy if exists "Staff can insert shipments" on shipments;
create policy "Staff can insert shipments"
  on shipments for insert
  to authenticated
  with check (true);

drop policy if exists "Staff can update shipments" on shipments;
create policy "Staff can update shipments"
  on shipments for update
  to authenticated
  using (true);

drop policy if exists "Staff can delete shipments" on shipments;
create policy "Staff can delete shipments"
  on shipments for delete
  to authenticated
  using (true);

-- Public tracking page reads ONLY through this view - receiver info and the
-- exact pickup address are never exposed to it, at the database level (not
-- just hidden in the frontend), because anon has no select policy on the
-- base table above, only on this view.
create or replace view shipments_public as
  select tracking_number, pet_name, species, breed, age, photo,
         origin, destination, current_stage_index, current_location,
         stage_dates, events
  from shipments;

grant select on shipments_public to anon, authenticated;

-- Create your staff login: Authentication -> Users -> Add user (email +
-- password, check "Auto Confirm User"). That's what you'll sign into the
-- admin panel with - the old hardcoded demo password goes away entirely.
