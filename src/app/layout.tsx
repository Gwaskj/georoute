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

/**
 * One description, used for the meta tag, Open Graph and Twitter alike.
 *
 * They were three copies of the same string and had to be edited in step. Kept
 * just under 160 characters so Google shows it whole rather than truncating
 * mid-sentence.
 */
const SITE_DESCRIPTION =
  "Route-optimised rounds for UK community care and nursing teams. Repeat visits, double-ups and skills matching, with client data that stays in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Names the sector and the differentiator rather than describing generic
  // route planning, which every competitor's description also says. "Care
  // rota" and "community nursing" are what people actually search for; "field
  // team" is what software companies call them.
  title: {
    default: "GeoRoutes – Route-Optimised Scheduling for Care Teams",
    template: "%s – GeoRoutes",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "GeoRoutes",
    title: "GeoRoutes – Route-Optimised Scheduling for Care Teams",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_GB",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "GeoRoutes – route-optimised scheduling for care teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoRoutes – Route-Optimised Scheduling for Care Teams",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {/* One @graph rather than separate blocks, so the Organization and the
            SoftwareApplication can reference each other by @id. Without the
            Organization, Google has no entity to attach the site to and the
            publisher of every guide is anonymous. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "GeoRoutes",
                  url: SITE_URL,
                  logo: `${SITE_URL}/icon.svg`,
                  email: "support@georoutes.co.uk",
                  areaServed: { "@type": "Country", name: "United Kingdom" },
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "support@georoutes.co.uk",
                    availableLanguage: "English",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${SITE_URL}/#software`,
                  name: "GeoRoutes",
                  applicationCategory: "BusinessApplication",
                  applicationSubCategory: "Scheduling and route planning",
                  operatingSystem: "Web",
                  url: SITE_URL,
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  description:
                    "Route-optimised scheduling for community health and care teams visiting people at home. Handles several visits a day to the same person with a minimum gap, double-up visits, skills matching and recurring patterns. Client details stay in your browser and never reach our servers.",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "GBP",
                    name: "Free plan",
                  },
                  featureList: [
                    "Route-optimised schedule generation",
                    "Multiple visits per day to the same client, with a minimum gap",
                    "Double-up visits requiring two staff",
                    "Recurring daily and weekly visit patterns",
                    "Real road distance calculations",
                    "Skills-based staff matching",
                    "Custom working windows and unpaid breaks",
                    "UK postcode geocoding",
                    "Client data held in the browser, never on our servers",
                  ],
                  inLanguage: "en-GB",
                },
              ],
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
