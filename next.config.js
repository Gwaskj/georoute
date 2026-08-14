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

  // Vercel already sends Strict-Transport-Security; these are the standard
  // headers it does not. Deliberately no Content-Security-Policy: this site
  // loads Leaflet tiles, Supabase and Google Analytics, and a policy written
  // without testing each of those would break the page rather than protect it.
  // Worth revisiting now that AdSense is gone -- it was much the messiest of
  // the origins to allow for.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
