"use client";

import { useEditor } from "@craftjs/core";

export function SettingsPanel() {
  const { selected } = useEditor((state) => {
    const selectedIds = Array.from(state.events.selected);
    const selectedId = selectedIds[0] ?? null;

    return {
      selected: selectedId ? state.nodes[selectedId] : null,
    };
  });

  return (
    <div
      style={{
        width: 250,
        background: "#fff",
        borderLeft: "1px solid #ddd",
        padding: 20,
      }}
    >
      <h3>Inspector</h3>

      {!selected && <p>Select a block</p>}

      {selected && (
        <pre style={{ fontSize: 12 }}>
          {JSON.stringify(selected.data.props, null, 2)}
        </pre>
      )}
    </div>
  );
}
