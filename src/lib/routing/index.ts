// src/lib/routing/index.ts
// Client-side service for calling the route-optimizer Edge Function
// which handles ORS API calls with Supabase caching.

import { supabase } from "@/lib/supabase/client";

export interface RouteResult {
  distance_km: number;
  duration_minutes: number;
  polyline: GeoJSON.LineString | null;
  cached: boolean;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Reasons the last failed lookup for a given postcode pair failed, e.g. a bad
 * postcode the Edge Function couldn't geocode. Keyed by "ORIGIN → DEST".
 * Lets callers show an actionable error instead of a generic one.
 */
const lastRouteErrors = new Map<string, string>();

export function getRouteErrors(): Map<string, string> {
  return lastRouteErrors;
}

/**
 * Get routing data between two postcodes.
 * Uses the Supabase Edge Function which checks the route_cache table first.
 */
export async function getRoute(
  originPostcode: string,
  destinationPostcode: string
): Promise<RouteResult | null> {
  const origin = originPostcode.trim().toUpperCase();
  const destination = destinationPostcode.trim().toUpperCase();

  if (!origin || !destination) return null;

  // If same postcode, no travel needed
  if (origin === destination) {
    return {
      distance_km: 0,
      duration_minutes: 0,
      polyline: null,
      cached: false,
    };
  }

  const pairKey = `${origin} → ${destination}`;

  try {
    const { data, error } = await supabase.functions.invoke("route-optimizer", {
      body: { originPostcode: origin, destinationPostcode: destination },
    });

    if (error) {
      let message = error.message;
      try {
        const body = await (error as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch {
        // context wasn't JSON — fall back to error.message
      }
      lastRouteErrors.set(pairKey, message ?? "Unknown routing error");
      return null;
    }

    lastRouteErrors.delete(pairKey);
    return {
      distance_km: data.distance_km,
      duration_minutes: data.duration_minutes,
      polyline: data.polyline ?? null,
      cached: data.cached ?? false,
    };
  } catch (err) {
    lastRouteErrors.set(
      pairKey,
      err instanceof Error ? err.message : "Network error"
    );
    return null;
  }
}

/**
 * Internal in-memory route cache so the scheduler doesn't make
 * repeated calls for the same postcode pair during a single run.
 */
const localRouteCache = new Map<string, RouteResult>();

export function clearLocalCache() {
  localRouteCache.clear();
  lastRouteErrors.clear();
}

function cacheKey(from: string, to: string): string {
  return `${from}→${to}`;
}

/**
 * Get route with local in-memory caching on top of Supabase caching.
 * Returns null if the routing service is unavailable.
 */
export async function getRouteBatched(
  originPostcode: string,
  destinationPostcode: string
): Promise<RouteResult | null> {
  const origin = originPostcode.trim().toUpperCase();
  const destination = destinationPostcode.trim().toUpperCase();
  const key = cacheKey(origin, destination);

  // Check local cache first
  const local = localRouteCache.get(key);
  if (local) return local;

  const result = await getRoute(origin, destination);
  if (!result) return null;

  localRouteCache.set(key, result);
  return result;
}