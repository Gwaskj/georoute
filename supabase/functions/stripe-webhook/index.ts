import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
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
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
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

    await supabase
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        is_pro:
          subscription.status === "active" ||
          subscription.status === "trialing",
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
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  return new Response("OK", { status: 200 });
});
