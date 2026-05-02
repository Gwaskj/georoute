"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapVisualizer.module.css";

// Fix Leaflet icon issues in Next.js
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function MapVisualizer() {
  return (
    <div className={styles.wrapper}>
      <MapContainer
        center={[53.0, -2.2]} // Newcastle-under-Lyme area
        zoom={12}
        scrollWheelZoom={true}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[53.0, -2.2]}>
          <Popup>GeoRoute HQ</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
