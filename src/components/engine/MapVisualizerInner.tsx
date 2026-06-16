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

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";
import { applyStaffColors } from "@/lib/map/staffColorMap";
import { loadFreeSchedulerData } from "@/lib/freeSession";
import { useUserTier } from "@/lib/hooks/useUserTier";
import { geocodePostcodes } from "@/lib/geocode";
import { getRoute } from "@/lib/routing";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { useOfficePostcodeStore } from "@/store/officePostcodeStore";

import L from "leaflet";

const iconUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconShadow =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    if (ref.current && !ready) {
      setReady(true);
    }
  }, [ref.current, ready]);

  return (
    <div ref={ref} className={styles.wrapper}>
      {ready && children}
    </div>
  );
}

type Route = {
  id: string;
  staff_id: string | null;
  points: [number, number][];
  color: string;
};

type AppointmentMarker = {
  id: string;
  lat: number;
  lng: number;
  clientName: string;
  postcode: string;
  address?: string;
  time: string;
  staffName: string;
  windowName?: string;
  color: string;
};

function StaffFocus({
  selectedStaffId,
  routes,
}: {
  selectedStaffId?: string | null;
  routes: Route[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedStaffId) return;

    const staffRoutes = routes.filter(
      (r) => r.staff_id === selectedStaffId && r.points.length > 0
    );
    if (staffRoutes.length === 0) return;

    const latlngs = staffRoutes.flatMap((r) =>
      r.points.map((p) => L.latLng(p[0], p[1]))
    );
    if (latlngs.length === 0) return;

    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [selectedStaffId, routes, map]);

  return null;
}

function normalizePoints(raw: any[]): [number, number][] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p: any) => {
      if (!p) return null;

      const lat =
        p.lat ??
        p.latitude ??
        p.y ??
        null;

      const lng =
        p.lng ??
        p.lon ??
        p.longitude ??
        p.x ??
        null;

      if (lat == null || lng == null) return null;

      return [lat, lng] as [number, number];
    })
    .filter(Boolean) as [number, number][];
}

