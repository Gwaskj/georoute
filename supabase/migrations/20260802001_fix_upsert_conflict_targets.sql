-- Make the staff and appointment upserts actually work.
--
-- 20260729002 and 20260729007 added PARTIAL unique indexes:
--
--   create unique index ... on (user_id, local_id) where local_id is not null
--
-- Postgres cannot infer a partial index for ON CONFLICT unless the statement
-- repeats the index predicate, which PostgREST does not do. So every upsert
-- from persistPro failed with 42P10 -- "no unique or exclusion constraint
-- matching the ON CONFLICT specification" -- and because that path logs and
-- returns early, saves were lost silently. Editing an appointment appeared to
-- work until the page was reloaded.
--
-- Plain unique indexes fix the inference. The partial predicate existed to let
-- rows without a local_id sit outside the constraint; NULL handles that on its
-- own, since Postgres treats NULLs as distinct in a unique index. The only
-- value that would now collide is the empty string, so those become NULL and
-- the defaults that produced them are removed.

-- ── staff ────────────────────────────────────────────────────────────────
update public.staff set local_id = null where local_id = '';
alter table public.staff alter column local_id drop default;

drop index if exists public.staff_user_local_id_idx;
create unique index staff_user_local_id_idx
  on public.staff (user_id, local_id);

-- ── appointments ─────────────────────────────────────────────────────────
update public.appointments set local_id = null where local_id = '';
alter table public.appointments alter column local_id drop default;

drop index if exists public.appointments_user_local_id_idx;
create unique index appointments_user_local_id_idx
  on public.appointments (user_id, local_id);
