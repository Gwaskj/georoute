// Canonical origin for the site. Used for metadata, sitemap, and robots so
// they can never drift apart. Override per-environment with NEXT_PUBLIC_SITE_URL
// (e.g. preview deployments); it must be an absolute origin.
//
// Note the explicit blank check: `??` alone would accept an empty or
// whitespace-only env var, which then flows into `new URL()` and throws at
// build time. Trailing slashes are stripped so callers can safely append paths.
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (
  configured ? configured : "https://www.georoutes.co.uk"
).replace(/\/+$/, "");
