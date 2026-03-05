import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "img.harunalegging.shop",
      },
      {
        protocol: "https",
        hostname: "video.dramahd.net",
      },
    ],
  },
};

export default nextConfig;
