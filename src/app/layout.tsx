import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

// GLOBAL STYLES
import "./globals.css";
import "@/styles/theme.css";
import "@/styles/utilities.css";
import "@/styles/Button.module.css";
import "@/styles/Input.module.css";
import "@/styles/Card.module.css";

import { ReactNode } from "react";
import Link from "next/link";
import HeaderLoader from "@/components/HeaderLoader";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "GeoRoute – Smarter Route Planning",
  description: "Smarter route planning for teams that don’t slow down.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1904838490296389"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <ThemeProvider>
          <div className="flex min-h-screen flex-col">

            <HeaderLoader />

            <main className="flex-1">
              {children}
            </main>

            <footer className="border-t border-slate-800 bg-slate-950/80">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>© {new Date().getFullYear()} GeoRoute. All rights reserved.</span>
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline">Smarter route planning for teams that don’t slow down.</span>
                  <Link href="/how-it-works" className="hover:text-slate-200">How It Works</Link>
                  <Link href="/privacy" className="hover:text-slate-200">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-slate-200">Terms of Service</Link>
                </div>
              </div>
            </footer>

          </div>
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  );
}
