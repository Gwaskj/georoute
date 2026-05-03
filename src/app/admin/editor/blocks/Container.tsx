"use client";

import { Element, useNode } from "@craftjs/core";

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
      <Element id="container-canvas" canvas />
    </div>
  );
}

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
