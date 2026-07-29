-- Fix the self-escalation guard rejecting the service role as well as users.
--
-- protect_profile_privileged_columns is SECURITY DEFINER, and inside such a
-- function current_user is the function OWNER, not the role that made the
-- request. So `current_user <> 'service_role'` was always true and the guard
-- clamped every write to is_pro / plan / stripe_* -- including the Stripe
-- webhook's, silently, with no error returned to the caller.
--
-- Effect in production: a customer could pay, the webhook could run correctly,
-- and is_pro would still be reverted to false on the way into the table.
--
-- The calling role has to come from the request's JWT claims instead, which
-- PostgREST exposes as the request.jwt.claims GUC. The security property is
-- unchanged: an ordinary logged-in user still cannot raise their own
-- privileges, which the accompanying tests cover.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims   text := current_setting('request.jwt.claims', true);
  jwt_role text := coalesce((nullif(claims, '')::jsonb) ->> 'role', '');
begin
  -- No JWT claims at all means this is not a PostgREST request: a migration,
  -- psql, or a scheduled job. Those already hold direct database access, so
  -- there is nothing for this guard to add.
  if claims is null or claims = '' then
    return new;
  end if;

  if jwt_role <> 'service_role' and not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.is_pro := old.is_pro;
      new.is_admin := old.is_admin;
      new.plan := old.plan;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.subscription_renewal := old.subscription_renewal;
      new.owner_user_id := old.owner_user_id;
    elsif tg_op = 'INSERT' then
      new.is_pro := false;
      new.is_admin := false;
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.subscription_renewal := null;
      new.owner_user_id := null;
    end if;
  end if;

  return new;
end;
$$;
