-- The Stripe checkout/portal/webhook Edge Functions all read and write
-- profiles.stripe_customer_id and profiles.stripe_subscription_id, but
-- these columns never existed. Without them: create-checkout can never
-- find an existing customer (so it creates a new one on every checkout),
-- create-portal-session always fails with "Stripe customer not found",
-- and the webhook can never sync subscription status into is_pro.

alter table profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists profiles_stripe_customer_id_idx
  on profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists profiles_stripe_subscription_id_idx
  on profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;
