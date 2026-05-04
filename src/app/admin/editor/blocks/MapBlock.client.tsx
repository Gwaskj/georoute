"use client";

import { useEffect } from "react";
import L from "leaflet";

export type MapMarker = {
  lat: number;
  lng: number;
};

export type MapRoute = [number, number][];

export type MapBlockProps = {
  lat: number;
  lng: number;
  zoom: number;
  height: number;
  width: string | number;
  staffId: string | null;
  markers: MapMarker[];
  routes: MapRoute[];
  useGeolocation: boolean;
};

function MapBlockClient({
  lat,
  lng,
  zoom,
  height,
  width,
  staffId,
  markers,
  routes,
  useGeolocation,
}: MapBlockProps) {
  useEffect(() => {
    const containerId = "mapblock-container";

    const existing = L.DomUtil.get(containerId);
    if (existing) {
      existing.remove();
    }

    const map = L.map(containerId).setView([lat, lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    markers?.forEach((m) => {
      L.marker([m.lat, m.lng]).addTo(map);
    });

    routes?.forEach((route) => {
      L.polyline(route, { color: "blue" }).addTo(map);
    });

    if (useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        L.marker([pos.coords.latitude, pos.coords.longitude], {
          title: "You are here",
        }).addTo(map);
      });
    }

    return () => {
      map.remove();
    };
  }, [lat, lng, zoom, markers, routes, useGeolocation]);

  return (
    <div
      id="mapblock-container"
      style={{
        width,
        height,
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
}

export default MapBlockClient;
