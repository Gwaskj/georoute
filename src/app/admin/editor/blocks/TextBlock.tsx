"use client";

import { useNode } from "@craftjs/core";

export type TextBlockProps = {
  text: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
};

export function TextBlock({ text, fontSize, color, align }: TextBlockProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <p
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        fontSize,
        color,
        textAlign: align,
        margin: 0,
        padding: 4,
      }}
    >
      {text}
    </p>
  );
}

TextBlock.craft = {
  displayName: "TextBlock",
  props: {
    text: "Text",
    fontSize: 16,
    color: "#000000",
    align: "left",
  },
};
