-- Purge route_cache entries older than 1 month. ORS road data can drift over
-- time and the table would otherwise grow unbounded, so we expire cached
-- postcode-pair lookups by age rather than relying on the app to prune them.
-- Uses pg_cron (built into Supabase) to run the cleanup on a schedule rather
-- than on-demand from application code.

create extension if not exists pg_cron schema extensions;

create or replace function public.purge_old_route_cache()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.route_cache
  where created_at < now() - interval '1 month';
end;
$$;

-- Re-running this migration shouldn't create a duplicate job.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-old-route-cache') then
    perform cron.unschedule('purge-old-route-cache');
  end if;
end $$;

select cron.schedule(
  'purge-old-route-cache',
  '0 3 * * *', -- daily at 03:00 UTC, low traffic
  $$ select public.purge_old_route_cache(); $$
);
