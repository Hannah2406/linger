import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Item images come from arbitrary retailer hostnames; we use plain <img>.
    unoptimized: true,
  },
};

export default nextConfig;
