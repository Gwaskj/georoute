"use client";

import dynamic from "next/dynamic";

const MapVisualizerInner = dynamic(() => import("./MapVisualizerInner"), {
  ssr: false,
});

interface MapVisualizerClientProps {
  selectedStaffId?: string | null;
  routes?: any[];               // ← ADD THIS
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean;
}

export default function MapVisualizerClient(props: MapVisualizerClientProps) {
  return <MapVisualizerInner {...props} />;
}
