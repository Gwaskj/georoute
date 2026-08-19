-- Expire route_cache entries a month after they were last used, not a month
-- after they were created.
--
-- The old purge deleted by created_at, so a postcode pair looked up every
-- single morning was still thrown away every month and re-fetched from ORS at
-- full price. That is backwards: the entries worth keeping are precisely the
-- ones being used, and the ones worth dropping are the pairs someone tried
-- once and never returned to.
--
-- A cache hit is a select, which leaves no trace, so use has to be recorded
-- deliberately. updated_at could not stand in for this -- it moves only when a
-- row is rewritten, which happens on a miss.

alter table public.route_cache
  add column if not exists last_used_at timestamptz not null default now();

-- Existing rows have never recorded a use. Seed from the best evidence we
-- have of when each was last touched, so nothing is deleted on the first run
-- purely for having predated the column.
update public.route_cache
   set last_used_at = greatest(coalesce(updated_at, created_at), created_at)
 where last_used_at is null
    or last_used_at < coalesce(updated_at, created_at);

-- The purge scans on this column nightly.
create index if not exists idx_route_cache_last_used
  on public.route_cache (last_used_at);

create or replace function public.purge_old_route_cache()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.route_cache
  where last_used_at < now() - interval '1 month';
end;
$$;

-- The 03:00 UTC schedule from 20260624003 still stands; only the definition of
-- "old" has changed, so the job does not need rescheduling.

comment on column public.route_cache.last_used_at is
  'Last time this pair was served from cache. Stamped by the route-optimizer '
  'function on a hit, at most once a day per pair, and used by '
  'purge_old_route_cache to expire pairs nobody asks for any more.';
