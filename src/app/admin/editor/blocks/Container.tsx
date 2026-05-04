"use client";

import { Element, useNode } from "@craftjs/core";
import type { ReactNode } from "react";

export type ContainerProps = {
  padding: number;
  background: string;
};

export function Container({ padding, background }: ContainerProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        padding,
        background,
        borderRadius: 6,
        minHeight: 50,
      }}
    >
      <Element is={ContainerCanvas} id="container-canvas" canvas />
    </div>
  );
}

export function ContainerCanvas({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

ContainerCanvas.craft = {
  displayName: "ContainerCanvas",
};

Container.craft = {
  displayName: "Container",
  props: {
    padding: 20,
    background: "#f5f5f5",
  },
  rules: {
    canMoveIn: () => true,
  },
};
