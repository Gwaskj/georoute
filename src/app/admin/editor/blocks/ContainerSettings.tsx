"use client";

import { useNode } from "@craftjs/core";

export function ContainerSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
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
            setProp((p: any) => {
              p.padding = Number(e.target.value);
            })
          }
          style={{ width: "100%" }}
        />
      </label>

      {/* Background */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background</span>
        <input
          type="color"
          value={props.background}
          onChange={(e) =>
            setProp((p: any) => {
              p.background = e.target.value;
            })
          }
          style={{ width: "100%" }}
        />
      </label>
    </div>
  );
}
