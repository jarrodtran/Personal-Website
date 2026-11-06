import { describe, expect, it } from "vitest";
import robots, { RSC_PAYLOAD_DISALLOW } from "@/app/robots";
import { siteUrl } from "@/content/site";

type RuleGroup = {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

function firstRuleGroup(): RuleGroup {
  const { rules } = robots();
  const group = Array.isArray(rules) ? rules[0] : rules;
  expect(group, "robots must define a rule group").toBeTruthy();
  return group as RuleGroup;
}

describe("robots.txt", () => {
  it("keeps Next.js RSC payload files out of crawlers", () => {
    const { disallow } = firstRuleGroup();
    const patterns = Array.isArray(disallow) ? disallow : [disallow];

    for (const pattern of RSC_PAYLOAD_DISALLOW) {
      expect(patterns, `missing disallow ${pattern}`).toContain(pattern);
    }
  });

  it("covers every payload file the export writes", () => {
    // The export writes these four names at the site root and under each
    // route directory. A crawler URL must match one of the patterns.
    const paths = [
      "/index.txt",
      "/__next._full.txt",
      "/__next._tree.txt",
      "/__next.__PAGE__.txt",
      "/work/tesla-energy-ai-product/index.txt",
      "/work/tesla-energy-ai-product/__next._full.txt",
      "/work/tesla-energy-ai-product/__next._tree.txt",
    ];
    const { disallow } = firstRuleGroup();
    const patterns = (Array.isArray(disallow) ? disallow : [disallow]).filter(
      (pattern): pattern is string => typeof pattern === "string",
    );

    // robots.txt matching: a pattern is a prefix match unless it ends in "$",
    // and "*" matches any sequence. This mirrors how Google and Bing read it.
    const isDisallowed = (path: string) =>
      patterns.some((pattern) => {
        const endAnchored = pattern.endsWith("$");
        const body = endAnchored ? pattern.slice(0, -1) : pattern;
        const source = body
          .split("*")
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join(".*");
        return new RegExp(`^${source}${endAnchored ? "$" : ""}`).test(path);
      });

    for (const path of paths) {
      expect(isDisallowed(path), `${path} is crawlable`).toBe(true);
    }
  });

  it("still allows the site and points at the sitemap", () => {
    const group = firstRuleGroup();
    expect(group.userAgent).toBe("*");
    expect(group.allow).toBe("/");

    const { sitemap, host } = robots();
    expect(sitemap).toBe(`${siteUrl}/sitemap.xml`);
    expect(host).toBe(new URL(siteUrl).host);
  });

  it("does not disallow robots.txt itself", () => {
    const { disallow } = firstRuleGroup();
    const patterns = Array.isArray(disallow) ? disallow : [disallow];
    expect(patterns).not.toContain("/robots.txt");
    expect(patterns).not.toContain("/*");
  });
});
