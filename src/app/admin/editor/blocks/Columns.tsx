"use client";

import { Element, useNode } from "@craftjs/core";
import { Column, ColumnCanvas } from "./Column";

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
        is={Column}
        id="column-1"
        canvas
        padding={16}
        background="#ffffff"
      >
        <Element is={ColumnCanvas} id="column-1-inner" canvas />
      </Element>

      <Element
        is={Column}
        id="column-2"
        canvas
        padding={16}
        background="#ffffff"
      >
        <Element is={ColumnCanvas} id="column-2-inner" canvas />
      </Element>
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
