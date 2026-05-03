"use client";

import { useEditor } from "@craftjs/core";

export function SettingsPanel() {
  const { selected, actions } = useEditor((state) => {
    const selectedIds = Array.from(state.events.selected);
    const selectedId = selectedIds[0] ?? null;

    if (!selectedId) return { selected: null };

    const node = state.nodes[selectedId];

    return {
      selected: {
        id: selectedId,
        name: node.data.displayName,
        props: node.data.props,
      },
    };
  });

  if (!selected) {
    return (
      <div
        style={{
          width: 260,
          borderLeft: "1px solid #ddd",
          background: "#fafafa",
          padding: 16,
        }}
      >
        <p style={{ color: "#888" }}>No element selected</p>
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    actions.setProp(selected.id, (props: any) => {
      props[key] = value;
    });
  };

  const props = selected.props;

  return (
    <div
      style={{
        width: 260,
        borderLeft: "1px solid #ddd",
        background: "#fafafa",
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <h4 style={{ marginTop: 0 }}>{selected.name} settings</h4>

      {Object.entries(props).map(([key, value]) => {
        // alignment
        if (
          typeof value === "string" &&
          ["left", "center", "right"].includes(value)
        ) {
          return (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span>{key}</span>
              <select
                value={value}
                onChange={(e) => updateProp(key, e.target.value)}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          );
        }

        // color
        if (typeof value === "string" && key.toLowerCase().includes("color")) {
          return (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span>{key}</span>
              <input
                type="color"
                value={value}
                onChange={(e) => updateProp(key, e.target.value)}
              />
            </label>
          );
        }

        // background image
        if (key === "backgroundImage") {
          return (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span>Background Image URL</span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateProp(key, e.target.value)}
              />
            </label>
          );
        }

        // text-like
        if (typeof value === "string") {
          return (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span>{key}</span>
              <input
                type="text"
                value={value}
                onChange={(e) => updateProp(key, e.target.value)}
              />
            </label>
          );
        }

        // numeric
        if (typeof value === "number") {
          return (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span>{key}</span>
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  updateProp(key, Number(e.target.value) || 0)
                }
              />
            </label>
          );
        }

        return null;
      })}
    </div>
  );
}
