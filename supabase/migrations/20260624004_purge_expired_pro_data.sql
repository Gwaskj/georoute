-- When a pro subscription ends (cancellation, payment failure, or admin
-- removal), their staff/appointments rows should be purged 1 month later if
-- they haven't resubscribed. We don't currently record *when* is_pro went
-- false, so this adds that timestamp via a trigger (catches every existing
-- write path: Stripe webhook, admin actions, any future one) and a daily
-- pg_cron job that purges data once a month has passed.

alter table public.profiles add column if not exists pro_ended_at timestamptz;

-- Tracks the is_pro true -> false transition, and clears it on resubscribe
-- so a later re-cancellation starts the 1-month clock fresh.
create or replace function public.track_pro_ended_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_pro = true and new.is_pro = false then
    new.pro_ended_at := now();
  elsif new.is_pro = true then
    new.pro_ended_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_track_pro_ended_at on public.profiles;
create trigger profiles_track_pro_ended_at
before update on public.profiles
for each row
execute function public.track_pro_ended_at();
-- Fires after profiles_protect_privileged_columns (alphabetically later, so
-- it runs second) -- it only ever sees a legitimate is_pro change, since
-- that trigger already clamps unauthorized self-edits back to OLD.is_pro.

-- Deletes staff/appointments for users who've been non-pro for over a month,
-- logging one activity_logs row per affected user for visibility/debugging.
create or replace function public.purge_expired_pro_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  staff_count int;
  appt_count int;
begin
  for rec in
    select user_id from public.profiles
    where is_pro = false
      and pro_ended_at is not null
      and pro_ended_at < now() - interval '1 month'
  loop
    select count(*) into staff_count from public.staff where user_id = rec.user_id;
    select count(*) into appt_count from public.appointments where user_id = rec.user_id;

    if staff_count > 0 or appt_count > 0 then
      delete from public.staff where user_id = rec.user_id;
      delete from public.appointments where user_id = rec.user_id;

      insert into public.activity_logs (actor_id, target_user_id, action, details)
      values (null, rec.user_id, 'pro_data_purged', jsonb_build_object(
        'staffDeleted', staff_count,
        'appointmentsDeleted', appt_count
      ));
    end if;
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-expired-pro-data') then
    perform cron.unschedule('purge-expired-pro-data');
  end if;
end $$;

select cron.schedule(
  'purge-expired-pro-data',
  '0 4 * * *', -- daily at 04:00 UTC
  $$ select public.purge_expired_pro_data(); $$
);
