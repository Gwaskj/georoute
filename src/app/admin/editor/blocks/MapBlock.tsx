"use client";

import dynamic from "next/dynamic";
import { useNode } from "@craftjs/core";
import type { MapBlockProps as ClientMapBlockProps } from "./MapBlock.client";

const MapBlockClient = dynamic<ClientMapBlockProps>(
  () => import("./MapBlock.client"),
  { ssr: false }
);

export type MapBlockProps = ClientMapBlockProps;

export function MapBlock(props: MapBlockProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        width: props.width,
        height: props.height,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <MapBlockClient {...props} />
    </div>
  );
}

MapBlock.craft = {
  displayName: "MapBlock",
  props: {
    lat: 53.0027,
    lng: -2.1794,
    zoom: 12,
    height: 300,
    width: "100%",
    staffId: null,
    markers: [],
    routes: [],
    useGeolocation: false,
  },
};
