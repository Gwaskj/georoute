-- Errors that reached a user, so they can be seen rather than reported.
--
-- Deliberately separate from activity_logs: that table's RLS requires
-- auth.uid() to be present, so an error hitting a logged-out visitor -- which
-- is when the free scheduler is most used, and so when breakage is most
-- likely -- would be silently dropped by the very system meant to record it.
--
-- Inserts arrive through /api/errors using the service role, never from the
-- browser directly. A client-writable error table is an invitation to fill
-- the database with junk, and the API route is where size limits and
-- throttling live.
create table if not exists public.error_reports (
  id           bigserial primary key,

  -- What broke. Truncated by the API route; a stack can otherwise run to
  -- hundreds of kilobytes and there is nothing useful past the first frames.
  message      text not null,
  stack        text,

  -- Where it broke, which is usually the fastest route to reproducing it.
  url          text,
  user_agent   text,

  -- Which surface reported it: "client" for a browser error, "boundary" for a
  -- React render failure, "server" for an API route.
  source       text not null default 'client',

  -- Nullable on purpose. Anonymous errors are the ones most worth having, and
  -- no foreign key to auth.users: deleting an account should not delete the
  -- record that something was broken.
  user_id      uuid,

  -- Anything else worth keeping. Free-form so adding context later needs no
  -- migration.
  context      jsonb not null default '{}'::jsonb,

  -- Groups repeats of the same fault. One bug refreshed twenty times is one
  -- problem, and should read as one row with a count rather than twenty rows.
  fingerprint  text,
  occurrences  integer not null default 1,

  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  -- Null until an admin has dealt with it. This is what the notification
  -- counts, so "acknowledged" means "I have seen this", not "it is fixed".
  acknowledged_at timestamptz
);

-- The notification asks one question on every admin page load: how many
-- unacknowledged errors are there. This index is what keeps that cheap.
create index if not exists error_reports_unack_idx
  on public.error_reports (created_at desc)
  where acknowledged_at is null;

-- Repeats are folded into an existing row by fingerprint, so that lookup has
-- to be fast too. Not unique: an old acknowledged fault recurring should open
-- a new row rather than silently reviving a closed one.
create index if not exists error_reports_fingerprint_idx
  on public.error_reports (fingerprint, acknowledged_at);

alter table public.error_reports enable row level security;

-- No policy for insert, update or delete. Without one, RLS denies them to
-- anon and authenticated alike; the service role bypasses RLS and is the only
-- thing that writes here.
--
-- Read is restricted to admins. Error reports carry URLs and stack traces
-- that can name other users' data, so they are not for ordinary accounts.
drop policy if exists "admins read error reports" on public.error_reports;
create policy "admins read error reports"
  on public.error_reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );
