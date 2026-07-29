-- Read-only logins for staff.
--
-- A staff account belongs to an owner and can do exactly one thing: read the
-- rounds published to it. It cannot write anything, anywhere -- including in
-- its own workspace.

-- ── Linking ──────────────────────────────────────────────────────────────
-- profiles.owner_user_id being set is what makes an account a staff account.
-- One column carries both facts: whether it is staff, and whose.
alter table public.profiles
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

-- staff.auth_user_id ties a staff record to the login that reads its rounds.
alter table public.staff
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists staff_auth_user_id_idx
  on public.staff (auth_user_id)
  where auth_user_id is not null;

-- ── Helper ───────────────────────────────────────────────────────────────
-- security definer so it can read profiles regardless of the caller's own RLS.
-- Without this, a policy that checks "am I a staff account?" would itself be
-- filtered by the policies it is trying to inform.
create or replace function public.is_staff_account(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = uid and owner_user_id is not null
  );
$$;

-- ── Read access to their own rounds ──────────────────────────────────────
-- Resolves "is this schedule published to me?" by joining staff to the login.
-- security definer for the same reason as above: the staff table's own policy
-- is owner-scoped, so a staff account could not see the row it needs to check.
create or replace function public.owns_shared_schedule(
  schedule_user_id uuid,
  schedule_staff_local_id text,
  uid uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id  = schedule_user_id
      and s.local_id = schedule_staff_local_id
      and s.auth_user_id = uid
  );
$$;

drop policy if exists "Staff read own shared schedules" on public.shared_schedules;
create policy "Staff read own shared schedules"
  on public.shared_schedules
  for select
  using (
    public.owns_shared_schedule(user_id, staff_local_id, auth.uid())
  );

-- Staff need to see their own staff row (name, postcodes, breaks) to render a
-- round. Read only -- there is deliberately no matching write policy.
drop policy if exists "Staff read own staff record" on public.staff;
create policy "Staff read own staff record"
  on public.staff
  for select
  using (auth_user_id = auth.uid());

-- ── Read-only enforcement ────────────────────────────────────────────────
-- The existing policies are all "auth.uid() = user_id", which would happily
-- let a staff account create rows in its own empty workspace. That is not what
-- "read only" means, so writes are rejected outright.
--
-- A trigger rather than rewriting every policy: it cannot be bypassed by a
-- policy added later, and it fails loudly instead of silently filtering.
-- auth.uid() is null for the service role, so server-side writes still work.
create or replace function public.reject_staff_account_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and public.is_staff_account(auth.uid()) then
    raise exception 'Staff accounts are read-only' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'staff', 'appointments', 'routes', 'user_windows', 'user_skills',
    'business_settings', 'shared_schedules'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists %I on public.%I', t || '_no_staff_writes', t);
      execute format(
        'create trigger %I before insert or update or delete on public.%I
           for each row execute function public.reject_staff_account_writes()',
        t || '_no_staff_writes', t
      );
    end if;
  end loop;
end;
$$;

-- owner_user_id decides what an account is allowed to do, so it must be as
-- protected as is_pro and is_admin already are.
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
