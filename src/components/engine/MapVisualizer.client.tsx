"use client";

import dynamic from "next/dynamic";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";

const MapVisualizerInner = dynamic(() => import("./MapVisualizerInner"), {
  ssr: false,
});

export interface MapVisualizerClientProps {
  selectedStaffId?: string | null;
  selectedVisitId?: string | null;
  zoom?: number;
  showRoutes?: boolean;
  showAppointments?: boolean;
  showStaffRoutes?: boolean;
  scheduledVisits?: ScheduledVisit[];
  staffList?: Staff[];
}

export default function MapVisualizerClient(props: MapVisualizerClientProps) {
  return <MapVisualizerInner {...props} />;
}
