"use client";

import { useNode } from "@craftjs/core";
import type { PageProps } from "./Page";

export function PageSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as PageProps,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Background Color */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Color</span>
        <input
          type="color"
          value={props.backgroundColor ?? "#ffffff"}
          onChange={(e) =>
            setProp((p: PageProps) => {
              p.backgroundColor = e.target.value;
            })
          }
        />
      </label>

      {/* Background Image URL */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Image URL</span>
        <input
          type="text"
          value={props.backgroundImage ?? ""}
          placeholder="https://example.com/image.jpg"
          onChange={(e) =>
            setProp((p: PageProps) => {
              p.backgroundImage = e.target.value;
            })
          }
        />
      </label>

      {/* Background Size */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Size</span>
        <select
          value={props.backgroundSize ?? "cover"}
          onChange={(e) =>
            setProp((p: PageProps) => {
              p.backgroundSize = e.target.value;
            })
          }
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="auto">Auto</option>
        </select>
      </label>

      {/* Background Position */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Position</span>
        <select
          value={props.backgroundPosition ?? "center"}
          onChange={(e) =>
            setProp((p: PageProps) => {
              p.backgroundPosition = e.target.value;
            })
          }
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
}
