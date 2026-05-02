"use client";

import { useNode } from "@craftjs/core";

export function TextBlockSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div>
      <label style={{ display: "block", marginBottom: 8 }}>
        Text
        <input
          type="text"
          value={props.text}
          onChange={(e) =>
            setProp((p: any) => {
              p.text = e.target.value;
            })
          }
          style={{
            width: "100%",
            padding: "6px 8px",
            marginTop: 4,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </label>
    </div>
  );
}
