"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { Toolbox } from "./blocks/Toolbox";
import { SettingsPanel } from "./SettingsPanel";
import { Container } from "./blocks/Container";
import { TextBlock } from "./blocks/TextBlock";

export default function EditorPage() {
  return (
    <Editor resolver={{ Container, TextBlock }}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Left sidebar */}
        <Toolbox />

        {/* Canvas */}
        <div style={{ flex: 1, background: "#f9fafb", padding: 20 }}>
          <Frame>
            <Element is={Container} canvas>
              <TextBlock text="Welcome to your editor" />
            </Element>
          </Frame>
        </div>

        {/* Right inspector */}
        <SettingsPanel />
      </div>
    </Editor>
  );
}
