// Derived rather than hardcoded so the allowlist follows the project if the
// Supabase URL ever changes -- a stale hostname here would not fail the build,
// it would fail every header image at runtime, which is far harder to spot.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return null;
  }
})();

/**
 * Content-Security-Policy.
 *
 * Every origin below was measured by loading the real site and recording what
 * it actually requested, rather than guessed -- a policy written from memory
 * breaks the page instead of protecting it, which is why this was deferred
 * until it could be checked.
 *
 * Worth knowing: a CSP does not reach inside a cross-origin iframe. The Google
 * Form on /feedback pulls in a long tail of Google origins, but those are the
 * iframe's business under Google's own policy. All this file has to allow is
 * the frame itself.
 *
 * 'unsafe-inline' stays in script-src because Next.js emits inline bootstrap
 * scripts and the OpenNext adapter gives no practical way to nonce them. The
 * policy still blocks script from any origin not named here, which is the
 * injection route that actually matters.
 */
const CSP = [
  "default-src 'self'",
  // googletagmanager serves the GA tag itself.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  // Tailwind and Leaflet both set styles inline.
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src 'self' data: blob:",
    // OpenStreetMap tiles, across the a/b/c subdomains Leaflet rotates through.
    "https://*.tile.openstreetmap.org",
    // Header logo and banner uploaded through the admin editor.
    supabaseHost ? `https://${supabaseHost}` : "",
    // GA sometimes beacons via a pixel rather than fetch.
    "https://www.googletagmanager.com https://www.google-analytics.com",
  ]
    .filter(Boolean)
    .join(" "),
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    supabaseHost ? `https://${supabaseHost}` : "",
    // wss for Supabase auth's realtime channel.
    supabaseHost ? `wss://${supabaseHost}` : "",
    "https://www.google-analytics.com https://region1.google-analytics.com",
    // Postcode validation as it is typed.
    "https://api.postcodes.io",
  ]
    .filter(Boolean)
    .join(" "),
  // The feedback form, and nothing else.
  "frame-src https://docs.google.com",
  // No plugins, and no way to retarget a relative URL.
  "object-src 'none'",
  "base-uri 'self'",
  // Sign-in posts to Supabase; everything else posts to us.
  ["form-action 'self'", supabaseHost ? `https://${supabaseHost}` : ""]
    .filter(Boolean)
    .join(" "),
  // Matches the X-Frame-Options below, for browsers that prefer this one.
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimisation was previously off altogether, which meant <Image> served
  // whatever was uploaded at full size: the header logo was a 1536x1024 PNG of
  // 1.5MB, rendered into a 40px-tall slot, fetched with priority on every page.
  // Allowlisting the storage bucket lets Next resize and re-encode instead, so
  // an oversized admin upload cannot become a 1.5MB download for every visitor.
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  // Enable Turbopack explicitly (silences the warning)
  turbopack: {},

  // Strict-Transport-Security is set here because Vercel used to add it and
  // no longer does -- moving to Cloudflare silently dropped it, which is
  // exactly the kind of thing a platform change loses without complaint.
  //
  // Two years, subdomains included, no preload: preload is a one-way door
  // enforced by the browsers themselves, and is not worth taking until the
  // header has been running unproblematically for a while.
  //
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Stop browsers second-guessing a declared content type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nothing here is meant to be framed. The feedback page embeds a
          // Google Form, which is this site framing another -- unaffected.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Matters most for /r/<token>: a full referrer would carry the share
          // token to whatever a staff member opens next. The links themselves
          // already set rel="noreferrer"; this covers everything that does not.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No reason for this app to request any of these.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Apex to www lives in middleware.ts, not here. A host-matched redirect
      // in this file works correctly on Node but is broken by the Cloudflare
      // adapter, which leaves :path* unsubstituted and matches www as well as
      // the apex -- redirecting www to itself forever.
      //
      // The redirect from the old georoute-bice.vercel.app preview host is
      // gone with it. That project has been deleted, the hostname 404s at
      // Vercel's edge and never reaches this application, so the rule could
      // not fire even if the adapter handled it correctly.
    ];
  },
};

module.exports = nextConfig;
