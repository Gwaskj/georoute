import { useEffect, useRef, useState } from "react";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { getStaffOriginPostcode } from "@/lib/scheduler/staffOrigin";
import { geocodePostcodes } from "@/lib/geocode";
import { getRouteBatched } from "@/lib/routing";

/** Sentinel passed as a "selectedVisitId" to mean: show the final leg
 *  returning from the last appointment back to home/office, rather than a
 *  leg arriving at a real appointment. */
export const RETURN_TO_BASE_ID = "__return-to-base__";

export interface StaffLeg {
  id: string;
  legIndex: number;
  fromVisitId: string | null;
  toVisitId: string | null;
  fromLabel: string;
  toLabel: string;
  fromPostcode: string;
  toPostcode: string;
  points: [number, number][];
  travelMinutes: number | null;
  distanceMiles: number | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
}

const KM_TO_MILES = 0.621371;

export function useStaffLegSchedule(
  staffId: string | null,
  visits: ScheduledVisit[],
  staffList: Staff[],
  officePostcode: string | null
): { legs: StaffLeg[]; loading: boolean } {
  const [legs, setLegs] = useState<StaffLeg[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!staffId) {
      setLegs([]);
      setLoading(false);
      return;
    }

    const staffMember = staffList.find((s) => s.id === staffId);
    const staffVisits = visits
      .filter((v) => v.staffId === staffId)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (!staffMember || staffVisits.length === 0) {
      setLegs([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const originPostcode = getStaffOriginPostcode(staffMember, officePostcode).toUpperCase();
    const originLabel = staffMember.startLocation === "home" ? "Home" : "Office";

    type Stop = { visitId: string | null; postcode: string; label: string };
    const originStop: Stop = { visitId: null, postcode: originPostcode, label: originLabel };
    const sequence: Stop[] = [
      originStop,
      ...staffVisits.map((v) => ({
        visitId: v.id,
        postcode: v.postcode.toUpperCase(),
        label: v.clientName,
      })),
      originStop,
    ];

    const uniquePostcodes = [...new Set(sequence.map((s) => s.postcode).filter(Boolean))];

    geocodePostcodes(uniquePostcodes).then(async (geoMap) => {
      if (requestId !== requestIdRef.current) return;

      const legResults = await Promise.all(
        sequence.slice(0, -1).map(async (from, i) => {
          const to = sequence[i + 1];
          const fromGeo = geoMap.get(from.postcode);
          const toGeo = geoMap.get(to.postcode);
          const straightLine: [number, number][] = [];
          if (fromGeo) straightLine.push([fromGeo.lat, fromGeo.lng]);
          if (toGeo) straightLine.push([toGeo.lat, toGeo.lng]);

          if (!from.postcode || !to.postcode || from.postcode === to.postcode) {
            return {
              from,
              to,
              points: straightLine,
              travelMinutes: 0,
              distanceMiles: 0,
            };
          }

          const route = await getRouteBatched(from.postcode, to.postcode);
          if (!route) {
            return {
              from,
              to,
              points: straightLine,
              travelMinutes: null,
              distanceMiles: null,
            };
          }

          let points = straightLine;
          const coords = (route.polyline as any)?.coordinates;
          if (Array.isArray(coords)) {
            points = coords.map(([lng, lat]: number[]) => [lat, lng]);
          }

          return {
            from,
            to,
            points,
            travelMinutes: Math.round(route.duration_minutes),
            distanceMiles: Math.round(route.distance_km * KM_TO_MILES * 10) / 10,
          };
        })
      );

      if (requestId !== requestIdRef.current) return;

      const visitById = new Map(staffVisits.map((v) => [v.id, v]));

      // First pass: departure/arrival times anchored to known visit start/end times.
      const partial = legResults.map((leg, i) => {
        const fromVisit = leg.from.visitId ? visitById.get(leg.from.visitId) : undefined;
        const toVisit = leg.to.visitId ? visitById.get(leg.to.visitId) : undefined;
        return {
          ...leg,
          legIndex: i,
          departureTime: fromVisit ? new Date(fromVisit.end) : (null as Date | null),
          arrivalTime: toVisit ? new Date(toVisit.start) : (null as Date | null),
        };
      });

      // Second pass: fill in the two bookend legs (leaving origin, returning to origin)
      // by deriving the missing timestamp from the known one + measured travel time.
      if (partial.length > 0) {
        const first = partial[0];
        if (first.departureTime === null && first.arrivalTime && first.travelMinutes !== null) {
          first.departureTime = new Date(first.arrivalTime.getTime() - first.travelMinutes * 60000);
        }
        const last = partial[partial.length - 1];
        if (last.arrivalTime === null && last.departureTime && last.travelMinutes !== null) {
          last.arrivalTime = new Date(last.departureTime.getTime() + last.travelMinutes * 60000);
        }
      }

      const enriched: StaffLeg[] = partial.map((leg) => ({
        id: `${staffId}-leg-${leg.legIndex}`,
        legIndex: leg.legIndex,
        fromVisitId: leg.from.visitId,
        toVisitId: leg.to.visitId,
        fromLabel: leg.from.label,
        toLabel: leg.to.label,
        fromPostcode: leg.from.postcode,
        toPostcode: leg.to.postcode,
        points: leg.points,
        travelMinutes: leg.travelMinutes,
        distanceMiles: leg.distanceMiles,
        departureTime: leg.departureTime,
        arrivalTime: leg.arrivalTime,
      }));

      setLegs(enriched);
      setLoading(false);
    });
  }, [staffId, visits, staffList, officePostcode]);

  return { legs, loading };
}
