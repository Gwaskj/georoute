/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  // Enable Turbopack explicitly (silences the warning)
  turbopack: {},
};

module.exports = nextConfig;
