import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";

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
    expect(notFound).not.toContain(`${site.positioning.name} · ${site.positioning.name}`);
  });
});
