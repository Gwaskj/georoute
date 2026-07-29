-- Dates and recurrence for appointments.
--
-- Until now an appointment had no date at all: the scheduler planned "today's
-- list" and nothing described when a visit was due. That works for a service
-- retyping the round each morning and not much else.
--
-- The pattern set here is deliberately small -- once, daily, or weekly on
-- chosen weekdays with an every-N-weeks interval. That covers essentially all
-- care and community rounds. Full RFC 5545 recurrence was considered and
-- rejected: far more surface area, and far more ways to produce a schedule
-- nobody intended.
alter table public.appointments
  add column if not exists starts_on      date,
  add column if not exists ends_on        date,
  add column if not exists recur_freq     text not null default 'once',
  add column if not exists recur_interval int  not null default 1,
  -- ISO weekday numbers, 1 = Monday .. 7 = Sunday, matching Postgres isodow
  -- and JS getDay() once Sunday is mapped from 0 to 7.
  add column if not exists recur_weekdays jsonb not null default '[]'::jsonb;

alter table public.appointments drop constraint if exists appointments_recur_freq_check;
alter table public.appointments add constraint appointments_recur_freq_check
  check (recur_freq in ('once', 'daily', 'weekly'));

alter table public.appointments drop constraint if exists appointments_recur_interval_check;
alter table public.appointments add constraint appointments_recur_interval_check
  check (recur_interval >= 1);

alter table public.appointments drop constraint if exists appointments_recur_weekdays_check;
alter table public.appointments add constraint appointments_recur_weekdays_check
  check (jsonb_typeof(recur_weekdays) = 'array');

-- A window that ends before it starts yields nothing and is always a mistake.
alter table public.appointments drop constraint if exists appointments_date_range_check;
alter table public.appointments add constraint appointments_date_range_check
  check (ends_on is null or starts_on is null or ends_on >= starts_on);

-- Existing appointments predate dates entirely. Anchoring them to today keeps
-- them visible in the calendar rather than silently vanishing from a system
-- that now filters by date.
update public.appointments
   set starts_on = current_date
 where starts_on is null;

-- ── Exceptions ───────────────────────────────────────────────────────────
-- One occurrence of a series being skipped or moved, without breaking the
-- series. A cancelled visit is the common case; services hit this within
-- days of using recurrence at all.
create table if not exists public.appointment_exceptions (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  appointment_local_id text not null,
  -- The date in the series being altered.
  on_date              date not null,
  action               text not null default 'skip',
  -- Where it moved to, when action = 'move'.
  moved_to_date        date,
  created_at           timestamptz not null default now(),
  constraint appointment_exceptions_action_check
    check (action in ('skip', 'move')),
  -- A move with nowhere to go is a skip wearing a different name; reject it so
  -- the expansion code never has to guess.
  constraint appointment_exceptions_move_check
    check (action <> 'move' or moved_to_date is not null)
);

-- One exception per occurrence, so expansion cannot find two conflicting
-- instructions for the same date.
create unique index if not exists appointment_exceptions_unique_idx
  on public.appointment_exceptions (user_id, appointment_local_id, on_date);

alter table public.appointment_exceptions enable row level security;

drop policy if exists "Users manage own appointment exceptions" on public.appointment_exceptions;
create policy "Users manage own appointment exceptions"
  on public.appointment_exceptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Staff accounts are read-only everywhere, this table included.
drop trigger if exists appointment_exceptions_no_staff_writes on public.appointment_exceptions;
create trigger appointment_exceptions_no_staff_writes
  before insert or update or delete on public.appointment_exceptions
  for each row execute function public.reject_staff_account_writes();
