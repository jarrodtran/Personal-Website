import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeBasePath, withBasePath } from "@/lib/base-path";

const root = path.resolve(__dirname, "..");

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("normalizeBasePath", () => {
  it("treats missing, blank, and root values as no prefix", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("")).toBe("");
    expect(normalizeBasePath("   ")).toBe("");
    expect(normalizeBasePath("/")).toBe("");
  });

  it("normalizes a project Pages path to a single leading slash", () => {
    expect(normalizeBasePath("Personal-Website")).toBe("/Personal-Website");
    expect(normalizeBasePath("/Personal-Website")).toBe("/Personal-Website");
    expect(normalizeBasePath("/Personal-Website/")).toBe("/Personal-Website");
    expect(normalizeBasePath(" /Personal-Website/ ")).toBe("/Personal-Website");
  });
});

describe("withBasePath", () => {
  it("leaves site-root paths unchanged when the prefix is empty", () => {
    expect(withBasePath("/resume.pdf")).toBe("/resume.pdf");
    expect(withBasePath("/")).toBe("/");
    expect(withBasePath("/#work")).toBe("/#work");
  });

  it("prefixes root-absolute paths for the GitHub project Pages URL", () => {
    expect(withBasePath("/resume.pdf", "/Personal-Website")).toBe(
      "/Personal-Website/resume.pdf",
    );
    expect(withBasePath("/", "/Personal-Website")).toBe("/Personal-Website/");
    expect(withBasePath("/#work", "/Personal-Website")).toBe(
      "/Personal-Website/#work",
    );
    expect(withBasePath("/avatar.webp", "Personal-Website")).toBe(
      "/Personal-Website/avatar.webp",
    );
  });

  it("does not prefix hashes, mailto, or external URLs", () => {
    expect(withBasePath("#top", "/Personal-Website")).toBe("#top");
    expect(withBasePath("mailto:hi@example.com", "/Personal-Website")).toBe(
      "mailto:hi@example.com",
    );
    expect(withBasePath("https://jarrodtran.com", "/Personal-Website")).toBe(
      "https://jarrodtran.com",
    );
  });

  it("does not double-prefix a path that already includes the base", () => {
    expect(
      withBasePath("/Personal-Website/resume.pdf", "/Personal-Website"),
    ).toBe("/Personal-Website/resume.pdf");
  });
});

describe("deploy wiring", () => {
  it("reads basePath and assetPrefix from BASE_PATH instead of hardcoding the repo name", () => {
    const source = readSiteFile("next.config.ts");
    expect(source).toContain("process.env.BASE_PATH");
    expect(source).toMatch(/\bbasePath\b/);
    expect(source).toMatch(/\bassetPrefix\b/);
    expect(source).not.toMatch(/basePath:\s*["']\/Personal-Website["']/);
    expect(source).not.toMatch(/assetPrefix:\s*["']\/Personal-Website["']/);
  });

  it("sets BASE_PATH=/Personal-Website on the GitHub Pages deploy build", () => {
    expect(readSiteFile(".github/workflows/deploy.yml")).toMatch(
      /BASE_PATH:\s*\/Personal-Website/,
    );
  });

  it("keeps CI and Lighthouse on an empty BASE_PATH so apex-style /_next paths still verify", () => {
    expect(readSiteFile(".github/workflows/ci.yml")).not.toMatch(/BASE_PATH/);
    expect(readSiteFile(".github/workflows/lighthouse.yml")).not.toMatch(
      /BASE_PATH/,
    );
  });

  it("prefixes raw site-root hrefs and next/image src so they resolve under the project path", () => {
    const nav = readSiteFile("components/nav.tsx");
    const hero = readSiteFile("components/sections/hero.tsx");
    const contact = readSiteFile("components/sections/contact.tsx");
    const about = readSiteFile("components/sections/about.tsx");
    const postbuild = readSiteFile("scripts/postbuild.mjs");

    expect(nav).toContain("withBasePath");
    expect(hero).toContain("withBasePath");
    expect(contact).toContain("withBasePath");
    expect(about).toContain("withBasePath");
    expect(postbuild).toMatch(/\/icon\?/);
    expect(postbuild).not.toContain('href="/icon?');
  });
});
