import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("legacy /writing/ and /work/ index routes", () => {
  it("does not add the old index URLs to the sitemap", () => {
    const source = readSiteFile("app/sitemap.ts");
    expect(source).not.toContain("/writing/");
    expect(source).not.toMatch(/\$\{siteUrl\}\/work\/`/);
    expect(source).toContain("/work/${slug}/");
  });

  it("keeps case-study pages under /work/[slug]", () => {
    expect(existsSync(path.join(root, "app/work/[slug]/page.tsx"))).toBe(true);
  });

  it("sends both index pages through withBasePath to the home anchors", () => {
    const redirect = readSiteFile("components/legacy-redirect.tsx");
    expect(redirect).toContain("withBasePath");
    expect(redirect).toContain("/#");
    expect(redirect).toContain("Go to Writing");
    expect(redirect).toContain("Go to Work");
    expect(redirect).toMatch(/httpEquiv=["']refresh["']/);
    expect(redirect).toMatch(/rel=["']canonical["']/);
    expect(redirect).toMatch(/index:\s*false/);

    expect(readSiteFile("app/writing/page.tsx")).toContain("LegacyRedirect");
    expect(readSiteFile("app/work/page.tsx")).toContain("LegacyRedirect");
  });

  it("gives section anchors room to clear the sticky header", () => {
    expect(readSiteFile("components/section.tsx")).toMatch(/scroll-mt-24/);
    expect(readSiteFile("components/nav.tsx")).toContain("sticky top-0");
  });

  it("re-checks the exported redirect HTML after both CI builds", () => {
    const ci = readSiteFile(".github/workflows/ci.yml");
    expect(ci).toMatch(
      /run: pnpm build\n      - run: pnpm test:redirects\n      - run: pnpm test:tap/,
    );
    expect(ci).toMatch(
      /run: pnpm build\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm test:redirects\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm a11y/,
    );
  });
});
