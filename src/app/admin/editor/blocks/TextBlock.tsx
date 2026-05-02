"use client";

import { useNode } from "@craftjs/core";
import { ReactNode } from "react";
import { TextBlockSettings } from "./TextBlockSettings";

interface TextBlockProps {
  text: string;
}

export function TextBlock({ text }: TextBlockProps) {
  const { connectors } = useNode();

  return (
    <p
      ref={(ref) => {
        if (ref) connectors.connect(ref);
      }}
      style={{ fontSize: "16px", margin: 0 }}
    >
      {text}
    </p>
  );
}

/* -----------------------------
   Craft.js metadata
------------------------------ */
TextBlock.craft = {
  props: {
    text: "New text",
  },
  related: {
    settings: TextBlockSettings,
  },
};
