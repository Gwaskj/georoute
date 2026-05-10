// @ts-nocheck
// supabase/functions/create-stripe-price/index.ts
import Stripe from "stripe";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  try {
    const { plan, amount } = await req.json();

    const price = await stripe.prices.create({
      currency: "gbp",
      unit_amount: Math.round(amount * 100),
      recurring: { interval: "month" },
      product_data: {
        name: `GeoRoute ${plan} Plan`,
      },
    });

    return new Response(JSON.stringify({ priceId: price.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
