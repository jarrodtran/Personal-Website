import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { selectedWorkSlugs, site, siteUrl } from "@/content/site";

const root = path.resolve(__dirname, "..");

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function pageTitle(html: string): string {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  expect(match, "expected a <title> tag").not.toBeNull();
  return match![1]
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&#183;/g, "·")
    .trim();
}

describe("route tab titles", () => {
  // rule:404-title-absolute
  it("gives the 404 its own absolute title instead of the home documentTitle", () => {
    const source = readSiteFile("app/not-found.tsx");
    expect(source).toMatch(/title:\s*\{/);
    expect(source).toContain("absolute:");
    expect(source).toContain("Page not found");
    expect(source).toContain("site.positioning.name");
    expect(source).not.toContain("documentTitle");
  });

  it("writes distinct titles into the static export", () => {
    if (!existsSync(path.join(root, "out/index.html"))) {
      throw new Error("page-titles test needs a production build in out/");
    }

    const home = pageTitle(readSiteFile("out/index.html"));
    const notFound = pageTitle(readSiteFile("out/404.html"));
    const notFoundRoute = pageTitle(readSiteFile("out/_not-found/index.html"));

    expect(home).toBe(site.positioning.documentTitle);
    expect(notFound).toBe(`Page not found · ${site.positioning.name}`);
    expect(notFoundRoute).toBe(notFound);
    expect(notFound).not.toBe(home);
    expect(notFound).not.toContain(
      `${site.positioning.name} · ${site.positioning.name}`,
    );
  });
  it("publishes only self-canonicals and excludes fallback routes from indexing", () => {
    const routes = [
      "/",
      ...selectedWorkSlugs().map((slug) => `/work/${slug}/`),
    ];
    for (const route of routes) {
      const html = readSiteFile(`out${route}index.html`);
      const url = `${siteUrl}${route}`;
      expect(html.match(/<link rel="canonical"[^>]*>/g)).toEqual([
        `<link rel="canonical" href="${url}"/>`,
      ]);
      expect(html).toContain(`<meta property="og:url" content="${url}"/>`);
      if (route !== "/") {
        expect(html).toContain('<meta property="og:locale" content="en_US"/>');
        expect(html).toContain(
          '<meta property="og:site_name" content="Jarrod Tran"/>',
        );
        const breadcrumbs = [
          ...html.matchAll(
            /<script type="application\/ld\+json">(.*?)<\/script>/g,
          ),
        ]
          .map(([, payload]) => JSON.parse(payload))
          .filter((data) => data["@type"] === "BreadcrumbList");
        expect(breadcrumbs).toHaveLength(1);
        expect(breadcrumbs[0].itemListElement[0].item).toBe(`${siteUrl}/#work`);
      }
    }

    // /writing/ stays noindex until the feed lists an essay, then it is a
    // self-canonical page in the sitemap.
    const writingHtml = readSiteFile("out/writing/index.html");
    const writingListed = !writingHtml.includes('content="noindex');
    if (writingListed) {
      expect(writingHtml.match(/<link rel="canonical"[^>]*>/g)).toEqual([
        `<link rel="canonical" href="${siteUrl}/writing/"/>`,
      ]);
    }

    for (const [file, robots] of [
      ["404.html", "noindex"],
      ["_not-found/index.html", "noindex"],
      ["work/index.html", "noindex, follow"],
      ...(writingListed ? [] : [["writing/index.html", "noindex, follow"]]),
    ]) {
      const html = readSiteFile(`out/${file}`);
      expect(html).not.toMatch(/rel="canonical"|property="og:url"/);
      expect(html.match(/<meta name="robots"[^>]*>/g)).toEqual([
        `<meta name="robots" content="${robots}"/>`,
      ]);
    }

    const sitemap = readSiteFile("out/sitemap.xml");
    expect(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url),
    ).toEqual([
      `${siteUrl}/`,
      ...(writingListed ? [`${siteUrl}/writing/`] : []),
      ...routes.slice(1).map((route) => `${siteUrl}${route}`),
      `${siteUrl}${site.contact.resumeHref}`,
    ]);
    expect(sitemap).not.toMatch(/<lastmod>|<changefreq>|<priority>/);
  });
});
