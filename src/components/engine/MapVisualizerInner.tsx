"use client";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapVisualizer.module.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";
import { applyStaffColors } from "@/lib/map/staffColorMap";
import { loadFreeSchedulerData } from "@/lib/freeSession";
import { useUserTier } from "@/lib/hooks/useUserTier";
import { geocodePostcodes } from "@/lib/geocode";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { useSettingsStore } from "@/store/settingsStore";
import { LEG_COLORS } from "@/lib/map/legColors";
import { buildPinIcon } from "@/lib/map/pinIcons";
import { StaffLeg } from "@/lib/map/useStaffLegSchedule";
import { getStaffOriginPostcode } from "@/lib/scheduler/staffOrigin";

import L from "leaflet";

const GLOBAL_PIN_COLOR = "#2563eb";
const ORIGIN_PIN_COLOR = "#1e293b";

function fmtTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const iconUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconShadow =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

// ─── Types ────────────────────────────────────────────────────────────────────

// One leg = a single travel segment between two consecutive stops.
// office departure has fromVisitId=null; office return has toVisitId=null.
type RouteLeg = {
  id: string;
  staffId: string;
  color: string;
  points: [number, number][];
  fromVisitId: string | null;
  toVisitId: string | null;
  fromPostcode: string;
  toPostcode: string;
  legIndex: number;
};

type AppointmentMarker = {
  id: string;
  staffId: string;
  lat: number;
  lng: number;
  clientName: string;
  postcode: string;
  address?: string;
  time: string;
  staffName: string;
  windowName?: string;
  color: string;
  durationMins: number;
  coStaff: string[];
  /** 1-based position in that staff member's day, used as the pin badge. */
  seq: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePoints(raw: any[]): [number, number][] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p: any) => {
      if (!p) return null;
      const lat = p.lat ?? p.latitude ?? p.y ?? null;
      const lng = p.lng ?? p.lon ?? p.longitude ?? p.x ?? null;
      if (lat == null || lng == null) return null;
      return [lat, lng] as [number, number];
    })
    .filter(Boolean) as [number, number][];
}

// ─── Map sub-components ───────────────────────────────────────────────────────

function MapInitializer({ zoom }: { zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if ((map as any)._initialized) return;
    (map as any)._initialized = true;
    map.setView([53.0, -2.2], zoom);
    map.zoomControl.remove();
    if (!(map as any)._tileLayer) {
      const tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors" }
      );
      tileLayer.addTo(map);
      (map as any)._tileLayer = tileLayer;
    }
  }, [map, zoom]);
  return null;
}

function StableMapWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ref.current && !ready) setReady(true);
  }, [ref.current, ready]);
  return (
    <div ref={ref} className={styles.wrapper}>
      {ready && children}
    </div>
  );
}

// Handles map camera: zooms to selected visit's surrounding legs,
// or fits all legs for the selected staff member.
function FocusManager({
  selectedStaffId,
  selectedVisitId,
  legs,
  markers,
  officeGeo,
}: {
  selectedStaffId?: string | null;
  selectedVisitId?: string | null;
  legs: RouteLeg[];
  markers: AppointmentMarker[];
  officeGeo: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  // Reset flag when schedule is cleared so a fresh generate re-fits
  useEffect(() => {
    if (legs.length === 0) hasInitialFit.current = false;
  }, [legs.length]);

  // Initial overview: fit everything into view once legs first populate
  useEffect(() => {
    if (hasInitialFit.current) return;
    if (selectedStaffId || selectedVisitId) return;
    if (legs.length === 0) return;

    const pts = [] as ReturnType<typeof L.latLng>[];
    legs.forEach((l) => l.points.forEach((p) => pts.push(L.latLng(p[0], p[1]))));
    markers.forEach((m) => pts.push(L.latLng(m.lat, m.lng)));
    if (officeGeo) pts.push(L.latLng(officeGeo.lat, officeGeo.lng));

    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });
      hasInitialFit.current = true;
    }
  }, [legs, markers, officeGeo, selectedStaffId, selectedVisitId, map]);

  // Selection focus: visit or staff
  useEffect(() => {
    if (selectedVisitId) {
      const surroundingLegs = legs.filter(
        (l) => l.toVisitId === selectedVisitId || l.fromVisitId === selectedVisitId
      );
      const pts = surroundingLegs.flatMap((l) =>
        l.points.map((p) => L.latLng(p[0], p[1]))
      );
      const marker = markers.find((m) => m.id === selectedVisitId);
      if (marker) pts.push(L.latLng(marker.lat, marker.lng));
      if (pts.length > 0)
        map.fitBounds(L.latLngBounds(pts), { padding: [60, 60] });
      return;
    }

    if (selectedStaffId) {
      const staffLegs = legs.filter(
        (l) => l.staffId === selectedStaffId && l.points.length > 0
      );
      const pts = staffLegs.flatMap((l) =>
        l.points.map((p) => L.latLng(p[0], p[1]))
      );
      if (pts.length > 0)
        map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    }
  }, [selectedStaffId, selectedVisitId, legs, markers, map]);

  return null;
}

