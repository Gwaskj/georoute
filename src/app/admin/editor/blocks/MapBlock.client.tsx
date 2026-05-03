"use client";

import { useEffect, useRef } from "react";
import { useNode } from "@craftjs/core";

export type MarkerDef = {
  id: string;
  lat: number;
  lng: number;
  popup?: string;
  draggable?: boolean;
};

export type RouteDef = {
  id: string;
  staffId: string | null;
  points: { lat: number; lng: number }[];
  color?: string;
  weight?: number;
};

export type MapBlockProps = {
  lat: number;
  lng: number;
  zoom: number;
  height: number | string;
  width: string;
  staffId: string | null;
  markers?: MarkerDef[];
  routes?: RouteDef[];
  useGeolocation?: boolean;
};

export function MapBlockClient({
  lat,
  lng,
  zoom,
  height,
  width,
  staffId,
  markers = [],
  routes = [],
  useGeolocation = false,
}: MapBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const routeRefs = useRef<Record<string, any>>({});

  const {
    connectors: { connect, drag },
    actions,
  } = useNode();

  const updateMarker = (id: string, newLat: number, newLng: number) => {
    actions.setProp((props: any) => {
      const idx = props.markers?.findIndex((m: MarkerDef) => m.id === id);
      if (idx >= 0) {
        props.markers[idx] = { ...props.markers[idx], lat: newLat, lng: newLng };
      }
    });
  };

  useEffect(() => {
    let L: any;

    async function init() {
      // Load Leaflet dynamically (prevents hydration crash)
      const leaflet = await import("leaflet");
      L = leaflet.default;

      // Load your icon override dynamically
      await import("@/lib/leaflet");

      if (!containerRef.current) return;

      const map = L.map(containerRef.current).setView([lat, lng], zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Markers
      markers.forEach((m) => {
        const marker = L.marker([m.lat, m.lng], { draggable: !!m.draggable }).addTo(map);
        markerRefs.current[m.id] = marker;

        if (m.popup) marker.bindPopup(m.popup);

        if (m.draggable) {
          marker.on("dragend", (ev: any) => {
            const pos = ev.target.getLatLng();
            updateMarker(m.id, pos.lat, pos.lng);
          });
        }
      });

      // Routes (filtered by staff)
      const visibleRoutes = staffId
        ? routes.filter((r) => r.staffId === staffId)
        : routes;

      visibleRoutes.forEach((r) => {
        const poly = L.polyline(
          r.points.map((p) => [p.lat, p.lng]),
          { color: r.color ?? "#3388ff", weight: r.weight ?? 4 }
        ).addTo(map);

        routeRefs.current[r.id] = poly;
      });

      // Geolocation
      if (useGeolocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], zoom);

          L.circleMarker([latitude, longitude], {
            radius: 6,
            color: "#1976d2",
            fillColor: "#1976d2",
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup("You are here");
        });
      }
    }

    init();

    return () => {
      Object.values(markerRefs.current).forEach((m) => m.remove());
      Object.values(routeRefs.current).forEach((r) => r.remove());
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
        containerRef.current = ref;
      }}
      style={{
        width,
        height,
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid #99c2ff",
      }}
    />
  );
}

MapBlockClient.craft = {
  displayName: "MapBlock",
  props: {
    lat: 53.0027,
    lng: -2.1794,
    zoom: 12,
    height: 300,
    width: "100%",
    staffId: null,
    markers: [
      {
        id: "m1",
        lat: 53.0027,
        lng: -2.1794,
        draggable: true,
        popup: "Staff start",
      },
    ],
    routes: [
      {
        id: "r1",
        staffId: "staff-1",
        points: [
          { lat: 53.0027, lng: -2.1794 },
          { lat: 53.01, lng: -2.18 },
        ],
        color: "#ff5722",
      },
    ],
    useGeolocation: false,
  },
};
