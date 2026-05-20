// C:\Users\matth\georoute\src\components\engine\MapVisualizerInner.tsx
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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";
import { applyStaffColors } from "@/lib/map/staffColorMap";
import { loadFreeSchedulerData } from "@/lib/freeSession";

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

const supabase = createSupabaseBrowserClient();

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
  label: string;
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
  isFree,
  zoom = 12,
  showRoutes = true,
  showAppointments = true,
  showStaffRoutes = true,
  selectedStaffId,
}: {
  isFree: boolean;
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean;
  selectedStaffId?: string | null;
}) {
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

  const [mapKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadFree() {
      const data = await loadFreeSchedulerData();

      const freeRoutesRaw = (data as any)?.routes ?? [];
      const freeAppointmentsRaw = (data as any)?.appointments ?? [];

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
            lng: a.lng ?? -2.2,
            label: a.label ?? "Appointment",
            color: a.color ?? "#d00000",
          })) ?? []
        );
      }

      await Promise.all([loadRoutes(), loadAppointments()]);

      channel = supabase
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

    if (isFree) {
      loadFree();
    } else {
      loadPro();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isFree]);

  return (
    <StableMapWrapper>
      <MapContainer key={mapKey} className={styles.map}>
        <ZoomControl position="topright" />
        <MapInitializer zoom={zoom} />
        <StaffFocus selectedStaffId={selectedStaffId} routes={routes} />

        <Marker position={[53.0, -2.2]}>
          <Popup>GeoRoute HQ</Popup>
        </Marker>

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
                <Popup>{a.label}</Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </StableMapWrapper>
  );
}
