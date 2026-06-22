// @ts-nocheck
// Edge Function: route-optimizer
// Checks route_cache first, then calls ORS API if needed.
// ORS API key should be set as: DENO_ORS_API_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RouteRequest {
  originPostcode: string;
  destinationPostcode: string;
}

interface CacheEntry {
  id: number;
  origin_postcode: string;
  destination_postcode: string;
  distance_km: number;
  duration_minutes: number;
  polyline: unknown;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body: RouteRequest = await req.json();

    if (!body.originPostcode || !body.destinationPostcode) {
      return new Response(
        JSON.stringify({ error: "originPostcode and destinationPostcode are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const origin = body.originPostcode.trim().toUpperCase();
    const destination = body.destinationPostcode.trim().toUpperCase();

    // Skip if same postcode
    if (origin === destination) {
      return new Response(
        JSON.stringify({
          distance_km: 0,
          duration_minutes: 0,
          polyline: null,
          cached: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for cache access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- STEP 1: Check cache ----
    const { data: cached, error: cacheError } = await supabase
      .from("route_cache")
      .select("id, origin_postcode, destination_postcode, distance_km, duration_minutes, polyline")
      .eq("origin_postcode", origin)
      .eq("destination_postcode", destination)
      .maybeSingle();

    if (cacheError) {
      console.error("Cache lookup error:", cacheError);
    }

    if (cached) {
      console.log(`Cache hit: ${origin} → ${destination}`);
      return new Response(
        JSON.stringify({
          distance_km: cached.distance_km,
          duration_minutes: cached.duration_minutes,
          polyline: cached.polyline,
          cached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cache miss: ${origin} → ${destination}, calling ORS...`);

    // ---- STEP 2: Geocode postcodes to coordinates using postcodes.io ----
    const orsKey = Deno.env.get("DENO_ORS_API_KEY");
    if (!orsKey) {
      throw new Error("ORS API key not configured (DENO_ORS_API_KEY)");
    }

    const [originCoords, destCoords] = await Promise.all([
      geocodePostcode(origin),
      geocodePostcode(destination),
    ]);

    if (!originCoords || !destCoords) {
      throw new Error(`Could not geocode one or both postcodes: ${origin}, ${destination}`);
    }

    // ---- STEP 3: Call ORS routing API ----
    const routeResult = await callOrsRouting(originCoords, destCoords, orsKey);

    // ---- STEP 4: Store in cache ----
    const cachePayload = {
      origin_postcode: origin,
      destination_postcode: destination,
      distance_km: routeResult.distance_km,
      duration_minutes: routeResult.duration_minutes,
      polyline: routeResult.polyline,
      raw_response: routeResult.raw_response,
    };

    // Upsert: insert or update if pair exists (shouldn't due to our check, but safe)
    const { error: upsertError } = await supabase
      .from("route_cache")
      .upsert(cachePayload, {
        onConflict: "origin_postcode, destination_postcode",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Cache upsert error:", upsertError);
    }

    // ---- STEP 5: Return result ----
    return new Response(
      JSON.stringify({
        distance_km: routeResult.distance_km,
        duration_minutes: routeResult.duration_minutes,
        polyline: routeResult.polyline,
        cached: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const error = err as Error;
    console.error("route-optimizer error:", error.message);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Geocode a UK postcode to [lng, lat] using postcodes.io ──
async function geocodePostcode(postcode: string): Promise<[number, number] | null> {
  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Geocode failed for ${postcode}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  if (!data?.result) {
    console.error(`No geocode result for ${postcode}`);
    return null;
  }

  // postcodes.io returns { latitude, longitude }; ORS needs [lng, lat]
  return [data.result.longitude, data.result.latitude] as [number, number];
}

// ── Call ORS directions API ──
async function callOrsRouting(
  origin: [number, number],
  destination: [number, number],
  apiKey: string
): Promise<{
  distance_km: number;
  duration_minutes: number;
  polyline: unknown;
  raw_response: unknown;
}> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/geo+json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({ coordinates: [origin, destination] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ORS routing error (${res.status}): ${text}`);
  }

  const data = await res.json();

  const feature = data?.features?.[0];
  if (!feature) {
    throw new Error("ORS returned no route");
  }

  const summary = feature.properties?.summary;
  const distanceKm = summary.distance / 1000;   // ORS returns meters
  const durationMinutes = summary.duration / 60; // ORS returns seconds

  // GeoJSON LineString geometry with [lng, lat] coordinates
  const polyline = feature.geometry ?? null;

  const raw_response = { summary };

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    duration_minutes: Math.round(durationMinutes * 100) / 100,
    polyline,
    raw_response,
  };
}