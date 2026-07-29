/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  // Enable Turbopack explicitly (silences the warning)
  turbopack: {},

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
