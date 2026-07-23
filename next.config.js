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
      // Redirect the old Vercel preview URL to the canonical domain
      {
        source: "/:path*",
        has: [{ type: "host", value: "georoute-bice.vercel.app" }],
        destination: "https://georoutes.co.uk/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
