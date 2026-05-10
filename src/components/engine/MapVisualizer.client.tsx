"use client";

import dynamic from "next/dynamic";

const MapVisualizerInner = dynamic(
  () => import("./MapVisualizerInner"),
  { ssr: false }
);

export default function MapVisualizerClient(props: any) {
  return <MapVisualizerInner {...props} />;
}
