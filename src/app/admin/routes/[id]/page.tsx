import RouteSummary from "@/components/engine/RouteSummary";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

export default function RouteDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Route #{id}</h1>

      <RouteSummary />
      <MapVisualizer />
    </div>
  );
}
