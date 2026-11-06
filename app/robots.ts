import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export const dynamic = "force-static";

/**
 * Keep Next.js RSC payloads out of search indexes.
 *
 * The static export writes client-navigation payloads as plain `.txt` files
 * (`/index.txt`, `/__next._full.txt`, `/__next._tree.txt`, and the same names
 * under each route). They must stay in `out/` so client navigation works, but
 * they mirror the HTML and are not pages. Google and Bing honour `*` here.
 */
export const RSC_PAYLOAD_DISALLOW = [
  "/__next.",
  "/*/__next.",
  "/index.txt",
  "/*/index.txt",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...RSC_PAYLOAD_DISALLOW],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: new URL(siteUrl).host,
  };
}
