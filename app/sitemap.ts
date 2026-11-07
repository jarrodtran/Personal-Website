import type { MetadataRoute } from "next";
import { selectedWorkSlugs, siteUrl } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
    },
    ...selectedWorkSlugs().map((slug) => ({
      url: `${siteUrl}/work/${slug}/`,
    })),
  ];
}
