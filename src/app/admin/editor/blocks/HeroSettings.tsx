"use client";

import { useNode } from "@craftjs/core";
import type { HeroProps } from "./Hero";

export function HeroSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as HeroProps,
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Title */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Title</span>
        <input
          type="text"
          value={props.title}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>

      {/* Subtitle */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Subtitle</span>
        <input
          type="text"
          value={props.subtitle}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.subtitle = e.target.value;
            })
          }
        />
      </label>

      {/* Alignment */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Alignment</span>
        <select
          value={props.align}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.align = e.target.value as HeroProps["align"];
            })
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>

      {/* Background Color */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Background Color</span>
        <input
          type="color"
          value={props.backgroundColor}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.backgroundColor = e.target.value;
            })
          }
        />
      </label>

      {/* Text Color */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Text Color</span>
        <input
          type="color"
          value={props.textColor}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.textColor = e.target.value;
            })
          }
        />
      </label>

      {/* Padding */}
      <label style={{ display: "grid", gap: 4 }}>
        <span>Padding</span>
        <input
          type="number"
          value={props.padding}
          onChange={(e) =>
            setProp((p: HeroProps) => {
              p.padding = Number(e.target.value);
            })
          }
        />
      </label>
    </div>
  );
}
