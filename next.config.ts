import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cho phép upload file lớn lên R2 (route /api/dashboard/r2/upload cho phép tối đa 512MB)
    proxyClientMaxBodySize: "5120mb",
  },
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
