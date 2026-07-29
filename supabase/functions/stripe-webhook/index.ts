// @ts-nocheck
// @ts-ignore: Remote module import is valid in Deno
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Remote module import is valid in Deno
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
// @ts-ignore: Remote module import is valid in Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// When the current billing period ends -- i.e. the next renewal date. Works
// for any interval (monthly, yearly) because Stripe reports the actual period
// end rather than us deriving it from the plan.
//
// Stripe moved current_period_end off the subscription and onto its items in
// API version 2025-03-31; this endpoint is pinned to 2026-04-22.dahlia, so read
// the item first and fall back to the legacy field for older payload shapes.
function renewalIso(subscription): string | null {
  const periodEnd =
    subscription.items?.data?.[0]?.current_period_end ??
    subscription.current_period_end;

  // Stripe sends Unix seconds; profiles.subscription_renewal is timestamptz.
  return typeof periodEnd === "number"
    ? new Date(periodEnd * 1000).toISOString()
    : null;
}

serve(async (req: Request) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    const error = err as Error;
    console.error("Stripe webhook error:", error.message);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Subscription created or updated
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object;

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";

    await supabase
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        is_pro: isActive,
        // Keep plan in step with is_pro; the admin users page reads both.
        plan: isActive ? "pro" : "free",
        subscription_renewal: renewalIso(subscription),
      })
      .eq("stripe_customer_id", subscription.customer);
  }

  // Subscription cancelled or expired
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    await supabase
      .from("profiles")
      .update({
        is_pro: false,
        plan: "free",
        // No further renewal once the subscription is gone; leaving a stale
        // future date here would show as an active renewal in the admin UI.
        subscription_renewal: null,
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  return new Response("OK", { status: 200 });
});
