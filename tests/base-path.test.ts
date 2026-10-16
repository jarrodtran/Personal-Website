import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeBasePath, withBasePath } from "@/lib/base-path";
import {
  patchHtmlContent,
  unprefixedRootAssets,
} from "../scripts/postbuild.mjs";

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
  it("tells agents that production is jarrodtran.com with an empty deploy BASE_PATH", () => {
    const readme = readSiteFile("README.md");
    expect(readme).toContain("https://jarrodtran.com");
    expect(readme).toMatch(/This repo is live at/);
    expect(readme).not.toMatch(/jarrodtran\.com is not served from this repo yet/);
    expect(readme).not.toMatch(
      /The deploy build sets `BASE_PATH=\/Personal-Website`/,
    );
    expect(readme).not.toMatch(/Moving jarrodtran\.com to this repo \(pending\)/);
    expect(readme).not.toMatch(/project Pages preview path/);
    expect(readme).not.toMatch(
      /pull-request preview of `https:\/\/jarrodtran\.github\.io\/Personal-Website\/`/,
    );
    expect(readme).toMatch(/prefixed-build check only/);
    expect(readme).toMatch(/Pull requests do not deploy a preview/);
    expect(readme).toMatch(/Do not edit DNS/);
  });

  it("reads basePath and assetPrefix from BASE_PATH instead of hardcoding the repo name", () => {
    const source = readSiteFile("next.config.ts");
    expect(source).toContain("process.env.BASE_PATH");
    expect(source).toMatch(/\bbasePath\b/);
    expect(source).toMatch(/\bassetPrefix\b/);
    expect(source).not.toMatch(/basePath:\s*["']\/Personal-Website["']/);
    expect(source).not.toMatch(/assetPrefix:\s*["']\/Personal-Website["']/);
  });

  it("builds the GitHub Pages deploy with an empty or absent BASE_PATH, not at job level", () => {
    const deploy = readSiteFile(".github/workflows/deploy.yml");
    expect(deploy).not.toMatch(
      /run: pnpm build\n        env:\n          BASE_PATH:\s*\/Personal-Website/,
    );
    const buildEnv = deploy.match(
      /run: pnpm build\n        env:\n          BASE_PATH:\s*(\S*)/,
    );
    if (buildEnv) {
      expect(buildEnv[1]).toMatch(/^['"]?['"]?$/);
    }
    expect(deploy).toMatch(/run: pnpm build\n/);
    expect(deploy).not.toMatch(/^ {4}env:\n {6}BASE_PATH:/m);
    expect(deploy).not.toMatch(/Project Pages preview lives at \/Personal-Website/);
    expect(deploy).toMatch(/No preview is deployed/);
  });

  it("keeps Lighthouse and the default CI build on an empty BASE_PATH so apex-style /_next paths still verify", () => {
    expect(readSiteFile(".github/workflows/lighthouse.yml")).not.toMatch(
      /BASE_PATH/,
    );
    expect(readSiteFile(".github/workflows/ci.yml")).toMatch(
      /run: pnpm build\n      - run: pnpm test:redirects\n      - run: pnpm test:titles\n      - run: pnpm test:tap/,
    );
  });

  it("re-runs the deploy-path build, a11y, and size checks in PR CI", () => {
    expect(readSiteFile(".github/workflows/ci.yml")).toMatch(
      /run: pnpm build\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm test:redirects\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm test:titles\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm a11y\n        env:\n          BASE_PATH:\s*\/Personal-Website\n      - run: pnpm size\n        env:\n          BASE_PATH:\s*\/Personal-Website/,
    );
  });

  it("prefixes raw site-root hrefs and next/image src so they resolve under the project path", () => {
    const nav = readSiteFile("components/nav.tsx");
    const contact = readSiteFile("components/sections/contact.tsx");
    const about = readSiteFile("components/sections/about.tsx");
    const postbuild = readSiteFile("scripts/postbuild.mjs");

    expect(nav).toContain("withBasePath");
    expect(contact).toContain("withBasePath");
    expect(about).toContain("withBasePath");
    expect(postbuild).toMatch(/\/icon\?/);
    expect(postbuild).not.toContain('href="/icon?');
  });

  it("adds .png to generated icon/og files and prefixes the icon href when BASE_PATH is set", () => {
    const html =
      '<link rel="icon" href="/icon?hash"/><meta property="og:image" content="https://jarrodtran.com/opengraph-image?x"/>';
    expect(patchHtmlContent(html, "")).toBe(
      '<link rel="icon" href="/icon.png?hash"/><meta property="og:image" content="https://jarrodtran.com/opengraph-image.png?x"/>',
    );
    expect(patchHtmlContent(html, "/Personal-Website")).toBe(
      '<link rel="icon" href="/Personal-Website/icon.png?hash"/><meta property="og:image" content="https://jarrodtran.com/opengraph-image.png?x"/>',
    );
  });

  it("prefixes icon, apple-touch, and favicon hrefs in HTML and the RSC payload", () => {
    const html = [
      '<link rel="icon" href="/icon?abc"/>',
      '<link rel="apple-touch-icon" href="/apple-icon?def"/>',
      '<link rel="shortcut icon" href="/favicon.ico"/>',
      '["$","link","23",{"rel":"icon","href":"/icon?abc"}]',
      '["$","link","24",{"rel":"apple-touch-icon","href":"/apple-icon?def"}]',
    ].join("");

    const patched = patchHtmlContent(html, "/Personal-Website");

    expect(patched).toContain('href="/Personal-Website/icon.png?abc"');
    expect(patched).toContain('href="/Personal-Website/apple-icon.png?def"');
    expect(patched).toContain('href="/Personal-Website/favicon.ico"');
    expect(patched).toContain('"href":"/Personal-Website/icon.png?abc"');
    expect(patched).toContain('"href":"/Personal-Website/apple-icon.png?def"');
    expect(patched).not.toMatch(/href="\/icon(?:\.png)?/);
    expect(patched).not.toMatch(/"href":"\/icon(?:\.png)?/);
    expect(patched).not.toMatch(/href="\/apple-icon/);
    expect(patched).not.toMatch(/"href":"\/apple-icon/);
    expect(patched).not.toContain('href="/favicon.ico"');
  });

  it("leaves icon hrefs at site root when BASE_PATH is unset", () => {
    const html =
      '<link rel="icon" href="/icon?abc"/><link rel="apple-touch-icon" href="/apple-icon"/>';
    expect(patchHtmlContent(html, "")).toBe(
      '<link rel="icon" href="/icon.png?abc"/><link rel="apple-touch-icon" href="/apple-icon.png"/>',
    );
  });

  it("fails the BASE_PATH export if built HTML still has a root-relative asset", () => {
    const html =
      '<link rel="icon" href="/Personal-Website/icon.png?h"/>' +
      '["$","link","23",{"rel":"icon","href":"/icon.png?h"}]';
    expect(unprefixedRootAssets(html, "/Personal-Website")).toEqual([
      "/icon.png?h",
    ]);
    expect(
      unprefixedRootAssets(
        patchHtmlContent(html, "/Personal-Website"),
        "/Personal-Website",
      ),
    ).toEqual([]);
    expect(unprefixedRootAssets(html, "")).toEqual([]);
  });

  it("ignores in-page hashes, routes, and already-prefixed assets", () => {
    expect(
      unprefixedRootAssets(
        '<a href="#content"></a><a href="/work/tesla/"></a>' +
          '<img src="/Personal-Website/avatar.webp"/>' +
          '{"resumeHref":"/resume.pdf","href":"/"}',
        "/Personal-Website",
      ),
    ).toEqual([]);
  });

  it("declares metadata icons through withBasePath so apple-touch and icon hrefs follow BASE_PATH", () => {
    const layout = readSiteFile("app/layout.tsx");
    expect(layout).toContain("withBasePath");
    expect(layout).toMatch(/icons\s*:/);
    expect(layout).toMatch(/apple\s*:/);
  });
});
