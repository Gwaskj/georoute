-- Read-only share links: one staff member's round, reachable by an
-- unguessable URL so it can be sent over whatever channel the service already
-- uses (WhatsApp, SMS, email) without giving staff accounts.
--
-- A schedule contains client names and home addresses, so this is personal
-- data. Three things follow from that and are enforced here rather than left
-- to the application:
--   * every link expires -- expires_at is NOT NULL with no default, so a
--     caller has to choose one
--   * links can be revoked without deleting the record
--   * there is deliberately NO policy for anon or authenticated-other users.
--     The public page reads with the service role on the server, so this table
--     is never exposed to the browser and a guessed token cannot be used to
--     enumerate it via PostgREST.
create table if not exists public.shared_schedules (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  token          text not null unique,
  staff_local_id text not null,
  staff_name     text not null default '',
  schedule_date  text,
  -- Snapshot of the round as it was shared. Deliberately a copy rather than a
  -- reference: staff should see the schedule they were sent, not one that
  -- silently changes under them after it is regenerated.
  payload        jsonb not null default '{}'::jsonb,
  expires_at     timestamptz not null,
  revoked        boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.shared_schedules enable row level security;

drop policy if exists "Users manage own shared schedules" on public.shared_schedules;
create policy "Users manage own shared schedules"
  on public.shared_schedules
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists shared_schedules_user_idx
  on public.shared_schedules (user_id, created_at desc);
