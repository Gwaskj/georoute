// supabase/functions/create-portal-session/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Global CORS headers used for ALL responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // --- Handle CORS preflight ---
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase client (service role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Stripe client
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    // Lookup Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Stripe customer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: Deno.env.get("SITE_URL") || "http://localhost:3000",
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Billing portal error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error", details: `${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
