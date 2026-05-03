"use client";

import { useNode } from "@craftjs/core";
import type { TextBlockProps } from "./TextBlock";

export function TextBlockSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TextBlockProps,
  }));

  return (
    <div className="space-y-3">
      <label className="block">
        <span>Text</span>
        <input
          type="text"
          value={props.text}
          onChange={(e) =>
            setProp((p: TextBlockProps) => {
              p.text = e.target.value;
            })
          }
        />
      </label>

      <label className="block">
        <span>Font Size</span>
        <input
          type="number"
          value={props.fontSize}
          onChange={(e) =>
            setProp((p: TextBlockProps) => {
              p.fontSize = Number(e.target.value);
            })
          }
        />
      </label>

      <label className="block">
        <span>Color</span>
        <input
          type="color"
          value={props.color}
          onChange={(e) =>
            setProp((p: TextBlockProps) => {
              p.color = e.target.value;
            })
          }
        />
      </label>

      <label className="block">
        <span>Alignment</span>
        <select
          value={props.align}
          onChange={(e) =>
            setProp((p: TextBlockProps) => {
              p.align = e.target.value as TextBlockProps["align"];
            })
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
}
