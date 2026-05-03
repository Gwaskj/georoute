"use client";

import { useNode } from "@craftjs/core";

export function MapBlockSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
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
            setProp((p: any) => {
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
            setProp((p: any) => {
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
          value={props.height}
          onChange={(e) =>
            setProp((p: any) => {
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
            setProp((p: any) => {
              p.width = e.target.value;
            })
          }
        />
      </label>
    </div>
  );
}
