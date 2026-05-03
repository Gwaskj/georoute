"use client";

import { useNode } from "@craftjs/core";
import type { SectionProps } from "./Section";

export function SectionSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as SectionProps,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Padding */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Padding</span>
        <input
          type="number"
          value={props.padding}
          onChange={(e) =>
            setProp((p: SectionProps) => {
              p.padding = Number(e.target.value);
            })
          }
        />
      </label>

      {/* Background Color */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Color</span>
        <input
          type="color"
          value={props.backgroundColor}
          onChange={(e) =>
            setProp((p: SectionProps) => {
              p.backgroundColor = e.target.value;
            })
          }
        />
      </label>
    </div>
  );
}
