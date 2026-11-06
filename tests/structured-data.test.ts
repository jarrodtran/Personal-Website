import { describe, expect, it } from "vitest";
import { site, siteUrl } from "@/content/site";
import { caseStudyJsonLd } from "@/lib/structured-data";

type Node = Record<string, unknown>;

function graphOf(item: (typeof site.selectedWork)[number]): Node[] {
  const data = caseStudyJsonLd(item);
  expect(data["@context"]).toBe("https://schema.org");
  expect(Array.isArray(data["@graph"])).toBe(true);
  return data["@graph"] as Node[];
}

// rule:case-study-schema
describe("case study structured data", () => {
  it("emits one Article and one BreadcrumbList per case study", () => {
    expect(site.selectedWork.length).toBeGreaterThan(0);

    for (const item of site.selectedWork) {
      const nodes = graphOf(item);
      expect(nodes).toHaveLength(2);
      expect(nodes.filter((node) => node["@type"] === "Article")).toHaveLength(
        1,
      );
      expect(
        nodes.filter((node) => node["@type"] === "BreadcrumbList"),
      ).toHaveLength(1);
    }
  });

  it("describes the article with the page's own copy and URL", () => {
    for (const item of site.selectedWork) {
      const url = `${siteUrl}/work/${item.slug}/`;
      const article = graphOf(item).find((node) => node["@type"] === "Article");

      expect(article).toBeTruthy();
      expect(article!["headline"]).toBe(item.title);
      expect(article!["description"]).toBe(item.problem);
      expect(article!["url"]).toBe(url);
      expect(article!["mainEntityOfPage"]).toBe(url);
      expect((article!["author"] as Node)["name"]).toBe(
        site.positioning.name,
      );
      expect((article!["publisher"] as Node)["url"]).toBe(siteUrl);
    }
  });

  it("names the trail Home, Selected work, then the case study", () => {
    for (const item of site.selectedWork) {
      const url = `${siteUrl}/work/${item.slug}/`;
      const breadcrumb = graphOf(item).find(
        (node) => node["@type"] === "BreadcrumbList",
      );
      const entries = breadcrumb!["itemListElement"] as Node[];

      expect(entries).toHaveLength(3);
      expect(entries.map((entry) => entry["position"])).toEqual([1, 2, 3]);
      expect(entries.map((entry) => entry["name"])).toEqual([
        "Home",
        "Selected work",
        item.title,
      ]);
      expect(entries[2]["item"]).toBe(url);
    }
  });

  it("uses stable per-page ids and round-trips as JSON", () => {
    for (const item of site.selectedWork) {
      const url = `${siteUrl}/work/${item.slug}/`;
      const data = caseStudyJsonLd(item);
      const nodes = data["@graph"] as Node[];
      const ids = nodes.map((node) => node["@id"]);

      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(String(id).startsWith(url)).toBe(true);
      }

      const json = JSON.stringify(data);
      expect(json).not.toContain("</script");
      expect(JSON.parse(json)).toEqual(data);
    }
  });
});
