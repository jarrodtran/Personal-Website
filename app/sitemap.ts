import type { MetadataRoute } from "next";
import { selectedWorkSlugs, site, siteUrl } from "@/content/site";
import { loadEssays, loadWritingResult } from "@/lib/writing";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /writing/ stays out until it lists an essay, matching its noindex.
  const { posts } = await loadWritingResult(site.substack, { limit: 1 });
  const essays = await loadEssays(site.substack);
  return [
    { url: `${siteUrl}/` },
    ...(posts.length > 0 ? [{ url: `${siteUrl}/writing/` }] : []),
    ...essays.map(({ post }) => ({
      url: `${siteUrl}${post.path}`,
      ...(post.date ? { lastModified: post.date } : {}),
    })),
    ...selectedWorkSlugs().map((slug) => ({
      url: `${siteUrl}/work/${slug}/`,
    })),
    { url: `${siteUrl}${site.contact.resumeHref}` },
  ];
}
