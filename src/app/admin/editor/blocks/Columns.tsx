"use client";

import { Element, useNode } from "@craftjs/core";
import { Column } from "./Column";

export type ColumnsProps = {
  gap: number;
};

export function Columns({ gap }: ColumnsProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap,
      }}
    >
      <Element
        id="column-1"
        is={Column}
        canvas
        padding={16}
        background="#ffffff"
      />
      <Element
        id="column-2"
        is={Column}
        canvas
        padding={16}
        background="#ffffff"
      />
    </div>
  );
}

Columns.craft = {
  displayName: "Columns",
  props: {
    gap: 16,
  },
  rules: {
    canMoveIn: () => false,
  },
  canvas: true,
};
