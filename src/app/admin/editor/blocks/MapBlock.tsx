"use client";

import dynamic from "next/dynamic";

export const MapBlock = dynamic(() => import("./MapBlock.client").then(m => m.MapBlockClient), {
  ssr: false,
});
