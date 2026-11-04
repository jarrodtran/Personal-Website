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
  throw new Error("selected-work layout test needs a production build in out/");
}

// Measured on main 92fbd54 in this file's Playwright Chromium setup.
// 200% text is document.documentElement.style.fontSize = "200%", not browser zoom.
const MAIN_WORK_HEIGHT = {
  1280: { 100: 2152.8125, 200: 5320.65625 },
  320: { 100: 3345.3125, 200: 15005 },
  390: { 100: 3092.5, 200: 11628.5 },
} as const;

// Measured on main 29221f1 in this file's Playwright Chromium setup
// (32px root font for 200% text, same as tests/tap-targets.test.ts).
const MAIN_29221F1_100 = {
  1280: {
    work: 2150.4375,
    cards: [428.875, 712.65625, 712.65625, 706.90625],
    pad: 28,
  },
  768: {
    work: 2278.03125,
    cards: [487.375, 744.328125, 744.328125, 744.328125],
    pad: 28,
  },
  390: {
    work: 3092.5,
    cards: [754.25, 695.75, 665.75, 695.75],
    pad: 20,
  },
  320: {
    work: 3345.3125,
    cards: [824.578125, 766.078125, 766.078125, 707.578125],
    pad: 20,
  },
} as const;

describe("selected work featured panel layout", () => {
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

  async function openWork(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme: "light",
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
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
    return { browser, page, errors };
  }

  async function measureWork(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const { browser, page, errors } = await openWork(
      width,
      height,
      textPercent,
    );
    const layout = await page.evaluate((panelValue) => {
      const work = document.getElementById("work");
      const articles = [...(work?.querySelectorAll("article") ?? [])];
      const featured = articles[0];
      const value = [...(featured?.querySelectorAll("p") ?? [])].find((node) =>
        (node.textContent ?? "").includes(panelValue),
      );
      let panel: Element | null | undefined = value;
      while (panel && panel.parentElement !== featured) {
        panel = panel.parentElement;
      }
      const text = featured?.querySelector("h3")?.parentElement;
      const row = articles
        .slice(1, 3)
        .map((article) => article.getBoundingClientRect().bottom);
      return {
        workHeight: work?.getBoundingClientRect().height ?? -1,
        panelTop: panel?.getBoundingClientRect().top ?? -1,
        textBottom: text?.getBoundingClientRect().bottom ?? -1,
        rowBottoms: row,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    }, site.selectedWork[0].panel.value);
    await browser.close();
    return { ...layout, errors };
  }

  it("stacks the featured panel under the featured text at 1280", async () => {
    for (const textPercent of [100, 200] as const) {
      const layout = await measureWork(1280, 800, textPercent);
      expect(
        layout.panelTop,
        `1280 ${textPercent}% panel top`,
      ).toBeGreaterThanOrEqual(layout.textBottom);
    }
  });

  it("keeps #work no taller than main at 1280 and 100% text", async () => {
    const layout = await measureWork(1280, 800, 100);
    expect(layout.workHeight, "1280 100% #work height").toBeLessThanOrEqual(
      MAIN_WORK_HEIGHT[1280][100],
    );
  });

  it("shortens #work versus main at 1280 and 200% text", async () => {
    const layout = await measureWork(1280, 800, 200);
    expect(layout.workHeight, "1280 200% #work height").toBeLessThan(
      MAIN_WORK_HEIGHT[1280][200],
    );
  });

  it("does not grow #work on phones versus main at 100% and 200% text", async () => {
    for (const [width, height] of [
      [320, 844],
      [390, 844],
    ] as const) {
      for (const textPercent of [100, 200] as const) {
        const layout = await measureWork(width, height, textPercent);
        expect(
          layout.workHeight,
          `${width} ${textPercent}% #work height`,
        ).toBeLessThanOrEqual(MAIN_WORK_HEIGHT[width][textPercent]);
      }
    }
  });

  it("keeps the two-column row bottoms equal at 768 and 1280", async () => {
    for (const width of [768, 1280] as const) {
      const layout = await measureWork(width, 800, 100);
      expect(layout.rowBottoms, `${width} row cards`).toHaveLength(2);
      expect(
        Math.abs(layout.rowBottoms[0] - layout.rowBottoms[1]),
        `${width} row bottom delta`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it("does not scroll sideways at 320, 390, or 1280", async () => {
    for (const [width, height] of [
      [320, 844],
      [390, 844],
      [1280, 800],
    ] as const) {
      const layout = await measureWork(width, height, 100);
      expect(layout.overflow, `${width} overflow`).toBe(false);
    }
  });

  it("does not log console errors at 320, 390, or 1280", async () => {
    for (const [width, height] of [
      [320, 844],
      [390, 844],
      [1280, 800],
    ] as const) {
      const layout = await measureWork(width, height, 100);
      expect(layout.errors, `${width} console`).toEqual([]);
    }
  });

  async function openWorkPx(
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

  async function measureFigures(
    width: number,
    height: number,
    textPercent: 100 | 200,
  ) {
    const { browser, page } = await openWorkPx(width, height, textPercent);
    const layout = await page.evaluate(() => {
      const work = document.getElementById("work");
      const articles = [...(work?.querySelectorAll("article") ?? [])];
      const figures = articles.map((article) => {
        const figure = article.querySelector("p");
        let panel: Element | null | undefined = figure;
        while (panel && panel.parentElement !== article) {
          panel = panel.parentElement;
        }
        const panelStyle = panel ? getComputedStyle(panel) : null;
        const padL = panelStyle ? parseFloat(panelStyle.paddingLeft) || 0 : 0;
        const padR = panelStyle ? parseFloat(panelStyle.paddingRight) || 0 : 0;
        const padT = panelStyle ? parseFloat(panelStyle.paddingTop) || 0 : 0;
        const padB = panelStyle ? parseFloat(panelStyle.paddingBottom) || 0 : 0;
        const panelRect = panel?.getBoundingClientRect();
        const figureRect = figure?.getBoundingClientRect();
        const label = figure?.nextElementSibling;
        const labelRect = label?.getBoundingClientRect();
        const innerWidth = panel ? panel.clientWidth - padL - padR : -1;
        const innerRight = panelRect ? panelRect.right - padR : -1;
        const innerBottom = panelRect ? panelRect.bottom - padB : -1;
        const panelHeight = panelRect?.height ?? -1;
        const ratioHeight =
          panelRect && panelRect.width > 0 ? (panelRect.width * 2) / 3 : -1;
        return {
          text: figure?.textContent?.trim() ?? "",
          fontSize: figure ? parseFloat(getComputedStyle(figure).fontSize) : -1,
          scrollWidth: figure?.scrollWidth ?? -1,
          innerWidth,
          figureRight: figureRect?.right ?? -1,
          innerRight,
          padL,
          padR,
          padT,
          padB,
          labelBottom: labelRect?.bottom ?? -1,
          labelRight: labelRect?.right ?? -1,
          innerBottom,
          panelHeight,
          ratioHeight,
          cardHeight: article.getBoundingClientRect().height,
        };
      });
      return {
        figures,
        workHeight: work?.getBoundingClientRect().height ?? -1,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    await browser.close();
    return layout;
  }

  it("keeps every #work figure inside its panel at 320, 390, and 768 with 200% text", async () => {
    const expected = site.selectedWork.map((item) => item.panel.value);
    for (const [width, height] of [
      [320, 844],
      [390, 844],
      [768, 800],
    ] as const) {
      const at100 = await measureFigures(width, height, 100);
      const at200 = await measureFigures(width, height, 200);
      expect(
        at200.figures.map((figure) => figure.text),
        `${width} figure texts`,
      ).toEqual(expected);
      expect(at100.figures).toHaveLength(expected.length);

      const clipped: string[] = [];
      const shrunk: string[] = [];
      for (const figure of at200.figures) {
        const size100 =
          at100.figures.find((row) => row.text === figure.text)?.fontSize ?? -1;
        console.log(
          `${width} ${figure.text}: 100%=${size100}px 200%=${figure.fontSize}px`,
        );
        if (figure.fontSize <= size100) {
          shrunk.push(
            `${figure.text} 200%=${figure.fontSize}px <= 100%=${size100}px`,
          );
        }
        if (figure.scrollWidth > figure.innerWidth) {
          clipped.push(
            `${figure.text} scrollWidth ${figure.scrollWidth} > inner ${figure.innerWidth}`,
          );
        }
        if (figure.figureRight > figure.innerRight) {
          clipped.push(
            `${figure.text} right ${figure.figureRight} > inner right ${figure.innerRight}`,
          );
        }
        if (figure.labelBottom > figure.innerBottom) {
          clipped.push(
            `${figure.text} label bottom ${figure.labelBottom} > inner bottom ${figure.innerBottom}`,
          );
        }
        if (figure.labelRight > figure.innerRight) {
          clipped.push(
            `${figure.text} label right ${figure.labelRight} > inner right ${figure.innerRight}`,
          );
        }
        console.log(
          `${width} ${figure.text} panelH=${figure.panelHeight} ratioH=${figure.ratioHeight} labelBottom=${figure.labelBottom} innerBottom=${figure.innerBottom}`,
        );
      }
      expect(shrunk, `${width} 200% font not larger`).toEqual([]);
      expect(clipped, `${width} figure clipped`).toEqual([]);
      expect(at200.overflow, `${width} horizontal scroll`).toBe(false);
    }
  }, 120_000);

  it("does not grow cards or #work versus main 29221f1 at 100% text", async () => {
    for (const [width, height] of [
      [1280, 800],
      [768, 800],
      [390, 844],
      [320, 844],
    ] as const) {
      const layout = await measureFigures(width, height, 100);
      const main = MAIN_29221F1_100[width];
      expect(layout.figures).toHaveLength(main.cards.length);
      expect(
        layout.workHeight,
        `${width} 100% #work height`,
      ).toBeLessThanOrEqual(main.work);
      layout.figures.forEach((figure, index) => {
        expect(
          figure.cardHeight,
          `${width} 100% card ${figure.text} height`,
        ).toBeLessThanOrEqual(main.cards[index]);
        expect(figure.padL, `${width} ${figure.text} padL`).toBe(main.pad);
        expect(figure.padR, `${width} ${figure.text} padR`).toBe(main.pad);
        expect(figure.padT, `${width} ${figure.text} padT`).toBe(main.pad);
        expect(figure.padB, `${width} ${figure.text} padB`).toBe(main.pad);
      });
    }
  }, 60_000);
});
