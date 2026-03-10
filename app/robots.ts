import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site-url";

/**
 * robots.txt — cho phép bot index các trang công khai, chặn Dashboard và trang nội bộ.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"],
    },
    ...(baseUrl
      ? { sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml` }
      : {}),
  };
}
