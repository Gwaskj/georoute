"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const Map = dynamic(() => import("./MapVisualizerInner"), {
  ssr: false,
});

export default function MapVisualizerClient(
  props: ComponentProps<typeof Map>
) {
  return <Map {...props} />;
}
