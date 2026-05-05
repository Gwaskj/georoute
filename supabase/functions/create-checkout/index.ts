// @ts-ignore: Deno remote import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Deno remote import
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
// @ts-ignore: Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { user_id, price_id } = await req.json();

    // @ts-ignore: Deno global
    const supabase = createClient(
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user_id)
      .single();

    const stripe = new Stripe(
      // @ts-ignore: Deno global
      Deno.env.get("STRIPE_SECRET_KEY")!,
      { apiVersion: "2023-10-16" }
    );

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: { user_id },
      });

      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user_id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${Deno.env.get("SITE_URL")!}/app?success=true`,
      cancel_url: `${Deno.env.get("SITE_URL")!}/app?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
