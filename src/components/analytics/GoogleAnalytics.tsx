"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4, running permanently cookieless in the UK, EEA and
 * Switzerland.
 *
 * Consent defaults are declared denied for those regions before the tag is
 * configured, so GA4 sets no cookies and no identifiers there and sends only
 * cookieless pings. Everywhere else the defaults are granted, because no
 * prior-consent rule applies.
 *
 * ConsentBanner is what upgrades analytics_storage to granted, and only for
 * visitors who press Accept. Until then this tag stores nothing, which is
 * what makes showing the banner lawful in the first place -- PECR requires
 * prior consent for storing or accessing anything on a device, so the asking
 * cannot happen after the storing.
 *
 * The three advertising purposes stay denied permanently and nothing ever
 * updates them: there is no advertising on this site, and granting a purpose
 * nobody was asked about would be worse than not having the tag at all.
 *
 * A visitor who declines, or ignores the banner, stays exactly where the
 * defaults put them: cookieless pings, page views counted, returning visitors
 * indistinguishable from new ones.
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
