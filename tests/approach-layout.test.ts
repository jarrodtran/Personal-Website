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

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("approach layout test needs a production build in out/");
}

// Measured on main 25b5066. 200% text is
// document.documentElement.style.fontSize = "200%", not browser zoom.
const MAIN_APPROACH_HEIGHT_768_200 = 5031.5;

describe("how I work layout", () => {
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

  async function openApproach(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme: "light",
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    if (textPercent === 200) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
    }
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const done = () => requestAnimationFrame(() => resolve());
          if (document.fonts.status === "loaded") {
            done();
            return;
          }
          document.fonts.ready.then(done).catch(done);
        }),
    );
    await page.waitForTimeout(300);
    return { browser, page };
  }

  async function measureApproach(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const { browser, page } = await openApproach(width, height, textPercent);
    const layout = await page.evaluate((expectedTitles) => {
      const approach = document.getElementById("approach");
      const titles = [...(approach?.querySelectorAll("h3") ?? [])].map(
        (title) => {
          const style = getComputedStyle(title);
          const lineHeight = parseFloat(style.lineHeight);
          const box = title.getBoundingClientRect();
          return {
            text: title.textContent?.trim() ?? "",
            height: box.height,
            lineHeight,
            lines: Math.round(box.height / lineHeight),
          };
        },
      );
      return {
        height: approach?.getBoundingClientRect().height ?? -1,
        titles,
        expectedTitles,
      };
    }, site.principles.map((principle) => principle.title));
    await browser.close();
    return layout;
  }

  it("keeps #approach no taller than main 25b5066 at 768 and 200% text", async () => {
    const layout = await measureApproach(768, 800, 200);
    expect(layout.titles.map((title) => title.text)).toEqual(
      site.principles.map((principle) => principle.title),
    );
    expect(layout.height, "768 200% #approach height").toBeLessThanOrEqual(
      MAIN_APPROACH_HEIGHT_768_200,
    );
  }, 120_000);

  it("keeps every How I work title on one line at 1280 and 100% text", async () => {
    const layout = await measureApproach(1280, 800, 100);
    const expectedLines = [1, 1, 2, 1, 1];
    expect(layout.titles).toHaveLength(site.principles.length);
    layout.titles.forEach((title, index) => {
      expect(title.lines, `${title.text} line count`).toBe(expectedLines[index]);
      expect(
        title.height,
        `${title.text} height ${title.height} vs line-height ${title.lineHeight}`,
      ).toBeLessThanOrEqual(title.lineHeight * expectedLines[index] + 1);
    });
  }, 120_000);
});
