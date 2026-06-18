// @ts-nocheck
// supabase/functions/create-stripe-price/index.ts
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

// Global CORS headers used for ALL responses — this function is called
// directly from the browser (admin/pricing page), so it needs to handle
// the preflight OPTIONS request like create-portal-session does.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
