-- Security hardening pass ahead of release.
--
-- 1. admin_user_list was a plain view (no security_invoker), so Postgres ran it with the
--    view OWNER's privileges and bypassed RLS on profiles entirely -- any anon/authenticated
--    caller could select (and, since it's a simple updatable view, even write) every row.
alter view public.admin_user_list set (security_invoker = true);
revoke insert, update, delete, truncate on public.admin_user_list from anon, authenticated;

-- 2. Self-escalation guard: "Users can update own profile" only checks row ownership
--    (auth.uid() = user_id), not which columns changed, so any logged-in user could PATCH
--    their own row to set is_pro / is_admin directly via PostgREST. This trigger clamps the
--    privileged columns back to their previous values unless the actor is the service role
--    (Stripe webhook) or an admin. It fires on the underlying table, so it also closes off
--    the same hole if reached through a SECURITY DEFINER function or the admin_user_list view.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user <> 'service_role' and not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.is_pro := old.is_pro;
      new.is_admin := old.is_admin;
      new.plan := old.plan;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.subscription_renewal := old.subscription_renewal;
    elsif tg_op = 'INSERT' then
      new.is_pro := false;
      new.is_admin := false;
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.subscription_renewal := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
before insert or update on public.profiles
for each row execute function public.protect_profile_privileged_columns();

-- 3. Drop unused, dangerous SECURITY DEFINER functions that were exposed to anon/authenticated
--    via PostgREST RPC (e.g. POST /rest/v1/rpc/sync_subscription_status) and could set is_pro
--    on an arbitrary user_id, bypassing Stripe entirely. Neither is referenced anywhere in
--    application code or wired to a trigger -- the Stripe webhook updates profiles directly
--    using the service role key.
drop function if exists public.sync_subscription_status(uuid, text);
drop function if exists public.set_pro_on_stripe_customer();

-- 4. Pin search_path on the remaining functions so they can't be hijacked by a malicious
--    search_path at call time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, is_pro, is_admin, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', false, false, 'free');
  return new;
end;
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_route_cache_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
