/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  // Enable Turbopack explicitly (silences the warning)
  turbopack: {},

  // Vercel already sends Strict-Transport-Security; these are the standard
  // headers it does not. Deliberately no Content-Security-Policy: this site
  // loads AdSense, Leaflet tiles and Supabase, and a policy written without
  // testing each of those would break the page rather than protect it.
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
      // Redirect the old Vercel preview URL to the canonical domain.
      // The apex -> www redirect is configured in Vercel's domain settings,
      // not here, to avoid a loop if both layers try to redirect.
      {
        source: "/:path*",
        has: [{ type: "host", value: "georoute-bice.vercel.app" }],
        destination: "https://www.georoutes.co.uk/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
