import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { selectedWorkSlugs, siteUrl } from "@/content/site";

describe("sitemap", () => {
  it("emits only valid canonical URLs without artificial changefreq or priority", () => {
    const entries = sitemap();
    const slugs = selectedWorkSlugs();

    expect(entries).toHaveLength(1 + slugs.length);

    // Root entry
    expect(entries[0]).toEqual({
      url: siteUrl,
    });

    // Case study entries
    for (const slug of slugs) {
      const match = entries.find((e) => e.url === `${siteUrl}/work/${slug}/`);
      expect(match).toBeDefined();
      expect(match).not.toHaveProperty("priority");
      expect(match).not.toHaveProperty("changeFrequency");
      expect(match).not.toHaveProperty("lastModified");
    }
  });
});