export default function MapVisualizerInner({
  zoom = 12,
  showRoutes = true,
  showAppointments = true,
  showStaffRoutes = true,
  selectedStaffId,
  scheduledVisits,
  staffList,
}: {
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean;
  selectedStaffId?: string | null;
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

  const [routes, setRoutes] = useState<Route[]>([]);
  const [appointments, setAppointments] = useState<AppointmentMarker[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // geoMap and baseRoutes are kept in refs so the ORS effect can read the
  // latest values without being listed as dependencies (avoiding extra fetches).
  const geoMapRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const baseRoutesRef = useRef<Route[]>([]);
  const orsRouteCacheRef = useRef<Map<string, [number, number][]>>(new Map());

  const [mapKey] = useState(() => crypto.randomUUID());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { officePostcode: officePost } = useOfficePostcodeStore();

  // ── EFFECT 1: geocode postcodes → markers + straight-line base routes ──────
  useEffect(() => {
    if (scheduledVisits === undefined) return;

    if (scheduledVisits.length === 0) {
      setAppointments([]);
      setRoutes([]);
      baseRoutesRef.current = [];
      return;
    }

    const visitPostcodes = [...new Set(scheduledVisits.map((v) => v.postcode).filter(Boolean))];
    const allPostcodes = officePost ? [...visitPostcodes, officePost] : visitPostcodes;

    geocodePostcodes(allPostcodes).then((geoMap) => {
      geoMapRef.current = geoMap;
      orsRouteCacheRef.current = new Map(); // invalidate ORS cache when visits change

      const fmt = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const markers: AppointmentMarker[] = scheduledVisits.map((v) => {
        const geo = geoMap.get(v.postcode.toUpperCase());
        const staffMember = staffList?.find((s) => s.id === v.staffId);
        return {
          id: v.id,
          lat: geo?.lat ?? 53.0,
          lng: geo?.lng ?? -2.2,
          clientName: v.clientName,
          postcode: v.postcode,
          address: v.address,
          time: `${fmt(v.start)}–${fmt(v.end)}`,
          staffName: v.staffName,
          windowName: v.windowName,
          color: staffMember?.colour ?? "#3b82f6",
        };
      });

      // Build straight-line base routes: office → v1 → v2 → ... → office (per staff)
      const officeGeo = officePost ? geoMap.get(officePost.toUpperCase()) : null;
      const staffVisitMap = new Map<string, { points: [number, number][]; colour: string }>();
      const sorted = [...scheduledVisits].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
      for (const v of sorted) {
        const geo = geoMap.get(v.postcode.toUpperCase());
        if (!geo) continue;
        if (!staffVisitMap.has(v.staffId)) {
          const staffMember = staffList?.find((s) => s.id === v.staffId);
          const start: [number, number][] = officeGeo ? [[officeGeo.lat, officeGeo.lng]] : [];
          staffVisitMap.set(v.staffId, { points: start, colour: staffMember?.colour ?? "#3b82f6" });
        }
        staffVisitMap.get(v.staffId)!.points.push([geo.lat, geo.lng]);
      }
      // Append office at end of each staff route
      if (officeGeo) {
        for (const entry of staffVisitMap.values()) {
          entry.points.push([officeGeo.lat, officeGeo.lng]);
        }
      }

      const base: Route[] = [...staffVisitMap.entries()].map(([staffId, { points, colour }]) => ({
        id: staffId,
        staff_id: staffId,
        points,
        color: colour,
      }));

      baseRoutesRef.current = base;
      setAppointments(markers);
      setRoutes(base);
    });
  }, [scheduledVisits, staffList, officePost]);

  // ── EFFECT 2: when a staff member is selected, fetch ORS road-following routes ──
  useEffect(() => {
    if (scheduledVisits === undefined || !selectedStaffId) return;

    const geoMap = geoMapRef.current;
    const base = baseRoutesRef.current;

    // Use cached ORS points if available
    const cached = orsRouteCacheRef.current.get(selectedStaffId);
    if (cached) {
      setRoutes(base.map((r) => r.staff_id === selectedStaffId ? { ...r, points: cached } : r));
      return;
    }

    const staffVisits = (scheduledVisits ?? [])
      .filter((v) => v.staffId === selectedStaffId)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (staffVisits.length === 0) return;

    // Show straight-line immediately; replace with ORS when ready
    setRoutes(base);
    setRouteLoading(true);

    // Build ordered postcode sequence: office → v1 → v2 → ... → vN → office
    const seq: string[] = [
      ...(officePost ? [officePost] : []),
      ...staffVisits.map((v) => v.postcode),
      ...(officePost ? [officePost] : []),
    ].filter(Boolean);

    const pairs: [string, string][] = [];
    for (let i = 0; i < seq.length - 1; i++) {
      if (seq[i] !== seq[i + 1]) pairs.push([seq[i], seq[i + 1]]);
    }

    // No meaningful route to fetch — keep base routes as-is
    if (pairs.length === 0) {
      setRouteLoading(false);
      return;
    }

    Promise.all(pairs.map(([from, to]) => getRoute(from, to))).then((results) => {
      const orsPoints: [number, number][] = [];

      results.forEach((result, i) => {
        if (result?.polyline && (result.polyline as any)?.coordinates) {
          // ORS GeoJSON coords are [lng, lat] — Leaflet needs [lat, lng]
          const coords = (result.polyline as any).coordinates as number[][];
          coords.forEach(([lng, lat]) => orsPoints.push([lat, lng]));
        } else {
          // Fallback: straight line between this pair using geocoded positions
          const fromGeo = geoMap.get(pairs[i][0].toUpperCase());
          const toGeo = geoMap.get(pairs[i][1].toUpperCase());
          if (fromGeo) orsPoints.push([fromGeo.lat, fromGeo.lng]);
          if (toGeo) orsPoints.push([toGeo.lat, toGeo.lng]);
        }
      });

      orsRouteCacheRef.current.set(selectedStaffId, orsPoints);
      setRoutes(base.map((r) => r.staff_id === selectedStaffId ? { ...r, points: orsPoints } : r));
      setRouteLoading(false);
    });
  }, [selectedStaffId, scheduledVisits, officePost]);

  useEffect(() => {
    // Skip legacy loading when visits are provided directly
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

      const colored: Route[] = applyStaffColors(normalizedRoutes);

      const normalizedAppointments: AppointmentMarker[] = (freeAppointmentsRaw ?? []).map(
        (a: any) => ({
          id: a.id,
          lat: a.lat ?? 53.0,
          lng: a.lng ?? -2.2,
          label: a.label ?? "Appointment",
          color: a.color ?? "#d00000",
          clientName: a.clientName ?? a.label ?? "Appointment",
          postcode: a.postcode ?? "",
          time: a.time ?? "",
          staffName: a.staffName ?? "",
        })
      );

      setRoutes(colored);
      setAppointments(normalizedAppointments);
    }

    async function loadPro() {
      async function loadRoutes() {
        const { data } = await supabase.from("routes").select("*");

        const normalized = (data ?? []).map((r: any) => ({
          id: r.id,
          staff_id: r.staff_id ?? null,
          points: normalizePoints(r.points ?? []),
        }));

        const colored: Route[] = applyStaffColors(normalized);
        setRoutes(colored);
      }

      async function loadAppointments() {
        const { data } = await supabase.from("appointments").select("*");
        setAppointments(
          data?.map((a: any) => ({
            id: a.id,
            lat: a.lat ?? 53.0,
            lng: a.lon ?? -2.2,
            label: a.name ?? "Appointment",
            color: a.color ?? "#d00000",
          })) ?? []
        );
      }

      await Promise.all([loadRoutes(), loadAppointments()]);

      if (!channelRef.current) {
        channelRef.current = supabase
          .channel("map-updates")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "routes" },
            () => loadRoutes()
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "appointments" },
            () => loadAppointments()
          )
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
        <StaffFocus selectedStaffId={selectedStaffId} routes={routes} />

        {showRoutes &&
          routes.map((route) => {
            const isHighlighted = highlightedRouteId === route.id;
            const isSelectedStaffRoute =
              selectedStaffId && route.staff_id === selectedStaffId;

            let weight = 4;
            let opacity = showStaffRoutes ? 0.9 : 0.5;

            if (selectedStaffId) {
              if (isSelectedStaffRoute) {
                opacity = 1;
                weight = 6;
              } else {
                opacity = 0.12;
              }
            }

            if (isHighlighted) {
              opacity = 1;
              weight = 7;
            }

            return (
              <Polyline
                key={route.id}
                positions={route.points}
                eventHandlers={{
                  click: () => setHighlightedRoute(route.id),
                }}
                pathOptions={{
                  color: route.color,
                  weight,
                  opacity,
                }}
              />
            );
          })}

        {showAppointments &&
          appointments.map((a) => {
            const isHighlighted = highlightedAppointmentId === a.id;

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
                      box-shadow:0 0 6px rgba(0,0,0,0.5);
                    "></div>`,
                    iconSize: [
                      isHighlighted ? 20 : 14,
                      isHighlighted ? 20 : 14,
                    ],
                  }),
                } as any)}
              >
                <Popup>
                  <div style={{ fontSize: 12, lineHeight: 1.5, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{a.clientName}</div>
                    {a.windowName && (
                      <div style={{ color: "#2563eb", fontWeight: 600, marginBottom: 2 }}>{a.windowName}</div>
                    )}
                    {a.address && <div style={{ color: "#475569" }}>{a.address}</div>}
                    <div style={{ color: "#475569" }}>{a.postcode}</div>
                    <div style={{ color: "#475569" }}>{a.time}</div>
                    <div style={{ color: "#94a3b8", marginTop: 4 }}>Staff: {a.staffName}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </StableMapWrapper>
  );
}
