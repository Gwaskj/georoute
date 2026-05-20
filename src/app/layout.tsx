import type { Metadata } from "next";

// GLOBAL STYLES
import "./globals.css";
import "@/styles/theme.css";
import "@/styles/utilities.css";
import "@/styles/Button.module.css";
import "@/styles/Input.module.css";
import "@/styles/Card.module.css";

import { ReactNode } from "react";
import HeaderLoader from "@/components/HeaderLoader";

export const metadata: Metadata = {
  title: "GeoRoute – Smarter Route Planning",
  description: "Smarter route planning for teams that don’t slow down.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">

          {/* GLOBAL HEADER */}
          <HeaderLoader />

          {/* MAIN CONTENT */}
          <main className="flex-1">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-800 bg-slate-950/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-slate-400">
              <span>© {new Date().getFullYear()} GeoRoute. All rights reserved.</span>
              <span>Smarter route planning for teams that don’t slow down.</span>
            </div>
          </footer>

        </div>
      </body>
    </html>
  );
}
