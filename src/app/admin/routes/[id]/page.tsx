import RouteSummary from "@/components/engine/RouteSummary";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

export default async function RouteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Route #{id}</h1>

      <RouteSummary />
      <MapVisualizer />
    </div>
  );
}
