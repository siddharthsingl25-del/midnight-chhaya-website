import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Picsum placeholders during development — remove once /public/products/ is filled.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.ibb.co" },
    ],
  },
};

export default nextConfig;