// Shared rich popup body for a single appointment marker.
function AppointmentPopup({ a }: { a: AppointmentMarker }) {
  return (
    <Popup>
      <div style={{ fontSize: 12, lineHeight: 1.6, minWidth: 160 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
          {a.clientName}
        </div>
        {a.windowName && (
          <div style={{ color: "#2563eb", fontWeight: 600, marginBottom: 3 }}>
            {a.windowName}
          </div>
        )}
        {a.address && <div style={{ color: "#475569" }}>{a.address}</div>}
        <div style={{ color: "#475569" }}>{a.postcode}</div>
        <div style={{ color: "#475569" }}>
          {a.time} · {a.durationMins} min
        </div>
        <div
          style={{
            marginTop: 5,
            borderTop: "1px solid #e2e8f0",
            paddingTop: 4,
            color: "#64748b",
          }}
        >
          <span style={{ fontWeight: 600 }}>Staff:</span> {a.staffName}
        </div>
        {a.coStaff.length > 0 && (
          <div style={{ color: "#64748b" }}>
            <span style={{ fontWeight: 600 }}>Also:</span> {a.coStaff.join(", ")}
          </div>
        )}
      </div>
    </Popup>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MapVisualizerInner({
  zoom = 12,
  showRoutes = true,
  showAppointments = true,
  selectedStaffId,
  selectedVisitId,
  scheduledVisits,
  staffList,
  staffLegSchedule,
  legScheduleLoading,
}: {
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean; // kept for API compat
  selectedStaffId?: string | null;
  selectedVisitId?: string | null;
  scheduledVisits?: ScheduledVisit[];
  staffList?: Staff[];
  staffLegSchedule?: StaffLeg[];
  legScheduleLoading?: boolean;
}) {
  const isFree = useUserTier();

  const highlightedAppointmentId = useHighlightStore(
    (s) => s.highlightedAppointmentId
  );
  const setHighlightedAppointment = useHighlightStore(
    (s) => s.setHighlightedAppointment
  );
  const highlightedRouteId = useHighlightStore((s) => s.highlightedRouteId);
  const setHighlightedRoute = useHighlightStore((s) => s.setHighlightedRoute);

  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [appointments, setAppointments] = useState<AppointmentMarker[]>([]);
  const [officeGeo, setOfficeGeo] = useState<{ lat: number; lng: number } | null>(null);

  const geoMapRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const baseLegsRef = useRef<RouteLeg[]>([]);

  const [mapKey] = useState(() => crypto.randomUUID());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const officePost = useSettingsStore((s) => s.settings.officePostcode);

  // ── EFFECT 1: geocode postcodes → markers + straight-line legs ──────────────
  useEffect(() => {
    if (scheduledVisits === undefined) return;

    if (scheduledVisits.length === 0) {
      setAppointments([]);
      setLegs([]);
      baseLegsRef.current = [];
      return;
    }

    const allPostcodes = [
      ...new Set([
        ...scheduledVisits.map((v) => v.postcode).filter(Boolean),
        ...(officePost ? [officePost] : []),
        ...(staffList ?? []).map((s) => s.homePostcode).filter(Boolean),
        ...(staffList ?? []).map((s) => s.officePostcode).filter(Boolean),
      ]),
    ];

    geocodePostcodes(allPostcodes).then((geoMap) => {
      geoMapRef.current = geoMap;
      setOfficeGeo(officePost ? (geoMap.get(officePost.toUpperCase()) ?? null) : null);

      const fmt = (iso: string) =>
        new Date(iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

      // ── Build per-staff visit order so each visit knows its leg-index ──
      const visitDayIndex = new Map<string, number>(); // visitId → 0-based index in staff's day
      {
        const staffGroups = new Map<string, ScheduledVisit[]>();
        for (const v of scheduledVisits) {
          if (!staffGroups.has(v.staffId)) staffGroups.set(v.staffId, []);
          staffGroups.get(v.staffId)!.push(v);
        }
        for (const group of staffGroups.values()) {
          group
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
            .forEach((v, i) => visitDayIndex.set(v.id, i));
        }
      }

      // ── Markers: one per visit ──
      // Deliberately NOT offsetting markers that share a postcode: route
      // polylines (built independently in useStaffLegSchedule) always
      // terminate at the exact geocoded point, so any offset here would make
      // pins visibly disconnect from the lines that lead to them.
      const markers: AppointmentMarker[] = scheduledVisits.map((v) => {
        const pc = v.postcode.toUpperCase();
        const geo = geoMap.get(pc);
        const durationMins = Math.round(
          (new Date(v.end).getTime() - new Date(v.start).getTime()) / 60000
        );
        const coStaff = scheduledVisits
          .filter(
            (o) => o.appointmentId === v.appointmentId && o.staffId !== v.staffId
          )
          .map((o) => o.staffName);
        // Color matches the incoming leg (leg index = visit's day position)
        const legIdx = visitDayIndex.get(v.id) ?? 0;
        const color = LEG_COLORS[legIdx % LEG_COLORS.length];

        return {
          id: v.id,
          staffId: v.staffId,
          lat: geo?.lat ?? 53.0,
          lng: geo?.lng ?? -2.2,
          clientName: v.clientName,
          postcode: v.postcode,
          address: v.address,
          time: `${fmt(v.start)}–${fmt(v.end)}`,
          staffName: v.staffName,
          windowName: v.windowName,
          color,
          durationMins,
          coStaff,
          seq: legIdx + 1,
        };
      });

      // ── Legs: home → v1 → v2 → ... → vN → home (per staff) ──
      const sorted = [...scheduledVisits].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
      const staffIds = [...new Set(sorted.map((v) => v.staffId))];

      const newLegs: RouteLeg[] = [];

      for (const staffId of staffIds) {
        const staffVisits = sorted.filter((v) => v.staffId === staffId);
        const staffMember = staffList?.find((s) => s.id === staffId);

        type SeqStop = {
          visitId: string | null;
          postcode: string;
          geo: { lat: number; lng: number } | null;
        };

        const homePost = staffMember?.homePostcode?.toUpperCase() || officePost?.toUpperCase() || "";
        const homeGeo = homePost ? (geoMap.get(homePost) ?? null) : null;

        const homeStop: SeqStop = {
          visitId: null,
          postcode: homePost,
          geo: homeGeo,
        };

        const sequence: SeqStop[] = [
          homeStop,
          ...staffVisits.map((v) => ({
            visitId: v.id,
            postcode: v.postcode,
            geo: geoMap.get(v.postcode.toUpperCase()) ?? null,
          })),
          homeStop,
        ];

        for (let i = 0; i < sequence.length - 1; i++) {
          const from = sequence[i];
          const to = sequence[i + 1];
          const points: [number, number][] = [];
          if (from.geo) points.push([from.geo.lat, from.geo.lng]);
          if (to.geo) points.push([to.geo.lat, to.geo.lng]);

          newLegs.push({
            id: `${staffId}-leg-${i}`,
            staffId,
            color: LEG_COLORS[i % LEG_COLORS.length],
            points,
            fromVisitId: from.visitId,
            toVisitId: to.visitId,
            fromPostcode: from.postcode,
            toPostcode: to.postcode,
            legIndex: i,
          });
        }
      }

      baseLegsRef.current = newLegs;
      setAppointments(markers);
      setLegs(newLegs);
    });
  }, [scheduledVisits, staffList, officePost]);

  // ── EFFECT 2: legacy loading (when scheduledVisits not provided) ─────────────
  useEffect(() => {
    if (scheduledVisits !== undefined) return;

    async function loadFree() {
      const data = await loadFreeSchedulerData();
      const freeRoutesRaw = data?.routes ?? [];
      const freeAppointmentsRaw = data?.appointments ?? [];

      const normalizedRoutes = (freeRoutesRaw ?? []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id ?? null,
        points: normalizePoints(r.points ?? []),
      }));
      const colored = applyStaffColors(normalizedRoutes);

      // Convert legacy routes to single-leg format
      const legacyLegs: RouteLeg[] = colored.map((r: any) => ({
        id: r.id,
        staffId: r.staff_id ?? r.id,
        color: r.color,
        points: r.points,
        fromVisitId: null,
        toVisitId: null,
        fromPostcode: "",
        toPostcode: "",
        legIndex: 0,
      }));

      const legacyMarkers: AppointmentMarker[] = (freeAppointmentsRaw ?? []).map(
        (a: any) => ({
          id: a.id,
          staffId: a.staffId ?? "",
          lat: a.lat ?? 53.0,
          lng: a.lng ?? -2.2,
          clientName: a.clientName ?? a.label ?? "Appointment",
          postcode: a.postcode ?? "",
          time: a.time ?? "",
          staffName: a.staffName ?? "",
          color: a.color ?? "#d00000",
          durationMins: 0,
          coStaff: [],
          seq: 0,
        })
      );

      setLegs(legacyLegs);
      setAppointments(legacyMarkers);
    }

    async function loadPro() {
      async function loadRoutes() {
        const { data } = await supabase.from("routes").select("*");
        const normalized = (data ?? []).map((r: any) => ({
          id: r.id,
          staff_id: r.staff_id ?? null,
          points: normalizePoints(r.points ?? []),
        }));
        const colored = applyStaffColors(normalized);
        const legacyLegs: RouteLeg[] = colored.map((r: any) => ({
          id: r.id,
          staffId: r.staff_id ?? r.id,
          color: r.color,
          points: r.points,
          fromVisitId: null,
          toVisitId: null,
          fromPostcode: "",
          toPostcode: "",
          legIndex: 0,
        }));
        setLegs(legacyLegs);
      }

      async function loadAppointments() {
        const { data } = await supabase.from("appointments").select("*");
        setAppointments(
          (data ?? []).map((a: any) => ({
            id: a.id,
            staffId: a.staffId ?? "",
            lat: a.lat ?? 53.0,
            lng: a.lon ?? -2.2,
            clientName: a.clientName ?? a.name ?? "Appointment",
            postcode: a.postcode ?? "",
            time: a.time ?? "",
            staffName: a.staffName ?? "",
            color: a.color ?? "#d00000",
            durationMins: 0,
            coStaff: [],
            seq: 0,
          }))
        );
      }

      await Promise.all([loadRoutes(), loadAppointments()]);

      if (!channelRef.current) {
        channelRef.current = supabase
          .channel("map-updates")
          .on("postgres_changes", { event: "*", schema: "public", table: "routes" }, () => loadRoutes())
          .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => loadAppointments())
          .subscribe();
      }
    }

    if (isFree) {
      loadFree();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    } else {
      loadPro();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isFree]);

  // ── View mode ─────────────────────────────────────────────────────────────
  // "legacy" → scheduledVisits not supplied (live-tracking admin pages): keep
  //   the old always-show-everything behaviour, untouched.
  // "global" → results page, nothing selected: pins only, no routes.
  // "staff"  → results page, a staff member selected: their legs + pins.
  // "visit"  → results page, one appointment selected: 2 legs + 3 pins.
  const isResultsMode = scheduledVisits !== undefined;
  const viewMode: "legacy" | "global" | "staff" | "visit" = !isResultsMode
    ? "legacy"
    : selectedVisitId
    ? "visit"
    : selectedStaffId
    ? "staff"
    : "global";

  const coloredStaffLegs = useMemo(
    () =>
      (staffLegSchedule ?? []).map((l) => ({
        ...l,
        color: LEG_COLORS[l.legIndex % LEG_COLORS.length],
      })),
    [staffLegSchedule]
  );

  const renderLegs = useMemo(() => {
    if (!showRoutes) return [];
    if (viewMode === "legacy") return legs;
    if (viewMode === "global") return [];
    if (viewMode === "visit") {
      return coloredStaffLegs.filter(
        (l) => l.toVisitId === selectedVisitId || l.fromVisitId === selectedVisitId
      );
    }
    return coloredStaffLegs; // staff mode
  }, [legs, coloredStaffLegs, viewMode, selectedVisitId, showRoutes]);

  // One pin per unique appointment postcode, with a count badge when more
  // than one appointment shares that location — keeps the no-selection
  // overview readable instead of a wall of overlapping dots/routes.
  const globalLocationGroups = useMemo(() => {
    if (viewMode !== "global" || !scheduledVisits) return [];
    const map = new Map<string, { lat: number; lng: number; visits: ScheduledVisit[] }>();
    for (const v of scheduledVisits) {
      const pc = v.postcode.toUpperCase();
      const geo = geoMapRef.current.get(pc);
      if (!geo) continue;
      if (!map.has(pc)) map.set(pc, { lat: geo.lat, lng: geo.lng, visits: [] });
      map.get(pc)!.visits.push(v);
    }
    return [...map.entries()].map(([postcode, g]) => ({ postcode, ...g }));
  }, [viewMode, scheduledVisits, legs]);

  // Distinct pin for the selected staff member's actual day start/end point.
  // The always-on "Office" pin only ever marks the *global* settings office
  // postcode — but a staff member can have their own office-postcode
  // override, or be set to start from home, in which case their real origin
  // is somewhere else entirely. Without this, the route line would correctly
  // terminate at their real origin while no pin there reflected it. Skipped
  // only when the resolved origin is the same spot as the global office pin
  // (already shown), to avoid drawing two pins on top of each other.
  const originPinGeo = useMemo(() => {
    if (viewMode !== "staff" && viewMode !== "visit") return null;
    if (!selectedStaffId) return null;
    const staffMember = staffList?.find((s) => s.id === selectedStaffId);
    if (!staffMember) return null;
    const originPost = getStaffOriginPostcode(staffMember, officePost).toUpperCase();
    if (!originPost) return null;
    if (originPost === officePost?.toUpperCase()) return null;
    const geo = geoMapRef.current.get(originPost);
    if (!geo) return null;
    const isHome = staffMember.startLocation === "home";
    return {
      ...geo,
      postcode: originPost,
      label: isHome ? "Home" : "Office",
      glyph: isHome ? "H" : "O",
    };
  }, [viewMode, selectedStaffId, staffList, officePost, legs]);

  type BookendStop = {
    key: string;
    lat: number;
    lng: number;
    color: string;
    highlighted?: boolean;
    tooltipLabel?: string;
    marker?: AppointmentMarker;
    plainLabel?: string;
  };

  // For the visit view: previous stop ("Start"), the selected appointment,
  // and next stop ("End") — every other pin for this staff is hidden.
  const bookendStops = useMemo<BookendStop[]>(() => {
    if (viewMode !== "visit" || !selectedVisitId) return [];

    const resolveEndpoint = (
      visitId: string | null,
      postcode: string,
      label: string
    ): { lat: number; lng: number; color: string; marker?: AppointmentMarker; plainLabel?: string } => {
      if (visitId) {
        const m = appointments.find((a) => a.id === visitId);
        if (m) return { lat: m.lat, lng: m.lng, color: m.color, marker: m };
      }
      const geo = geoMapRef.current.get(postcode.toUpperCase());
      return {
        lat: geo?.lat ?? 53.0,
        lng: geo?.lng ?? -2.2,
        color: ORIGIN_PIN_COLOR,
        plainLabel: label,
      };
    };

    const selectedMarker = appointments.find((a) => a.id === selectedVisitId);
    if (!selectedMarker) return [];

    const arrivalLeg = coloredStaffLegs.find((l) => l.toVisitId === selectedVisitId);
    const departureLeg = coloredStaffLegs.find((l) => l.fromVisitId === selectedVisitId);

    const stops: BookendStop[] = [];

    if (arrivalLeg) {
      const prev = resolveEndpoint(arrivalLeg.fromVisitId, arrivalLeg.fromPostcode, arrivalLeg.fromLabel);
      stops.push({
        key: "start",
        ...prev,
        tooltipLabel: `Start${arrivalLeg.departureTime ? " · " + fmtTime(arrivalLeg.departureTime) : ""}`,
      });
    }

    stops.push({
      key: "selected",
      lat: selectedMarker.lat,
      lng: selectedMarker.lng,
      color: selectedMarker.color,
      marker: selectedMarker,
      highlighted: true,
    });

    if (departureLeg) {
      const next = resolveEndpoint(departureLeg.toVisitId, departureLeg.toPostcode, departureLeg.toLabel);
      stops.push({
        key: "end",
        ...next,
        tooltipLabel: `End${departureLeg.arrivalTime ? " · " + fmtTime(departureLeg.arrivalTime) : ""}`,
      });
    }

    return stops;
  }, [viewMode, selectedVisitId, coloredStaffLegs, appointments]);

  return (
    <StableMapWrapper>
      {viewMode !== "legacy" && legScheduleLoading && (
        <div className="absolute inset-x-0 top-2 z-[1000] flex justify-center pointer-events-none">
          <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300 shadow">
            Calculating travel times…
          </span>
        </div>
      )}
      <MapContainer key={mapKey} className={styles.map}>
        <ZoomControl position="topright" />
        <MapInitializer zoom={zoom} />
        <FocusManager
          selectedStaffId={selectedStaffId}
          selectedVisitId={selectedVisitId}
          legs={legs}
          markers={appointments}
          officeGeo={officeGeo}
        />

        {/* Route legs — a white casing under each colored line gives clean,
            high-contrast routes that read clearly against the light basemap,
            similar to standard turn-by-turn map apps. */}
        {renderLegs.map((leg) => {
          const isHighlighted = highlightedRouteId === leg.id;
          const weight = isHighlighted ? 7 : 5;
          const travelInfo = "travelMinutes" in leg ? (leg as (typeof coloredStaffLegs)[number]) : null;

          return [
            <Polyline
              key={`${leg.id}-casing`}
              positions={leg.points}
              pathOptions={{
                color: "#ffffff",
                weight: weight + 3,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />,
            <Polyline
              key={leg.id}
              positions={leg.points}
              eventHandlers={{ click: () => setHighlightedRoute(leg.id) }}
              pathOptions={{
                color: leg.color,
                weight,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              {travelInfo && (
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.6, minWidth: 140 }}>
                    <div style={{ fontWeight: 700 }}>
                      {travelInfo.fromLabel} → {travelInfo.toLabel}
                    </div>
                    <div style={{ color: "#475569" }}>
                      {travelInfo.travelMinutes != null
                        ? `${travelInfo.travelMinutes} min · ${travelInfo.distanceMiles} mi`
                        : "Calculating…"}
                    </div>
                    {travelInfo.arrivalTime && (
                      <div style={{ color: "#475569" }}>
                        Arrives {fmtTime(travelInfo.arrivalTime)}
                      </div>
                    )}
                  </div>
                </Popup>
              )}
            </Polyline>,
          ];
        })}

        {/* Office pin */}
        {(() => {
          if (!officePost) return null;
          const geo = geoMapRef.current.get(officePost.toUpperCase());
          if (!geo) return null;
          return (
            <Marker
              position={[geo.lat, geo.lng]}
              {...({
                icon: L.divIcon({
                  className: "",
                  html: `<div style="
                    background:#1e293b;
                    width:18px;height:18px;
                    border-radius:3px;
                    border:2px solid white;
                    box-shadow:0 0 6px rgba(0,0,0,0.6);
                    display:flex;align-items:center;justify-content:center;
                    font-size:10px;color:white;font-weight:700;line-height:1;
                  ">O</div>`,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                }),
              } as any)}
            >
              <Popup>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  Office — {officePost}
                </div>
              </Popup>
            </Marker>
          );
        })()}

        {/* Distinct pin for the selected staff's real day start/end point,
            when it differs from the global office pin shown above. */}
        {originPinGeo && (
          <Marker
            position={[originPinGeo.lat, originPinGeo.lng]}
            {...({ icon: buildPinIcon({ color: ORIGIN_PIN_COLOR, glyph: originPinGeo.glyph }) } as any)}
          >
            <Popup>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {originPinGeo.label} — {originPinGeo.postcode}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Appointment markers — branch by view mode */}
        {showAppointments && viewMode === "legacy" &&
          appointments.map((a) => (
            <Marker
              key={a.id}
              position={[a.lat, a.lng]}
              {...({ icon: buildPinIcon({ color: a.color, highlighted: highlightedAppointmentId === a.id }) } as any)}
              eventHandlers={{ click: () => setHighlightedAppointment(a.id) }}
            >
              <AppointmentPopup a={a} />
            </Marker>
          ))}

        {showAppointments && viewMode === "global" &&
          globalLocationGroups.map((g) => (
            <Marker
              key={g.postcode}
              position={[g.lat, g.lng]}
              {...({
                icon: buildPinIcon({
                  color: GLOBAL_PIN_COLOR,
                  badge: g.visits.length > 1 ? g.visits.length : undefined,
                }),
              } as any)}
            >
              <Popup>
                <div style={{ fontSize: 12, lineHeight: 1.6, minWidth: 160 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{g.postcode}</div>
                  {g.visits.map((v) => (
                    <div key={v.id} style={{ color: "#475569" }}>
                      {v.clientName} · {fmtTime(new Date(v.start))}–{fmtTime(new Date(v.end))} · {v.staffName}
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}

        {showAppointments && viewMode === "staff" &&
          appointments
            .filter((a) => a.staffId === selectedStaffId)
            .map((a) => (
              <Marker
                key={a.id}
                position={[a.lat, a.lng]}
                {...({
                  icon: buildPinIcon({
                    color: a.color,
                    badge: a.seq,
                    highlighted: highlightedAppointmentId === a.id,
                  }),
                } as any)}
                eventHandlers={{ click: () => setHighlightedAppointment(a.id) }}
              >
                <AppointmentPopup a={a} />
              </Marker>
            ))}

        {showAppointments && viewMode === "visit" &&
          bookendStops.map((stop) => (
            <Marker
              key={stop.key}
              position={[stop.lat, stop.lng]}
              {...({ icon: buildPinIcon({ color: stop.color, highlighted: stop.highlighted }) } as any)}
            >
              {stop.tooltipLabel && (
                <Tooltip {...({ permanent: true, direction: "top", offset: [0, -28] } as any)}>
                  {stop.tooltipLabel}
                </Tooltip>
              )}
              {stop.marker ? (
                <AppointmentPopup a={stop.marker} />
              ) : (
                <Popup>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{stop.plainLabel}</div>
                </Popup>
              )}
            </Marker>
          ))}
      </MapContainer>
    </StableMapWrapper>
  );
}
