export {}; // required to make this file a module

import type { Metadata } from "next";

// GLOBAL STYLES
import "./globals.css";          // Tailwind + resets
import "@/styles/theme.css";     // Your CSS variables
import "@/styles/utilities.css"; // Utility classes
import "@/styles/Button.module.css";
import "@/styles/Input.module.css";
import "@/styles/Card.module.css";

import { cookies } from "next/headers";
import { ReactNode } from "react";
import Header from "@/components/home/Header"; // <-- FIXED IMPORT
import { createServerClient } from "@supabase/ssr";

export const metadata: Metadata = {
  title: "GeoRoute – Smarter Route Planning",
  description: "Smarter route planning for teams that don’t slow down.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: headerData } = await supabase
    .from("site_header")
    .select("*")
    .single();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">

          {/* GLOBAL HEADER */}
          <Header
            title={headerData?.title ?? "GeoRoute"}
            logoUrl={headerData?.logo_url ?? "/logo-placeholder.png"}
            bannerUrl={headerData?.banner_url ?? "/Banner-placeholder.jpg"}
            logo_x={headerData?.logo_x ?? 0}
            logo_y={headerData?.logo_y ?? 0}
            logo_scale={headerData?.logo_scale ?? 1}
            banner_offset_x={headerData?.banner_offset_x ?? 0}
            banner_offset_y={headerData?.banner_offset_y ?? 0}
          />

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
