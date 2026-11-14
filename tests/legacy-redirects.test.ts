import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { selectedWorkSlugs } from "@/content/site";
import { withBasePath } from "@/lib/base-path";

const root = path.resolve(__dirname, "..");
const built = existsSync(path.join(root, "out/index.html"));

if (!built) {
  throw new Error("legacy-redirects test needs a production build in out/");
}

function readOut(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertRedirectPage(file: string, hash: "work", label: string) {
  const html = readOut(file);
  const target = withBasePath(`/#${hash}`);
  const href = new RegExp(`href="${escapeRegExp(target)}"`);

  expect(existsSync(path.join(root, file)), file).toBe(true);
  expect(html, file).toMatch(/http-equiv=["']refresh["']/i);
  expect(html, file).toContain(`url=${target}`);
  expect(html, file).toContain(target);
  expect(html, file).toMatch(href);
  expect(html, file).toContain(label);
  expect(html, file).toMatch(/noindex/i);
  expect(html, file).not.toMatch(
    /<script[^>]*>[\s\S]*location\.(href|replace)/i,
  );

  const canonicals = [
    ...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi),
  ].map(([tag]) => tag);
  expect(canonicals, file).toHaveLength(0);
}

// rule:legacy-redirects
describe("exported /work/ redirect and /writing/ archive", () => {
  it("writes /work/ index HTML that points at the current-base-path home anchor", () => {
    assertRedirectPage("out/work/index.html", "work", "Go to Work");
  });

  it("writes /writing/ as the essay archive, not a redirect", () => {
    const html = readOut("out/writing/index.html");
    expect(html).not.toMatch(/http-equiv=["']refresh["']/i);
    expect(html).toMatch(/<h1\b[^>]*>Worth Mulling<\/h1>/);
  });

  it("keeps case-study pages and lists /writing/ only when it has essays", () => {
    for (const slug of selectedWorkSlugs()) {
      expect(existsSync(path.join(root, `out/work/${slug}/index.html`))).toBe(
        true,
      );
    }

    const sitemap = readOut("out/sitemap.xml");
    const archive = readOut("out/writing/index.html");
    const hasEssays = !/noindex/i.test(archive);
    expect(sitemap.includes("/writing/")).toBe(hasEssays);
    expect(sitemap).not.toMatch(/https:\/\/jarrodtran\.com\/work\/<\/loc>/);
    expect(sitemap).toContain("/work/tesla-energy-ai-product/");
  });
});
