"use client";

import { Element, useNode } from "@craftjs/core";

export type PageProps = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
};

export function Page({
  backgroundColor = "#ffffff",
  backgroundImage = "",
  backgroundSize = "cover",
  backgroundPosition = "center",
}: PageProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        minHeight: "100vh",
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize,
        backgroundPosition,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <Element id="page-canvas" canvas />
    </div>
  );
}

Page.craft = {
  displayName: "Page",
  props: {
    backgroundColor: "#ffffff",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  rules: {
    canMoveIn: () => true,
  },
};
