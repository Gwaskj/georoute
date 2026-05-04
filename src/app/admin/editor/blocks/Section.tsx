"use client";

import { Element, useNode } from "@craftjs/core";
import { ReactNode } from "react";

export type SectionProps = {
  padding: number;
  backgroundColor: string;
};

export function Section({ padding, backgroundColor }: SectionProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        padding,
        backgroundColor,
        marginBottom: 24,
        borderRadius: 8,
      }}
    >
      <Element
        is={SectionCanvas}
        id="section-canvas"
        canvas
      />
    </section>
  );
}

export function SectionCanvas({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

SectionCanvas.craft = {
  displayName: "SectionCanvas",
};

Section.craft = {
  displayName: "Section",
  props: {
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  rules: {
    canMoveIn: () => true,
  },
};
