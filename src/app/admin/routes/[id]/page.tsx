"use client";

import MapVisualizer from "@/components/engine/MapVisualizer.client";
import RouteSummary from "@/components/engine/RouteSummary";

interface RoutePageProps {
  params: {
    id: string;
  };
}

export default function RouteDetailsPage({ params }: RoutePageProps) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Route #{id}</h1>

      {/* These components do NOT accept routeId yet */}
      <RouteSummary />
      <MapVisualizer />
    </div>
  );
}
