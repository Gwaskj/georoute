"use client";

import { useNode } from "@craftjs/core";
import type { MapBlockProps } from "./MapBlock.client";

export function MapBlockSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as MapBlockProps,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Staff ID */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Staff ID</span>
        <input
          type="text"
          value={props.staffId ?? ""}
          placeholder="optional"
          onChange={(e) =>
            setProp((p: MapBlockProps) => {
              p.staffId = e.target.value || null;
            })
          }
        />
      </label>

      {/* Zoom */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Zoom Level</span>
        <input
          type="number"
          value={props.zoom}
          min={1}
          max={20}
          onChange={(e) =>
            setProp((p: MapBlockProps) => {
              p.zoom = Number(e.target.value);
            })
          }
        />
      </label>

      {/* Height */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Height (px)</span>
        <input
          type="number"
          value={typeof props.height === "number" ? props.height : parseInt(props.height)}
          onChange={(e) =>
            setProp((p: MapBlockProps) => {
              p.height = Number(e.target.value);
            })
          }
        />
      </label>

      {/* Width */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Width (CSS)</span>
        <input
          type="text"
          value={props.width}
          placeholder="e.g. 100%, 600px"
          onChange={(e) =>
            setProp((p: MapBlockProps) => {
              p.width = e.target.value;
            })
          }
        />
      </label>
    </div>
  );
}
