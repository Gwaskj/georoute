"use client";

import {
  MapContainer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapVisualizer.module.css";

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

// Imperative TileLayer + center/zoom for v5
function MapInitializer({ zoom }: { zoom: number }) {
  const map = useMap();

  map.setView([53.0, -2.2], zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  return null;
}

export default function MapVisualizer({
  zoom = 12,
  showRoutes = true,
}: {
  zoom?: number;
  showRoutes?: boolean;
}) {
  return (
    <div className={styles.wrapper}>
      <MapContainer className={styles.map}>
        <MapInitializer zoom={zoom} />

        <Marker position={[53.0, -2.2]}>
          <Popup>GeoRoute HQ</Popup>
        </Marker>

        {showRoutes && null}
      </MapContainer>
    </div>
  );
}
