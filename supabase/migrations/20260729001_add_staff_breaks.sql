-- Per-staff unpaid breaks (e.g. lunch). A staff member can have several, each
-- with a length and an optional window it must fall inside.
--
-- Stored as jsonb rather than columns because the count is unbounded -- the
-- same reasoning as the existing `skills` column on this table. Shape:
--   [{ "id": "uuid", "minutes": 30, "windowStart": "12:00", "windowEnd": "14:00" }]
-- windowStart and windowEnd are optional; omitted means "anywhere in the
-- person's working day".
alter table public.staff
  add column if not exists breaks jsonb not null default '[]'::jsonb;

-- Must be an array. Without this a malformed object would be accepted and then
-- fail obscurely in the scheduler rather than at the point of writing it.
alter table public.staff drop constraint if exists staff_breaks_is_array;
alter table public.staff add constraint staff_breaks_is_array
  check (jsonb_typeof(breaks) = 'array');

-- Schema drift repair: work_start and work_end are written by persistPro and
-- exist in the live database, but were never added by setup.sql or any
-- migration -- they were applied by hand. Adding them idempotently here means
-- a fresh environment built from these files matches production.
alter table public.staff
  add column if not exists work_start text,
  add column if not exists work_end   text;
