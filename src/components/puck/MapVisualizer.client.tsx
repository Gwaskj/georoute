"use client";

import dynamic from "next/dynamic";

const MapVisualizer = dynamic(() => import("./MapVisualizer"), {
  ssr: false,
});

export default MapVisualizer;
