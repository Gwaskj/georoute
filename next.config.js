/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // ⬅️ This forces Webpack instead of Turbopack
  },
};

module.exports = nextConfig;
