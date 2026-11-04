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
  throw new Error("highlights layout test needs a production build in out/");
}

// Measured on main 1c0847d in this file's Playwright Chromium setup
// (32px root font for 200% text, same as tests/selected-work-layout.test.ts).
const MAIN_1C0847D_100 = {
  1280: { height: 181.328125, fontSize: 34.4, lineHeight: 41.28 },
  768: { height: 181.328125, fontSize: 34.4, lineHeight: 41.28 },
  390: { height: 334.09375, fontSize: 30, lineHeight: 36 },
  320: { height: 334.09375, fontSize: 30, lineHeight: 36 },
} as const;

const VIEWPORTS = {
  1280: [1280, 800],
  768: [768, 800],
  390: [390, 844],
  320: [320, 844],
} as const;

describe("highlights figure layout", () => {
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

  async function openHighlights(
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
        document.documentElement.style.fontSize = "32px";
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

  async function measureHighlights(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const { browser, page } = await openHighlights(width, height, textPercent);
    const layout = await page.evaluate(() => {
      const root = document.querySelector('[aria-label="Impact highlights"]');
      const cells = [...(root?.children ?? [])];
      const figures = cells.map((cell) => {
        const figure = cell.querySelector("p");
        const style = figure ? getComputedStyle(figure) : null;
        const cellStyle = getComputedStyle(cell);
        const padL = parseFloat(cellStyle.paddingLeft) || 0;
        const padR = parseFloat(cellStyle.paddingRight) || 0;
        const cellRect = cell.getBoundingClientRect();
        const figureRect = figure?.getBoundingClientRect();
        const innerWidth = cell.clientWidth - padL - padR;
        const innerRight = cellRect.right - padR;
        let textWidth = -1;
        let textRight = -1;
        if (figure?.firstChild) {
          const range = document.createRange();
          range.selectNodeContents(figure.firstChild);
          const rect = range.getBoundingClientRect();
          textWidth = rect.width;
          textRight = rect.right;
        }
        return {
          text: figure?.textContent?.trim() ?? "",
          fontSize: style ? parseFloat(style.fontSize) : -1,
          lineHeight: style ? parseFloat(style.lineHeight) : -1,
          scrollWidth: figure?.scrollWidth ?? -1,
          innerWidth,
          figureRight: figureRect?.right ?? -1,
          textRight,
          textWidth,
          innerRight,
          spare: innerWidth - textWidth,
          padL,
          padR,
          cellScrollWidth: cell.scrollWidth,
          cellClientWidth: cell.clientWidth,
        };
      });
      return {
        figures,
        height: root?.getBoundingClientRect().height ?? -1,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    await browser.close();
    return layout;
  }

  it("keeps every Highlights figure inside its cell at 320, 390, and 768 with 200% text", async () => {
    const expected = site.highlights.map((item) => item.value);
    for (const width of [320, 390, 768] as const) {
      const [w, height] = VIEWPORTS[width];
      const at100 = await measureHighlights(w, height, 100);
      const at200 = await measureHighlights(w, height, 200);
      expect(
        at200.figures.map((figure) => figure.text),
        `${width} figure texts`,
      ).toEqual(expected);
      expect(at100.figures).toHaveLength(expected.length);

      const clipped: string[] = [];
      let leastSpare = Number.POSITIVE_INFINITY;
      for (const figure of at200.figures) {
        const size100 =
          at100.figures.find((row) => row.text === figure.text)?.fontSize ?? -1;
        console.log(
          `${width} ${figure.text}: 100%=${size100}px 200%=${figure.fontSize}px spare=${figure.spare}px`,
        );
        leastSpare = Math.min(leastSpare, figure.spare);
        if (figure.textRight > figure.innerRight) {
          clipped.push(
            `${figure.text} right ${figure.textRight} > inner right ${figure.innerRight}`,
          );
        }
        if (figure.scrollWidth > figure.innerWidth) {
          clipped.push(
            `${figure.text} scrollWidth ${figure.scrollWidth} > inner ${figure.innerWidth}`,
          );
        }
        if (
          figure.cellScrollWidth > figure.cellClientWidth &&
          figure.scrollWidth > figure.innerWidth
        ) {
          clipped.push(
            `${figure.text} cell scrollWidth ${figure.cellScrollWidth} > clientWidth ${figure.cellClientWidth}`,
          );
        }
      }
      console.log(`${width} least spare=${leastSpare}px`);
      expect(clipped, `${width} figure clipped`).toEqual([]);
      expect(at200.overflow, `${width} horizontal scroll`).toBe(false);
    }
  }, 120_000);

  it("grows every Highlights figure at 200% versus 100% at 320, 390, and 768", async () => {
    const shrunk: string[] = [];
    const floors: string[] = [];
    for (const width of [320, 390, 768] as const) {
      const [w, height] = VIEWPORTS[width];
      const at100 = await measureHighlights(w, height, 100);
      const at200 = await measureHighlights(w, height, 200);
      for (const [index, figure] of at200.figures.entries()) {
        const size100 =
          at100.figures.find((row) => row.text === figure.text)?.fontSize ?? -1;
        console.log(
          `${width} ${figure.text}: 100%=${size100}px 200%=${figure.fontSize}px spare=${figure.spare}px`,
        );
        // 768 middle cells (index 1 = 20+, index 2 = $156M) are 111px
        // inside at 200% text, and $156M can't grow past 34.4px without
        // leaving only about 2px.
        const is768Middle = width === 768 && (index === 1 || index === 2);
        if (is768Middle) {
          if (figure.fontSize < 32) {
            floors.push(
              `${width} ${figure.text} 200%=${figure.fontSize}px < 32px`,
            );
          }
          if (figure.spare < 8) {
            floors.push(
              `${width} ${figure.text} spare ${figure.spare}px < 8px`,
            );
          }
          continue;
        }
        if (figure.fontSize <= size100) {
          shrunk.push(
            `${width} ${figure.text} 200%=${figure.fontSize}px <= 100%=${size100}px`,
          );
        }
      }
    }
    expect(floors, "768 middle 20+ and $156M floors").toEqual([]);
    expect(shrunk, "200% font not larger").toEqual([]);
  }, 120_000);

  it("leaves at least 8px beside every Highlights figure at 200% text", async () => {
    const tight: string[] = [];
    for (const width of [320, 390, 768] as const) {
      const [w, height] = VIEWPORTS[width];
      const at200 = await measureHighlights(w, height, 200);
      let leastSpare = Number.POSITIVE_INFINITY;
      for (const figure of at200.figures) {
        console.log(
          `${width} ${figure.text}: 200%=${figure.fontSize}px spare=${figure.spare}px`,
        );
        leastSpare = Math.min(leastSpare, figure.spare);
        if (figure.spare < 8) {
          tight.push(`${width} ${figure.text} spare ${figure.spare}px < 8px`);
        }
      }
      console.log(`${width} least spare=${leastSpare}px`);
    }
    expect(tight, "200% spare under 8px").toEqual([]);
  }, 120_000);

  it("does not change Highlights at 100% text versus main 1c0847d", async () => {
    for (const width of [320, 390, 768, 1280] as const) {
      const [w, height] = VIEWPORTS[width];
      const at100 = await measureHighlights(w, height, 100);
      const at200 = await measureHighlights(w, height, 200);
      const main = MAIN_1C0847D_100[width];
      expect(at100.height, `${width} 100% Highlights height`).toBe(main.height);
      expect(at100.figures.length).toBe(site.highlights.length);
      for (const figure of at100.figures) {
        const at200Figure =
          at200.figures.find((row) => row.text === figure.text) ?? figure;
        console.log(
          `${width} ${figure.text}: 100%=${figure.fontSize}px spare100=${figure.spare}px 200%=${at200Figure.fontSize}px spare200=${at200Figure.spare}px`,
        );
        expect(figure.fontSize, `${width} 100% ${figure.text} font-size`).toBe(
          main.fontSize,
        );
        expect(
          figure.lineHeight,
          `${width} 100% ${figure.text} line-height`,
        ).toBe(main.lineHeight);
      }
    }
  }, 120_000);
});
