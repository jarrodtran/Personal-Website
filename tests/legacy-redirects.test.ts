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

function assertRedirectPage(
  file: string,
  hash: "writing" | "work",
  label: string,
) {
  const html = readOut(file);
  const target = withBasePath(`/#${hash}`);
  const href = new RegExp(`href="${escapeRegExp(target)}"`);

  expect(existsSync(path.join(root, file)), file).toBe(true);
  expect(html, file).toMatch(/http-equiv=["']refresh["']/i);
  expect(html, file).toContain(`url=${target}`);
  expect(html, file).toMatch(/rel=["']canonical["']/i);
  expect(html, file).toContain(target);
  expect(html, file).toMatch(href);
  expect(html, file).toContain(label);
  expect(html, file).toMatch(/noindex/i);
  expect(html, file).not.toMatch(/<script[^>]*>[\s\S]*location\.(href|replace)/i);
}

describe("exported /writing/ and /work/ redirects", () => {
  it("writes index HTML that points at the current-base-path home anchors", () => {
    assertRedirectPage("out/writing/index.html", "writing", "Go to Writing");
    assertRedirectPage("out/work/index.html", "work", "Go to Work");
  });

  it("keeps case-study pages and leaves the old index URLs out of the sitemap", () => {
    for (const slug of selectedWorkSlugs()) {
      expect(existsSync(path.join(root, `out/work/${slug}/index.html`))).toBe(
        true,
      );
    }

    const sitemap = readOut("out/sitemap.xml");
    expect(sitemap).not.toContain("/writing/");
    expect(sitemap).not.toMatch(/https:\/\/jarrodtran\.com\/work\/<\/loc>/);
    expect(sitemap).toContain("/work/tesla-energy-ai-product/");
  });
});
