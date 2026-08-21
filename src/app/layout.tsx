import type { Metadata } from "next";

// GLOBAL STYLES
import "./globals.css";
import "@/styles/theme.css";
import "@/styles/utilities.css";
// Plain .css, not .module.css: every usage refers to these by literal class
// name (className="button button-primary"). As modules the names were hashed
// at build time, so none of these rules ever matched anything.
import "@/styles/Button.css";
import "@/styles/Input.css";
import "@/styles/Card.css";

import { ReactNode } from "react";
import Link from "next/link";
import HeaderLoader from "@/components/HeaderLoader";
import ThemeProvider from "@/components/ThemeProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ConsentBanner from "@/components/consent/ConsentBanner";
import ConsentSettingsLink from "@/components/consent/ConsentSettingsLink";
import ErrorReporter from "@/components/errors/ErrorReporter";
import ErrorBoundary from "@/components/errors/ErrorBoundary";
import ErrorNotice from "@/components/errors/ErrorNotice";

import { SITE_URL } from "@/lib/siteUrl";

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
              description: "Multipurpose route scheduler for teams visiting people at home. Handles several visits a day to the same person with a minimum gap between them, double-up visits, skills matching and recurring patterns — or single visits where that is all a round needs.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", name: "Free plan" },
              featureList: [
                "Route-optimised schedule generation",
                "Multiple visits per day to the same client, with a minimum gap",
                "Double-up visits requiring two staff",
                "Recurring daily and weekly visit patterns",
                "Real road distance calculations",
                "Skills-based staff matching",
                "Custom working windows and unpaid breaks",
                "UK postcode geocoding",
              ],
              inLanguage: "en-GB",
            }),
          }}
        />

        <ThemeProvider>
          <div className="flex min-h-screen flex-col">

            {/* Hidden until focused. Without it, reaching the page content by
                keyboard means tabbing through the whole navigation on every
                single page -- and the help section alone is nine links. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-teal-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
            >
              Skip to main content
            </a>

            <HeaderLoader />

            {/* Wraps only the page, not the header and footer: a render error
                in one route should leave the site navigable rather than
                replacing everything with an apology. */}
            <main id="main" tabIndex={-1} className="flex-1">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>

            <footer className="border-t border-slate-800 bg-slate-950/80">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-slate-400">
                <nav
                  aria-label="Footer"
                  className="flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  <Link href="/how-it-works" className="hover:text-slate-200">How it works</Link>
                  <Link href="/help" className="hover:text-slate-200">Help</Link>
                  <Link href="/pricing" className="hover:text-slate-200">Pricing</Link>
                  <Link href="/calendar" className="hover:text-slate-200">Calendar</Link>
                  <Link href="/security" className="hover:text-slate-200">Security</Link>
                  <Link href="/privacy" className="hover:text-slate-200">Privacy</Link>
                  <Link href="/terms" className="hover:text-slate-200">Terms</Link>
                  <Link href="/accessibility" className="hover:text-slate-200">Accessibility</Link>
                  <ConsentSettingsLink />
                </nav>

                <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>© {new Date().getFullYear()} GeoRoutes. All rights reserved.</span>
                  {/* Your clients' data never reaching us is the single most
                      useful thing a visitor can learn, so it says so on every
                      page rather than only in the policy nobody opens. */}
                  <span className="text-slate-400">
                    Client data stays in your browser — it never reaches our servers.
                  </span>
                </div>
              </div>
            </footer>

          </div>
        </ThemeProvider>

        {/* Vercel Analytics and Speed Insights were here; they only report
            when served from Vercel, so they went with the migration.
            Cloudflare measures traffic at the edge instead -- every request
            already passes through it, so that needs no script at all.

            Cloudflare Web Analytics (the RUM beacon, which would have added
            Core Web Vitals) is deliberately absent. Its collector lives at
            /cdn-cgi/rum, and on a Worker serving every path on the domain
            that route never reaches Cloudflare -- it 404s, the beacon retries
            cross-origin, and CORS blocks it. The result was a failed request
            and two console errors on every single page load, in exchange for
            no data. */}
        <GoogleAnalytics />
        <ConsentBanner />
        <ErrorReporter />
        <ErrorNotice />
      </body>
    </html>
  );
}
