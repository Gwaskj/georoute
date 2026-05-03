"use client";

import { useNode } from "@craftjs/core";
import type { ColumnsProps } from "./Columns";

export function ColumnsSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ColumnsProps,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span>Gap</span>
        <input
          type="number"
          value={props.gap}
          onChange={(e) =>
            setProp((p: ColumnsProps) => {
              p.gap = Number(e.target.value);
            })
          }
        />
      </label>
    </div>
  );
}
