import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Picsum placeholders during early development.
    // Supabase Storage hosts user-uploaded product/chain photos in production.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default nextConfig;
