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
 * There is deliberately nothing that ever upgrades those defaults to granted.
 * The consent signal used to come from the Funding Choices message, which
 * loaded as part of the AdSense tag; AdSense has since been removed, so no
 * consent framework runs on the site at all.
 *
 * That leaves a genuinely clean position rather than a broken one. PECR
 * requires prior consent for storing or accessing information on a device,
 * and under denied consent this tag does neither -- so no cookie banner is
 * required, and none is shown. The cost is that UK and EEA sessions are
 * reported without a client identifier: page views and traffic sources still
 * arrive, returning visitors cannot be distinguished from new ones. For
 * knowing which pages get read, that is enough.
 *
 * Restoring full measurement would mean adding a consent banner and calling
 * gtag("consent", "update", ...) on acceptance. Worth doing only if the
 * per-user detail is actually needed, since it trades a clean no-banner site
 * for a cookie prompt on every first visit.
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
