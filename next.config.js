/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⭐ Allow importing Leaflet PNGs
  images: {
    unoptimized: true,
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg)$/i,
      type: "asset/resource",
    });
    return config;
  },
};

module.exports = nextConfig;
