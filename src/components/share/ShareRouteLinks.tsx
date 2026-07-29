"use client";

import { SharedSchedulePayload } from "@/lib/share/types";
import RouteLinks from "@/components/engine/results/RouteLinks";

/**
 * Navigation links on the shared page. Reuses the same builder as the app so
 * the stop limits, splitting and Waze handling cannot drift between the two.
 */
export default function ShareRouteLinks({
  payload,
}: {
  payload: SharedSchedulePayload;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <RouteLinks
        origin={{
          label: payload.originLabel,
          postcode: payload.originPostcode,
        }}
        stops={payload.stops
          .filter((s) => s.postcode)
          .map((s) => ({ label: s.clientName, postcode: s.postcode }))}
        destination={{
          label: payload.destinationLabel,
          postcode: payload.destinationPostcode,
        }}
      />
    </div>
  );
}
