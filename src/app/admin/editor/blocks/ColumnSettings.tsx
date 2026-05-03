"use client";

import { useNode } from "@craftjs/core";
import type { ColumnProps } from "./Column";

export function ColumnSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ColumnProps,
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
            setProp((p: ColumnProps) => {
              p.padding = Number(e.target.value);
            })
          }
        />
      </label>

      {/* Background */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background</span>
        <input
          type="color"
          value={props.background}
          onChange={(e) =>
            setProp((p: ColumnProps) => {
              p.background = e.target.value;
            })
          }
        />
      </label>
    </div>
  );
}
