"use client";

import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-gray-50">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
