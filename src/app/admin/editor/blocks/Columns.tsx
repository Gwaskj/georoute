"use client";

import { Element, useNode } from "@craftjs/core";

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
};

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
      <Element id="column-inner" canvas />
    </div>
  );
}

Column.craft = {
  displayName: "Column",
  props: {
    padding: 16,
    background: "#ffffff",
  },
  rules: {
    canMoveIn: () => true,
  },
};
