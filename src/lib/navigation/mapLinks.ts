// Deep links that open a generated round in a phone's navigation app.
//
// Support is not equal across apps, and the difference is not something we can
// paper over:
//
//   Google Maps  full multi-stop, but a documented maximum of 9 waypoints
//   Apple Maps   multi-stop via "to:" chaining, no published limit
//   Waze         SINGLE DESTINATION ONLY -- no public multi-stop URL scheme
//
// So Waze is offered as a per-stop "navigate to this one" link rather than a
// whole-route link. Pretending otherwise would produce a link that silently
// drops every stop but one.

/** Google's documented ceiling for the `waypoints` parameter. */
export const GOOGLE_MAX_WAYPOINTS = 9;

export interface NavStop {
  /** Shown in the UI, not sent to the map app. */
  label: string;
  postcode: string;
}

export interface NavRoute {
  origin: NavStop;
  stops: NavStop[];
  destination: NavStop;
}

/**
 * UK postcodes are ambiguous worldwide -- "BS1 4DJ" style codes can collide
 * with place names abroad, and the map apps geocode the raw string we hand
 * them. Anchoring to the UK avoids sending someone to the wrong continent.
 */
function place(stop: NavStop): string {
  const trimmed = stop.postcode.trim();
  return trimmed.toUpperCase().endsWith("UK") ? trimmed : `${trimmed}, UK`;
}

export function googleMapsUrl(route: NavRoute): string {
  const params = new URLSearchParams({
    api: "1",
    origin: place(route.origin),
    destination: place(route.destination),
    travelmode: "driving",
  });

  if (route.stops.length > 0) {
    // URLSearchParams percent-encodes the "|" separator, which Google accepts.
    params.set("waypoints", route.stops.map(place).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsUrl(route: NavRoute): string {
  // Apple chains multiple stops onto daddr with "+to:" rather than a separate
  // waypoints parameter.
  const daddr = [...route.stops, route.destination]
    .map((s) => encodeURIComponent(place(s)))
    .join("+to:");

  return `https://maps.apple.com/?saddr=${encodeURIComponent(
    place(route.origin)
  )}&daddr=${daddr}&dirflg=d`;
}

/** Waze takes one destination. Callers render one of these per stop. */
export function wazeUrl(stop: NavStop): string {
  return `https://waze.com/ul?q=${encodeURIComponent(place(stop))}&navigate=yes`;
}

/** Generic geo: URI, which Android offers to any installed navigation app. */
export function geoUrl(stop: NavStop): string {
  return `geo:0,0?q=${encodeURIComponent(place(stop))}`;
}

/**
 * Split a round into parts that fit Google's waypoint limit.
 *
 * Each part ends where the next begins, so following them in order drives the
 * same route as the original -- no stop is dropped and none is visited twice.
 * A round short enough to fit returns a single part.
 */
export function splitForGoogle(
  route: NavRoute,
  maxWaypoints: number = GOOGLE_MAX_WAYPOINTS
): NavRoute[] {
  if (route.stops.length <= maxWaypoints) return [route];

  const parts: NavRoute[] = [];
  // Full ordered list of points, origin and destination included.
  const all = [route.origin, ...route.stops, route.destination];

  // Each part consumes maxWaypoints intermediate stops, then hands over at the
  // stop it finished on -- hence the +1 step and the overlap on that boundary.
  let i = 0;
  while (i < all.length - 1) {
    const end = Math.min(i + maxWaypoints + 1, all.length - 1);
    parts.push({
      origin: all[i],
      stops: all.slice(i + 1, end),
      destination: all[end],
    });
    i = end;
  }

  return parts;
}
