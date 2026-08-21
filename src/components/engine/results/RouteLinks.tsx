"use client";

import {
  googleMapsUrl,
  appleMapsUrl,
  splitForGoogle,
  GOOGLE_MAX_WAYPOINTS,
  type NavRoute,
  type NavStop,
} from "@/lib/navigation/mapLinks";

interface RouteLinksProps {
  origin: NavStop | null;
  stops: NavStop[];
  destination: NavStop | null;
}

const linkClass =
  "inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-700";

/**
 * "Open this round in a maps app" links for one staff member's day.
 *
 * Google and Apple both take the whole route; Waze cannot, so it is offered
 * per stop on the individual visit rows rather than here.
 */
export default function RouteLinks({ origin, stops, destination }: RouteLinksProps) {
  // Legs are still loading, or there is nothing to navigate to.
  if (!origin || !destination || stops.length === 0) return null;

  const route: NavRoute = { origin, stops, destination };
  const parts = splitForGoogle(route);
  const isSplit = parts.length > 1;

  return (
    <div
      className="mt-2 border-t border-slate-700/60 pt-2"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-slate-400">
        Open route in
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {parts.map((part, i) => (
          <a
            key={`g-${i}`}
            href={googleMapsUrl(part)}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Google Maps{isSplit ? ` · part ${i + 1}/${parts.length}` : ""}
          </a>
        ))}

        <a
          href={appleMapsUrl(route)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Apple Maps
        </a>
      </div>

      {isSplit && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
          Google Maps allows {GOOGLE_MAX_WAYPOINTS} stops per link, so this
          round is split into {parts.length} parts. Each part starts where the
          previous one ended — drive them in order.
        </p>
      )}

      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
        Waze has no multi-stop link, so use the Waze button on each stop to
        navigate one at a time.
      </p>
    </div>
  );
}
