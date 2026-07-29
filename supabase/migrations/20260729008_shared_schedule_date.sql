-- A real date on a published round, so the right day can be selected.
--
-- schedule_date holds a human-readable string ("Wednesday 29 July") for
-- display. That cannot be compared or sorted, so /my-round could only ever
-- show the most recently published round -- meaning a staff member opening the
-- app in the morning might be looking at yesterday.
alter table public.shared_schedules
  add column if not exists schedule_on date;

-- Lets the staff page find today's round without scanning the user's history.
create index if not exists shared_schedules_staff_date_idx
  on public.shared_schedules (staff_local_id, schedule_on desc);
