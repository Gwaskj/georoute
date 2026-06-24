-- admin_activity_logs was a dead table: nothing ever wrote to it. The only
-- write path (logAction / activity_logs insert) and the admin Logs UI
-- (reads admin_activity_logs) were never connected, so the activity log
-- feature has recorded zero rows since launch.
--
-- Replace the table with a view over activity_logs + profiles, denormalizing
-- the same columns the UI already expects (actor_email, target_is_pro, etc).
-- This keeps activity_logs as the single source of truth that all writers
-- (client code, edge functions using the service role) insert into, and the
-- view is always in sync — no second write path to forget again. Same
-- pattern as the existing admin_user_list view.
--
-- security_invoker=true makes Postgres evaluate RLS as the querying user
-- (not the view owner), so admin_activity_logs stays admin-only exactly like
-- the underlying activity_logs/profiles RLS policies already enforce.

drop table if exists public.admin_activity_logs cascade;

create view public.admin_activity_logs
with (security_invoker = true)
as
select
  al.id,
  al.action,
  al.details,
  al.actor_id,
  al.target_user_id,
  actor.email     as actor_email,
  actor.is_admin   as actor_is_admin,
  target.email     as target_email,
  target.is_pro    as target_is_pro,
  target.plan      as target_plan,
  al.created_at
from public.activity_logs al
left join public.profiles actor  on actor.user_id  = al.actor_id
left join public.profiles target on target.user_id = al.target_user_id;

grant select on public.admin_activity_logs to authenticated;
