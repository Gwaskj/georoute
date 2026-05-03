"use client";

import { Element, useNode } from "@craftjs/core";

export type ColumnProps = {
  padding: number;
  background: string;
};

export function Column({ padding, background }: ColumnProps) {
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
      <Element
        is={ColumnCanvas}
        id="column-inner"
        canvas
      />
    </div>
  );
}

export function ColumnCanvas({ children }: any) {
  return <div>{children}</div>;
}

ColumnCanvas.craft = {
  displayName: "ColumnCanvas",
};

Column.craft = {
  displayName: "Column",
  props: {
    padding: 16,
    background: "#ffffff",
  },
  rules: {
    canMoveIn: () => true,
  },
  canvas: true,
};
