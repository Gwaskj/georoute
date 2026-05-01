"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// React‑Leaflet must be dynamically imported (SSR-safe)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

type Client = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

type Appointment = {
  id: string;
  staff_id: string | null;
  clients: Client | null; // <-- FIXED: single client, not array
};

type MapVisualizerProps = {
  zoom: number;
  showRoutes: boolean;
};

export default function MapVisualizer({ zoom, showRoutes }: MapVisualizerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/appointments"); // or your Supabase fetch
      const data = await res.json();
      setAppointments(data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white border rounded">
        <p className="text-sm text-gray-500">Loading map…</p>
      </div>
    );
  }

  // Default center if no appointments
  const center: [number, number] =
    appointments.length > 0 && appointments[0].clients
      ? [
          appointments[0].clients.lat ?? 53.0,
          appointments[0].clients.lng ?? -2.1,
        ]
      : [53.0, -2.1];

  return (
    <div className="w-full h-[600px] rounded overflow-hidden border">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {appointments.map((appt) => {
          const c = appt.clients;
          if (!c || c.lat == null || c.lng == null) return null;

          return (
            <Marker
              key={appt.id}
              position={[c.lat, c.lng]}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
