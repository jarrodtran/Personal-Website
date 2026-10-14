import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { site } from "@/content/site";

const types: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

function withoutBasePath(pathname: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }
  return pathname;
}

const built = existsSync(join(process.cwd(), "out/index.html"));

if (!built) {
  throw new Error("tap-targets test needs a production build in out/");
}

describe("390px tap targets and first screen", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    const server = createServer(async (request, response) => {
      const { pathname } = new URL(request.url ?? "/", "http://localhost");
      const stripped = withoutBasePath(pathname);
      const path = stripped.endsWith("/") ? `${stripped}index.html` : stripped;
      const file = join("out", normalize(decodeURIComponent(path)));
      try {
        const body = await readFile(file);
        response.writeHead(200, {
          "content-type": types[extname(file)] ?? "",
        });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind");
    }
    origin = `http://127.0.0.1:${address.port}${basePath}`;
    close = () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
  });

  afterAll(async () => {
    await close();
  });

  async function open(path: string) {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
    });
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    return { browser, page };
  }

  it("keeps every visible link and button at least 44px tall", async () => {
    for (const path of ["/", "/work/tesla-energy-ai-product/"]) {
      const { browser, page } = await open(path);
      const short = await page.evaluate(() => {
        return [...document.querySelectorAll("a, button")]
          .filter((control) => {
            const style = getComputedStyle(control);
            const box = control.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              box.width > 1 &&
              box.height > 1
            );
          })
          .filter((control) => control.getBoundingClientRect().height < 44)
          .map((control) => {
            const name =
              control.getAttribute("aria-label") ||
              control.textContent?.trim() ||
              control.getAttribute("href") ||
              control.tagName;
            return `${name}: ${control.getBoundingClientRect().height.toFixed(1)}px`;
          });
      });
      await browser.close();
      expect(short, `${path} short controls`).toEqual([]);
    }
  });

  it("does not scroll sideways at 390px", async () => {
    const { browser, page } = await open("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    await browser.close();
    expect(overflow).toBe(false);
  });

  it("shows name, writing line, then Subscribe coming soon", async () => {
    const { browser, page } = await open("/");
    const order = await page.evaluate(() => {
      const hero = document.getElementById("top");
      if (!hero) return [];
      return (hero.innerText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    });
    await browser.close();
    expect(order).toEqual([
      site.positioning.name,
      site.positioning.headline,
      "Subscribe",
      "Coming soon",
    ]);
  });

  it("keeps impact metrics below the first screen at 390px", async () => {
    const { browser, page } = await open("/");
    const belowFold = await page.evaluate(() => {
      const highlights = document.querySelector(
        '[aria-label="Impact highlights"]',
      );
      if (!highlights) return true;
      return highlights.getBoundingClientRect().top >= window.innerHeight;
    });
    await browser.close();
    expect(belowFold).toBe(true);
  });

  it("resolves résumé, email, LinkedIn, and the next case-study link", async () => {
    const { browser, page } = await open("/");
    const home = await page.evaluate(() => {
      const resume = document.querySelector<HTMLAnchorElement>(
        "header a[download]",
      );
      const email = document.querySelector<HTMLAnchorElement>(
        'a[href^="mailto:"]',
      );
      const linkedin = document.querySelector<HTMLAnchorElement>(
        'a[href*="linkedin.com"]',
      );
      return {
        resume: resume?.getAttribute("href"),
        email: email?.getAttribute("href"),
        linkedin: linkedin?.getAttribute("href"),
      };
    });
    await browser.close();
    expect(home.resume).toMatch(/resume\.pdf$/);
    expect(home.email).toBe(`mailto:${site.contact.email}`);
    expect(home.linkedin).toBe(site.contact.linkedin);

    const casePage = await open("/work/tesla-energy-ai-product/");
    const nextHref = await casePage.page
      .locator("a", { hasText: "Next:" })
      .getAttribute("href");
    await casePage.browser.close();
    expect(nextHref).toMatch(/\/work\/tesla-energy-portfolio\/?$/);
  });
});
