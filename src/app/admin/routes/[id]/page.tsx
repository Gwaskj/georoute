import { useUserTier } from "@/lib/hooks/useUserTier";
import MapVisualizer from "@/components/engine/MapVisualizer.client";
import RouteSummary from "@/components/engine/RouteSummary";

export default function RouteDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // This hook is client-only, so we move it inside the client components instead.
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Route #{id}</h1>

      <RouteSummary />
      <MapVisualizer />
    </div>
  );
}
