import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

// rule:legacy-redirects
describe("legacy /work/ index route and the /writing/ archive", () => {
  it("leaves /work/ out of the sitemap and lists /writing/ only once it has essays", () => {
    const source = readSiteFile("app/sitemap.ts");
    expect(source).not.toMatch(/\$\{siteUrl\}\/work\/`/);
    expect(source).toContain("/work/${slug}/");
    expect(source).toMatch(
      /posts\.length > 0 \? \[\{ url: `\$\{siteUrl\}\/writing\/` \}\] : \[\]/,
    );
  });

  it("keeps case-study pages under /work/[slug]", () => {
    expect(existsSync(path.join(root, "app/work/[slug]/page.tsx"))).toBe(true);
  });

  it("sends /work/ through withBasePath to the home anchor", () => {
    const redirect = readSiteFile("components/legacy-redirect.tsx");
    expect(redirect).toContain("withBasePath");
    expect(redirect).toContain("/#");
    expect(redirect).not.toContain("Go to Writing");
    expect(redirect).toContain("Go to Work");
    expect(redirect).toMatch(/httpEquiv=["']refresh["']/);
    expect(redirect).not.toMatch(/rel=["']canonical["']/);
    expect(redirect).not.toMatch(/alternates\s*:/);
    expect(redirect).toMatch(/index:\s*false/);

    expect(readSiteFile("app/writing/page.tsx")).not.toContain(
      "LegacyRedirect",
    );
    expect(readSiteFile("app/work/page.tsx")).toContain("LegacyRedirect");
  });

  it("gives section anchors room to clear the sticky header", () => {
    expect(readSiteFile("components/section.tsx")).toMatch(/scroll-mt-24/);
    expect(readSiteFile("components/nav.tsx")).toContain("sticky top-0");
  });
});
