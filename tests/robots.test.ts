import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import robots from "../app/robots";

type Crawl = "allow" | "disallow";

const root = path.resolve(__dirname, "..");
const robotsFile = path.join(root, "out", "robots.txt");
const requireExport = process.env.ROBOTS_REQUIRE_EXPORT === "1";

const payloadPaths = [
  "/index.txt",
  "/index.txt?_rsc=1",
  "/__next._full.txt",
  "/__next.__PAGE__.txt",
  "/__next._tree.txt",
  "/writing/index.txt",
  "/writing/__next._full.txt",
  "/writing/__next._tree.txt",
  "/writing/__next.writing.__PAGE__.txt",
  "/work/index.txt",
  "/work/__next.work.__PAGE__.txt",
  "/work/tesla-energy-ai-product/index.txt",
  "/work/tesla-energy-ai-product/__next._full.txt",
  "/work/tesla-energy-ai-product/__next._tree.txt",
  "/work/tesla-energy-ai-product/__next.work.$d$slug.__PAGE__.txt",
  "/_not-found/index.txt",
  "/_not-found/__next._not-found.__PAGE__.txt",
];

const allowedPaths = [
  "/",
  "/writing/",
  "/writing/?utm=1",
  "/work/",
  "/work/tesla-energy-ai-product/",
  "/index.html",
  "/writing/index.html",
  "/work/tesla-energy-ai-product/index.html",
  "/404.html",
  "/404/",
  "/_not-found/",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/resume.pdf",
  "/icon.png",
  "/opengraph-image.png",
  "/_next/static/chunks/app.js",
];

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function patternMatches(pattern: string, url: string): boolean {
  let source = pattern;
  let anchorEnd = false;
  if (source.endsWith("$")) {
    anchorEnd = true;
    source = source.slice(0, -1);
  }

  let body = "";
  for (const char of source) {
    if (char === "*") {
      body += ".*";
      continue;
    }
    body += char.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
  }

  return new RegExp(`^${body}${anchorEnd ? "$" : ""}`).test(url);
}

function crawlDecision(
  url: string,
  allow: readonly string[],
  disallow: readonly string[],
): Crawl {
  let best: { kind: Crawl; length: number } | undefined;

  for (const pattern of allow) {
    if (!patternMatches(pattern, url)) continue;
    if (!best || pattern.length >= best.length) {
      best = { kind: "allow", length: pattern.length };
    }
  }

  for (const pattern of disallow) {
    if (!patternMatches(pattern, url)) continue;
    if (!best || pattern.length > best.length) {
      best = { kind: "disallow", length: pattern.length };
    }
  }

  return best?.kind ?? "allow";
}

function starRules(result: ReturnType<typeof robots>): {
  allow: string[];
  disallow: string[];
} {
  const groups = Array.isArray(result.rules) ? result.rules : [result.rules];
  expect(groups).toHaveLength(1);
  expect(asList(groups[0]?.userAgent ?? "*")).toEqual(["*"]);
  return {
    allow: asList(groups[0]?.allow),
    disallow: asList(groups[0]?.disallow),
  };
}

function rulesFromRobotsTxt(text: string): {
  allow: string[];
  disallow: string[];
} {
  const allow: string[] = [];
  const disallow: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "allow") allow.push(value);
    if (key === "disallow") disallow.push(value);
  }
  return { allow, disallow };
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }
  return files;
}

function pageUrls(relative: string): string[] {
  const fileUrl = `/${relative.split(path.sep).join("/")}`;
  if (relative === "index.html") return ["/", fileUrl];
  if (relative.endsWith(`${path.sep}index.html`)) {
    const directory = relative.slice(0, -"index.html".length);
    return [`/${directory.split(path.sep).join("/")}`, fileUrl];
  }
  return [fileUrl];
}

describe("robots RSC payloads", () => {
  it("follows Google path matching, with the longer rule winning", () => {
    expect(patternMatches("/fish", "/fish.html")).toBe(true);
    expect(patternMatches("/fish", "/shark")).toBe(false);
    expect(patternMatches("/*.php$", "/folder/file.php")).toBe(true);
    expect(patternMatches("/*.php$", "/folder/file.php?x=1")).toBe(false);
    expect(patternMatches("/*/index.txt", "/writing/index.html")).toBe(false);
    expect(crawlDecision("/page", ["/page"], ["/page"])).toBe("allow");
    expect(crawlDecision("/index.txt", ["/"], ["/index.txt"])).toBe("disallow");
    expect(crawlDecision("/", ["/"], ["/index.txt"])).toBe("allow");
  });

  it("disallows payload paths and allows HTML pages", () => {
    const result = robots();
    const { allow, disallow } = starRules(result);

    expect(result.sitemap).toBe("https://jarrodtran.com/sitemap.xml");
    expect(result.host).toBe("jarrodtran.com");
    expect(allow).toContain("/");
    expect(disallow).not.toContain("/");

    for (const url of payloadPaths) {
      expect(crawlDecision(url, allow, disallow), url).toBe("disallow");
    }
    for (const url of allowedPaths) {
      expect(crawlDecision(url, allow, disallow), url).toBe("allow");
    }
  });
});

describe.skipIf(!existsSync(robotsFile) && !requireExport)(
  "built robots.txt",
  () => {
    it("disallows every payload file and allows every other built file", () => {
      if (!existsSync(robotsFile)) {
        throw new Error("robots export test needs a production build in out/");
      }

      const text = readFileSync(robotsFile, "utf8");
      const { allow, disallow } = rulesFromRobotsTxt(text);
      const outDir = path.dirname(robotsFile);
      let payloads = 0;
      const pages: string[] = [];

      expect(text).toContain("Sitemap: https://jarrodtran.com/sitemap.xml");
      expect(text).toContain("Host: jarrodtran.com");
      expect(text).toMatch(/^Allow: \/$/m);
      expect(disallow).not.toContain("/");

      for (const file of walk(outDir)) {
        const relative = path.relative(outDir, file);
        const base = path.basename(relative);
        if (
          relative.endsWith(".txt") &&
          base !== "robots.txt" &&
          base !== "llms.txt"
        ) {
          const url = `/${relative.split(path.sep).join("/")}`;
          payloads += 1;
          expect(crawlDecision(url, allow, disallow), url).toBe("disallow");
          continue;
        }

        const urls = relative.endsWith(".html")
          ? pageUrls(relative)
          : [`/${relative.split(path.sep).join("/")}`];
        pages.push(...urls);
        for (const url of urls) {
          expect(crawlDecision(url, allow, disallow), url).toBe("allow");
        }
      }

      expect(payloads).toBeGreaterThan(0);
      expect(pages).toContain("/");
      expect(pages).toContain("/writing/");
      expect(pages).toContain("/work/tesla-energy-ai-product/");
    });
  },
);
