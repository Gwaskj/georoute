"use client";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
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
import { getRoute } from "@/lib/routing";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { useSettingsStore } from "@/store/settingsStore";
import { LEG_COLORS } from "@/lib/map/legColors";

import L from "leaflet";

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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Spread multiple markers sharing the same postcode into a small circle
// so they are individually clickable rather than stacked.
function spreadOffset(idx: number, total: number): { lat: number; lng: number } {
  if (total <= 1) return { lat: 0, lng: 0 };
  const angle = (2 * Math.PI * idx) / total;
  const r = 0.0003;
  return { lat: Math.sin(angle) * r, lng: Math.cos(angle) * r };
}

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
        { attribution: "© OpenStreetMap contributors" }
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function MapVisualizerInner({
  zoom = 12,
  showRoutes = true,
  showAppointments = true,
  selectedStaffId,
  selectedVisitId,
  scheduledVisits,
  staffList,
}: {
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean; // kept for API compat
  selectedStaffId?: string | null;
  selectedVisitId?: string | null;
  scheduledVisits?: ScheduledVisit[];
  staffList?: Staff[];
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
  const [routeLoading, setRouteLoading] = useState(false);
  const [officeGeo, setOfficeGeo] = useState<{ lat: number; lng: number } | null>(null);

  const geoMapRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const baseLegsRef = useRef<RouteLeg[]>([]);
  const orsLegCacheRef = useRef<Map<string, [number, number][]>>(new Map());

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
      ]),
    ];

    geocodePostcodes(allPostcodes).then((geoMap) => {
      geoMapRef.current = geoMap;
      orsLegCacheRef.current = new Map();
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

      // ── Markers: one per visit, spread when sharing a postcode ──
      const pcCount = new Map<string, number>();
      for (const v of scheduledVisits) {
        const pc = v.postcode.toUpperCase();
        pcCount.set(pc, (pcCount.get(pc) ?? 0) + 1);
      }
      const pcIndex = new Map<string, number>();

      const markers: AppointmentMarker[] = scheduledVisits.map((v) => {
        const pc = v.postcode.toUpperCase();
        const idx = pcIndex.get(pc) ?? 0;
        pcIndex.set(pc, idx + 1);
        const offset = spreadOffset(idx, pcCount.get(pc) ?? 1);
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
          lat: (geo?.lat ?? 53.0) + offset.lat,
          lng: (geo?.lng ?? -2.2) + offset.lng,
          clientName: v.clientName,
          postcode: v.postcode,
          address: v.address,
          time: `${fmt(v.start)}–${fmt(v.end)}`,
          staffName: v.staffName,
          windowName: v.windowName,
          color,
          durationMins,
          coStaff,
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

  // ── EFFECT 2: when a staff is selected, fetch ORS road routes per leg ───────
  useEffect(() => {
    if (scheduledVisits === undefined || !selectedStaffId) return;

    const staffLegs = baseLegsRef.current.filter(
      (l) => l.staffId === selectedStaffId
    );
    if (staffLegs.length === 0) return;

    // Serve from cache if all legs already fetched
    if (staffLegs.every((l) => orsLegCacheRef.current.has(l.id))) {
      setLegs(
        baseLegsRef.current.map((l) => {
          const cached = orsLegCacheRef.current.get(l.id);
          return cached ? { ...l, points: cached } : l;
        })
      );
      return;
    }

    setLegs(baseLegsRef.current);
    setRouteLoading(true);

    Promise.all(
      staffLegs.map(async (leg) => {
        const cached = orsLegCacheRef.current.get(leg.id);
        if (cached) return { id: leg.id, points: cached };

        if (
          !leg.fromPostcode ||
          !leg.toPostcode ||
          leg.fromPostcode === leg.toPostcode
        ) {
          orsLegCacheRef.current.set(leg.id, leg.points);
          return { id: leg.id, points: leg.points };
        }

        try {
          const result = await getRoute(leg.fromPostcode, leg.toPostcode);
          if (result?.polyline && (result.polyline as any)?.coordinates) {
            const pts: [number, number][] = (
              (result.polyline as any).coordinates as number[][]
            ).map(([lng, lat]) => [lat, lng]);
            orsLegCacheRef.current.set(leg.id, pts);
            return { id: leg.id, points: pts };
          }
        } catch {}

        // Fallback to straight line
        orsLegCacheRef.current.set(leg.id, leg.points);
        return { id: leg.id, points: leg.points };
      })
    ).then((results) => {
      const updates = new Map(results.map((r) => [r.id, r.points]));
      setLegs(
        baseLegsRef.current.map((l) => ({
          ...l,
          points: updates.get(l.id) ?? l.points,
        }))
      );
      setRouteLoading(false);
    });
  }, [selectedStaffId, scheduledVisits]);

  // ── EFFECT 3: legacy loading (when scheduledVisits not provided) ─────────────
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

  // ── Which legs to render ─────────────────────────────────────────────────────
  // Visit selected → show only the leg arriving at + the leg departing from it.
  // Staff selected  → show all legs for that staff.
  // Nothing selected → show every leg (dim non-focused staff if applicable).
  const visibleLegs = useMemo(() => {
    if (!showRoutes) return [];
    if (selectedVisitId) {
      return legs.filter(
        (l) =>
          l.toVisitId === selectedVisitId || l.fromVisitId === selectedVisitId
      );
    }
    if (selectedStaffId) {
      return legs.filter((l) => l.staffId === selectedStaffId);
    }
    return legs;
  }, [legs, selectedStaffId, selectedVisitId, showRoutes]);

  return (
    <StableMapWrapper>
      {routeLoading && (
        <div className="absolute inset-x-0 top-2 z-[1000] flex justify-center pointer-events-none">
          <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-slate-300 shadow">
            Loading route…
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

        {/* Route legs */}
        {visibleLegs.map((leg) => {
          const isHighlighted = highlightedRouteId === leg.id;
          const weight = isHighlighted ? 7 : 4;
          const opacity = isHighlighted ? 1 : 0.85;

          return (
            <Polyline
              key={leg.id}
              positions={leg.points}
              eventHandlers={{ click: () => setHighlightedRoute(leg.id) }}
              pathOptions={{ color: leg.color, weight, opacity }}
            />
          );
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

        {/* Appointment markers */}
        {showAppointments &&
          appointments
            .filter((a) => !selectedStaffId || a.staffId === selectedStaffId)
            .map((a) => {
              const isHighlighted =
                highlightedAppointmentId === a.id || selectedVisitId === a.id;

              return (
                <Marker
                  key={a.id}
                  position={[a.lat, a.lng]}
                  eventHandlers={{
                    click: () => setHighlightedAppointment(a.id),
                  }}
                  {...({
                    icon: L.divIcon({
                      className: "",
                      html: `<div style="
                        background:${a.color};
                        width:${isHighlighted ? 20 : 14}px;
                        height:${isHighlighted ? 20 : 14}px;
                        border-radius:50%;
                        border:2px solid white;
                        box-shadow:0 0 ${isHighlighted ? 10 : 6}px rgba(0,0,0,0.5);
                        transition:all 120ms ease;
                      "></div>`,
                      iconSize: [isHighlighted ? 20 : 14, isHighlighted ? 20 : 14],
                    }),
                  } as any)}
                >
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
                      {a.address && (
                        <div style={{ color: "#475569" }}>{a.address}</div>
                      )}
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
                          <span style={{ fontWeight: 600 }}>Also:</span>{" "}
                          {a.coStaff.join(", ")}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
      </MapContainer>
    </StableMapWrapper>
  );
}
