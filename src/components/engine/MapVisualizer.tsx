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

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapInitializer({ zoom }: { zoom: number }) {
  const map = useMap();
  map.setView([53.0, -2.2], zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  return null;
}

type Route = {
  id: string;
  staff_id: string | null;
  color: string;
  points: [number, number][];
};

type AppointmentMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
};

export default function MapVisualizer({
  zoom = 12,
  showRoutes = true,
  showAppointments = true,
  showStaffRoutes = true,
}: {
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean;
}) {
  const supabase = createSupabaseBrowserClient();

  const highlightedAppointmentId = useHighlightStore(
    (s) => s.highlightedAppointmentId
  );
  const setHighlightedAppointment = useHighlightStore(
    (s) => s.setHighlightedAppointment
  );

  const highlightedRouteId = useHighlightStore(
    (s) => s.highlightedRouteId
  );
  const setHighlightedRoute = useHighlightStore(
    (s) => s.setHighlightedRoute
  );

  const [routes, setRoutes] = useState<Route[]>([]);
  const [appointments, setAppointments] = useState<AppointmentMarker[]>([]);

  useEffect(() => {
    async function loadRoutes() {
      const { data } = await supabase.from("routes").select("*");

      const parsed =
        data?.map((r: any) => ({
          id: r.id,
          staff_id: r.staff_id ?? null,
          color: r.color ?? "#0070f3",
          points: r.points ?? [],
        })) ?? [];

      setRoutes(parsed);
    }

    async function loadAppointments() {
      const { data } = await supabase.from("appointments").select("*");

      const parsed =
        data?.map((a: any) => ({
          id: a.id,
          lat: a.lat ?? 53.0,
          lng: a.lng ?? -2.2,
          label: a.label ?? "Appointment",
          color: a.color ?? "#d00000",
        })) ?? [];

      setAppointments(parsed);
    }

    loadRoutes();
    loadAppointments();

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className={styles.wrapper}>
      <MapContainer className={styles.map}>
        <ZoomControl position="topright" />
        <MapInitializer zoom={zoom} />

        <Marker position={[53.0, -2.2]}>
          <Popup>GeoRoute HQ</Popup>
        </Marker>

        {showRoutes &&
          routes.map((route) => {
            const isHighlighted = highlightedRouteId === route.id;

            return (
              <Polyline
                key={route.id}
                positions={route.points}
                eventHandlers={{
                  click: () => setHighlightedRoute(route.id),
                }}
                pathOptions={{
                  color: route.color,
                  weight: isHighlighted ? 7 : 4,
                  opacity: isHighlighted ? 1 : showStaffRoutes ? 0.9 : 0.5,
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
                    iconSize: [isHighlighted ? 20 : 14, isHighlighted ? 20 : 14],
                  }),
                } as any)}
              >
                <Popup>{a.label}</Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
