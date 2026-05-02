"use client";

import { useEditor } from "@craftjs/core";
import { Container } from "./Container";
import { TextBlock } from "./TextBlock";

export function Toolbox() {
  const { connectors } = useEditor();

  return (
    <div
      style={{
        width: 200,
        background: "#fff",
        borderRight: "1px solid #ddd",
        padding: 20,
      }}
    >
      <h3>Blocks</h3>

      <div
        ref={(ref) => {
          if (ref) connectors.create(ref, <TextBlock text="New text" />);
        }}
        style={{ padding: 10, border: "1px solid #ccc", marginBottom: 10 }}
      >
        Text
      </div>

      <div
        ref={(ref) => {
          if (ref) connectors.create(ref, <Container />);
        }}
        style={{ padding: 10, border: "1px solid #ccc" }}
      >
        Container
      </div>
    </div>
  );
}
