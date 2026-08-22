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
  originPostcode?: string;
  destinationPostcode?: string;
  /** ISO 3166-1 alpha-2. Defaults to GB, so existing callers are unaffected. */
  country?: string;
  /** Look a single postcode up rather than route between two. */
  geocodeOnly?: boolean;
  postcode?: string;
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

    // Defaults to GB so every existing caller keeps working unchanged.
    const SUPPORTED = ["GB", "US", "CA", "IE", "AU", "NZ"];
    const country = SUPPORTED.includes((body.country ?? "").toUpperCase())
      ? (body.country as string).toUpperCase()
      : "GB";

    // A lookup on its own, for checking a postcode as it is typed. Same
    // provider and same country scoping as routing uses, so "valid" keeps
    // meaning "the router will be able to place this".
    if (body.geocodeOnly) {
      const key = Deno.env.get("DENO_ORS_API_KEY");
      if (!body.postcode || !key) {
        return new Response(JSON.stringify({ found: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const hit = await geocode(body.postcode.trim().toUpperCase(), country, key);
      return new Response(
        JSON.stringify(
          hit ? { found: true, place: hit.place } : { found: false }
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      .select("id, origin_postcode, destination_postcode, distance_km, duration_minutes, polyline, last_used_at")
      // Country is part of the key. Postcode formats repeat across countries,
      // so a pair only identifies a journey alongside the country it is in.
      .eq("country", country)
      .eq("origin_postcode", origin)
      .eq("destination_postcode", destination)
      .maybeSingle();

    if (cacheError) {
      console.error("Cache lookup error:", cacheError);
    }

    if (cached) {
      console.log(`Cache hit: ${origin} → ${destination}`);

      // Record the use, so the nightly purge expires pairs nobody asks for any
      // more rather than pairs that merely happen to be old.
      //
      // At most once a day per pair: a single scheduling run looks up hundreds
      // of pairs, and a write on every hit would turn a read-only cache into a
      // write-heavy one to gain accuracy the purge does not need. A day's
      // resolution against a month's window is ample.
      const STAMP_AFTER_MS = 24 * 60 * 60 * 1000;
      const lastUsed = cached.last_used_at ? Date.parse(cached.last_used_at) : 0;

      if (!lastUsed || Date.now() - lastUsed > STAMP_AFTER_MS) {
        // Deliberately not awaited: the caller is waiting on a travel time,
        // and a slow or failed bookkeeping write must not delay or break that.
        supabase
          .from("route_cache")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", cached.id)
          .then(({ error }: { error: unknown }) => {
            if (error) console.error("last_used_at stamp failed:", error);
          });
      }

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

    const [originHit, destHit] = await Promise.all([
      geocode(origin, country, orsKey),
      geocode(destination, country, orsKey),
    ]);
    const originCoords = originHit?.coords ?? null;
    const destCoords = destHit?.coords ?? null;

    if (!originCoords || !destCoords) {
      const message = `Could not geocode one or both postcodes: ${origin}, ${destination}`;
      await logRoutingEvent(supabase, "routing_error", { origin, destination, stage: "geocode", message });
      throw new Error(message);
    }

    // ---- STEP 3: Call ORS routing API ----
    // Every call past this point hits the external ORS API (counts against
    // the 2,000 requests/day quota) — logged so usage can be tracked in the
    // admin Logs page.
    let routeResult;
    try {
      routeResult = await callOrsRouting(originCoords, destCoords, orsKey);
    } catch (orsErr) {
      const message = orsErr instanceof Error ? orsErr.message : String(orsErr);
      await logRoutingEvent(supabase, "routing_error", { origin, destination, stage: "ors", message });
      throw orsErr;
    }

    await logRoutingEvent(supabase, "route_generated_ors", {
      origin,
      destination,
      distance_km: routeResult.distance_km,
      duration_minutes: routeResult.duration_minutes,
    });

    // ---- STEP 4: Store in cache ----
    const cachePayload = {
      country,
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
        onConflict: "country, origin_postcode, destination_postcode",
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

// ── Record routing activity for the admin Logs page (service role, bypasses RLS) ──
async function logRoutingEvent(
  supabase: ReturnType<typeof createClient>,
  action: "route_generated_ors" | "routing_error",
  details: Record<string, unknown>
) {
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: null,
    target_user_id: null,
    action,
    details,
  });
  if (error) {
    console.error(`Failed to log "${action}":`, error);
  }
}

// ── Geocoding ───────────────────────────────────────────────────────────
//
// Two providers, chosen by country. The UK keeps postcodes.io: free, no key,
// no quota, and more accurate for UK postcodes than any general geocoder.
// Everywhere else uses ORS, which is global.
//
// Every lookup names its country. Asked as free text, a geocoder placed the
// Canadian postal code K1A 0B1 in Pike County, Kentucky -- a confident answer,
// a thousand miles wrong. In a tool that tells a carer where to drive, a wrong
// country has to be impossible to express rather than merely unlikely.

interface GeocodeResult {
  coords: [number, number];
  /** A human-readable place, shown back to confirm the right thing was found. */
  place: string | null;
}

async function geocodePostcodesIo(postcode: string): Promise<GeocodeResult | null> {
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
  return {
    coords: [data.result.longitude, data.result.latitude],
    place: data.result.admin_district ?? data.result.region ?? null,
  };
}

async function geocodeOrs(
  postcode: string,
  country: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  const url =
    `https://api.openrouteservice.org/geocode/search` +
    `?api_key=${encodeURIComponent(apiKey)}` +
    `&text=${encodeURIComponent(postcode)}` +
    // The country filter is the whole point. Without it the same query can
    // resolve to a similarly-shaped code on another continent.
    `&boundary.country=${encodeURIComponent(country)}` +
    `&size=1`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`ORS geocode failed for ${postcode} (${country}): ${res.status}`);
    return null;
  }

  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature?.geometry?.coordinates) {
    console.error(`No ORS geocode result for ${postcode} (${country})`);
    return null;
  }

  // Refuse an answer from the wrong country even when one comes back. The
  // filter should prevent it; this is what makes it a guarantee rather than a
  // parameter we hope was honoured.
  const got = feature.properties?.country_a;
  if (got && !sameCountry(got, country)) {
    console.error(`ORS returned ${got} for a ${country} lookup: ${postcode}`);
    return null;
  }

  const p = feature.properties ?? {};
  return {
    coords: feature.geometry.coordinates as [number, number],
    place: p.region ?? p.county ?? p.locality ?? p.label ?? null,
  };
}

/** ORS reports ISO 3166-1 alpha-3; our country codes are alpha-2. */
const ALPHA3: Record<string, string> = {
  GB: "GBR", US: "USA", CA: "CAN", IE: "IRL", AU: "AUS", NZ: "NZL",
};

function sameCountry(alpha3: string, alpha2: string): boolean {
  return ALPHA3[alpha2] === alpha3;
}

async function geocode(
  postcode: string,
  country: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  return country === "GB"
    ? await geocodePostcodesIo(postcode)
    : await geocodeOrs(postcode, country, apiKey);
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