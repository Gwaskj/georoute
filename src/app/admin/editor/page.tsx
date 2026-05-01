"use client";

import { useState } from "react";
import { Puck } from "@puckeditor/core";
import { puckConfig } from "@/puck/puck.config";

export default function PuckEditorPage() {
  // Puck v1 requires untyped data
  const [data, setData] = useState<{ content: unknown[] }>({ content: [] });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-4">Puck Editor</h1>

      <Puck config={puckConfig} data={data} onChange={setData} />
    </div>
  );
}
