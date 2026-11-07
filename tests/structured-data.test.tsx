import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CaseStudyPage from "@/app/work/[slug]/page";
import { selectedWorkSlugs, site, siteUrl } from "@/content/site";
import { breadcrumbJsonLd, caseStudyCrumbs } from "@/lib/structured-data";

const JSON_LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;

async function rendered(slug: string): Promise<string> {
  const element = await CaseStudyPage({ params: Promise.resolve({ slug }) });
  return renderToStaticMarkup(element);
}

describe("case study structured data", () => {
  it("mirrors the visible breadcrumb: Selected work, then the company", () => {
    for (const item of site.selectedWork) {
      const crumbs = caseStudyCrumbs(item);
      expect(crumbs.map((crumb) => crumb.name)).toEqual([
        "Selected work",
        item.panel.kicker,
      ]);
      // /work/ redirects to the home anchor, so the parent is that anchor.
      expect(crumbs[0].url).toBe(`${siteUrl}/#work`);
      // The last crumb is the page itself and carries no item URL.
      expect(crumbs[1].url).toBeUndefined();
    }
  });

  it("numbers the list items the way search engines expect", () => {
    const item = site.selectedWork[0];
    const jsonLd = breadcrumbJsonLd(caseStudyCrumbs(item));
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Selected work",
        item: `${siteUrl}/#work`,
      },
      { "@type": "ListItem", position: 2, name: item.panel.kicker },
    ]);
  });

  it("ships the block on every case-study page", async () => {
    for (const slug of selectedWorkSlugs()) {
      const html = await rendered(slug);
      const match = html.match(JSON_LD);
      expect(match, `${slug} has no JSON-LD`).not.toBeNull();
      const parsed = JSON.parse(match![1]);
      expect(parsed["@type"]).toBe("BreadcrumbList");
      expect(parsed.itemListElement).toHaveLength(2);
    }
  });
});
