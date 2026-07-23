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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://georoutes.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GeoRoutes – Smarter Route Planning",
    template: "%s – GeoRoutes",
  },
  description: "Plan schedules, assign staff, and generate optimised routes for your field team — all in one tool. Free to start.",
  openGraph: {
    type: "website",
    siteName: "GeoRoutes",
    title: "GeoRoutes – Smarter Route Planning",
    description: "Plan schedules, assign staff, and generate optimised routes for your field team — all in one tool. Free to start.",
    url: SITE_URL,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "GeoRoutes – Smarter Route Planning" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoRoutes – Smarter Route Planning",
    description: "Plan schedules, assign staff, and generate optimised routes for your field team — all in one tool. Free to start.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "GeoRoutes",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: SITE_URL,
              description: "Route-optimised scheduling tool for field teams. Plan schedules, assign staff, and generate optimised routes using real road distances.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", name: "Free plan" },
              featureList: [
                "Route-optimised schedule generation",
                "Real road distance calculations",
                "Staff and appointment management",
                "Custom working windows",
                "UK postcode geocoding",
              ],
              inLanguage: "en-GB",
            }),
          }}
        />

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
                <span>© {new Date().getFullYear()} GeoRoutes. All rights reserved.</span>
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
