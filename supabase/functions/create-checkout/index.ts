// @ts-nocheck

// @ts-ignore: Deno remote import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Deno remote import
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
// @ts-ignore: Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { user_id } = await req.json(); // price_id is no longer needed

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
      });
    }

    // @ts-ignore: Deno global
    const supabase = createClient(
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch the CURRENT Stripe Price ID for the PRO plan
    const { data: pricing, error: pricingError } = await supabase
      .from("pricing")
      .select("stripe_price_id")
      .eq("plan", "pro")
      .single();

    if (pricingError || !pricing?.stripe_price_id) {
      return new Response(
        JSON.stringify({
          error: "No Stripe price configured for the Pro plan.",
        }),
        { status: 400 }
      );
    }

    const dynamicPriceId = pricing.stripe_price_id;

    // 2. Load user profile (customer ID + email)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: `Could not load profile: ${profileError.message}` }),
        { status: 400 }
      );
    }

    const stripe = new Stripe(
      // @ts-ignore: Deno global
      Deno.env.get("STRIPE_SECRET_KEY")!,
      { apiVersion: "2023-10-16" }
    );

    let customerId = profile?.stripe_customer_id;

    // 3. Create Stripe customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { user_id },
      });

      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user_id);
    }

    // 4. Create checkout session using the dynamic Stripe Price ID
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: dynamicPriceId, quantity: 1 }],
      success_url: `${Deno.env.get("SITE_URL")!}/account?success=true`,
      cancel_url: `${Deno.env.get("SITE_URL")!}/account?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
