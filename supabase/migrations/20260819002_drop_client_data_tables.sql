-- Remove every table that held a customer's clients, staff and rounds.
--
-- Storing other people's names, home addresses and visit times is what made
-- this service a data processor under Article 28. All of it now lives in the
-- browser that entered it, so these tables have no writer and no reader left.
--
-- Row counts checked immediately before writing this. staff, appointments,
-- scheduled_visits, routes, shared_schedules and user_skills were empty.
-- user_windows held 4 rows -- the seeded Breakfast, Lunch, Tea and Bedtime
-- defaults -- and appointment_exceptions held 4 skip markers from testing in
-- July and August. All 8 belong to the single account in profiles, which is
-- the owner's own, and none of them names a client or a postcode.
--
-- The window defaults are re-seeded locally on first load, so they come back
-- on their own.
--
-- route_cache deliberately stays. It maps a postcode pair to a distance and a
-- duration, has no user_id, and records nothing about who asked -- the same
-- facts ONS publishes for every UK postcode. It is what keeps the ORS bill
-- down, and it is not personal data.

-- ── 1. Functions that read the doomed tables ─────────────────────────────
--
-- Dropped before the tables, not after. A plpgsql body is not checked until
-- it runs, so leaving these would not fail here -- it would fail at 3am on a
-- cron job, in a log nobody reads.

-- Nothing left to purge: a cancelled account has no server-side data to
-- delete, because it never had any. The 30-day retention window this
-- implemented no longer describes anything real.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-expired-pro-data') then
    perform cron.unschedule('purge-expired-pro-data');
  end if;
end $$;

drop function if exists public.purge_expired_pro_data();

-- Backed the RLS policy that let a carer read the round published to them.
drop function if exists public.owns_shared_schedule(uuid, text);
drop function if exists public.owns_shared_schedule(uuid, uuid);

-- ── 2. The staff-account apparatus ───────────────────────────────────────
--
-- Carer logins are gone: they existed to read a round from the server, and
-- there is no round on the server to read. Their replacement is a per-day
-- link that carries the round in the URL fragment.
--
-- business_settings survives the table drops below, so its trigger has to be
-- removed by name rather than left to cascade.

drop trigger if exists business_settings_no_staff_writes on public.business_settings;
drop function if exists public.reject_staff_account_writes() cascade;
drop function if exists public.is_staff_account(uuid);

-- ── 3. The tables ────────────────────────────────────────────────────────
--
-- cascade takes the policies, triggers, indexes and constraints with them.
-- Ordered children first so the intent is readable, though cascade makes the
-- order immaterial.

drop table if exists public.scheduled_visits      cascade;
drop table if exists public.appointment_exceptions cascade;
drop table if exists public.shared_schedules      cascade;
drop table if exists public.routes                cascade;
drop table if exists public.appointments          cascade;
drop table if exists public.staff                 cascade;
drop table if exists public.user_windows          cascade;
drop table if exists public.user_skills           cascade;

-- ── 4. What is deliberately kept ─────────────────────────────────────────
--
--   profiles          our own customers: email, is_pro, Stripe ids
--   activity_logs     counts and durations only, never a name or a postcode
--   error_reports     crash reports, with URL fragments stripped before storage
--   business_settings the customer's own office postcode, not their clients'
--   route_cache       postcode pair to travel time, with no user attached
--   page_content      CMS blocks
--   site_header       logo, banner, nav items
--   site_themes       colours
--   pricing           plan copy
