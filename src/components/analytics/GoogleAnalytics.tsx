"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 in Google "advanced" consent mode.
 *
 * Consent defaults are declared denied for the UK, EEA and Switzerland before
 * the tag is configured. Under those defaults GA4 sets no cookies and no
 * identifiers; it sends only cookieless pings until a consent signal upgrades
 * it. Everywhere else the defaults are granted, because no prior-consent rule
 * applies there.
 *
 * The consent signal comes from the Funding Choices message. Because both are
 * Google tags sharing this dataLayer, Funding Choices issues the
 * consent-update itself once the user decides -- no wiring is needed here.
 *
 * Why not "basic" mode, which withholds the tag entirely until consent:
 * basic gets its consent decision through the googlefc callback queue, and
 * googlefc only loads with the AdSense tag. That made analytics conditional on
 * AdSense serving, so while this site sat unapproved -- and for Pro
 * subscribers, who never render an ad slot -- no analytics would have been
 * collected at all, silently. Advanced mode reports traffic from day one and
 * still sets no cookie on a UK visitor who has not agreed to one.
 */

/**
 * Regions where analytics and ad storage require prior consent, so the tag
 * must default to denied. EU 27 plus Iceland, Liechtenstein and Norway for the
 * EEA, plus the UK (PECR) and Switzerland (revised FADP).
 */
const CONSENT_REQUIRED_REGIONS = [
  "GB", "CH",
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  "IS", "LI", "NO",
];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function bootstrap(id: string): void {
  if (document.getElementById("ga4-tag")) return;

  window.dataLayer = window.dataLayer || [];
  // Deliberately a function declaration, not an arrow: gtag reads its own
  // `arguments` object, which arrow functions do not have.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  // Order within dataLayer is what matters, not script load order -- gtag.js
  // drains this queue when it arrives. The restrictive default is declared
  // first so it takes precedence in the regions it names.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    region: CONSENT_REQUIRED_REGIONS,
  });
  window.gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });

  window.gtag("js", new Date());
  window.gtag("config", id);

  const script = document.createElement("script");
  script.id = "ga4-tag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const started = useRef(false);

  useEffect(() => {
    if (!GA_ID || started.current) return;
    started.current = true;
    bootstrap(GA_ID);
  }, []);

  // App Router navigations do not reload the document, so GA4's automatic
  // page_view fires only for the entry page. Search params come from location
  // rather than useSearchParams(), which would opt every page inheriting the
  // root layout into dynamic rendering.
  useEffect(() => {
    if (!GA_ID || !started.current || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: `${pathname}${window.location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
