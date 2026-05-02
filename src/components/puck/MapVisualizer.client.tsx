"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./MapVisualizer"), {
  ssr: false,
});

export default function MapVisualizerClient(props: any) {
  return <Map {...props} />;
}
