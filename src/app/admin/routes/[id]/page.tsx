"use client";

export const dynamic = "force-static";

import { useUserTier } from "@/lib/hooks/useUserTier";
import MapVisualizer from "@/components/engine/MapVisualizer.client";
import RouteSummary from "@/components/engine/RouteSummary";

export default function RouteDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const isFree = useUserTier();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Route #{id}</h1>

      <RouteSummary isFree={isFree} />
      <MapVisualizer isFree={isFree} />
    </div>
  );
}
