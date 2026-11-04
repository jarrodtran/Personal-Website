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
  throw new Error("hero layout test needs a production build in out/");
}

// Measured on main 1c0847d in this file's Playwright Chromium setup
// (32px root font for 200% text, same as tests/selected-work-layout.test.ts).
const MAIN_TOP_HEIGHT = {
  320: { 100: 227.34375, 200: 709.375 },
  390: { 100: 198.09375, 200: 650.875 },
  640: { 100: 230.046875, 200: 577.09375 },
  700: { 100: 230.046875, 200: 577.09375 },
  768: { 100: 230.046875, 200: 518.59375 },
  900: { 100: 230.046875, 200: 518.59375 },
  1024: { 100: 230.046875, 200: 518.59375 },
  1280: { 100: 230.046875, 200: 460.09375 },
} as const;

const VIEWPORTS = [
  [320, 844],
  [390, 844],
  [1280, 800],
] as const;

const HEIGHT_VIEWPORTS = [
  [320, 844],
  [390, 844],
  [640, 800],
  [700, 800],
  [768, 800],
  [900, 800],
  [1024, 800],
  [1280, 800],
] as const;

const ROUTES = [
  "/",
  "/404.html",
  "/work/",
  "/writing/",
  ...site.selectedWork.map((item) => `/work/${item.slug}/`),
];

describe("hero headline layout", () => {
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

  async function openPage(
    path: string,
    width: number,
    height: number,
    textPercent: 100 | 200,
    colorScheme: "light" | "dark",
  ) {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme,
    });
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    if (colorScheme === "dark") {
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("dark"),
      );
    }
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

  function readHome() {
    const top = document.getElementById("top");
    const h1 = document.querySelector("#top h1");
    const paragraph =
      document.querySelector("#writing p") ??
      document.querySelector("main p") ??
      document.body;
    const nodes: Text[] = [];
    if (h1) {
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        nodes.push(node as Text);
        node = walker.nextNode();
      }
    }
    const content = nodes.map((node) => node.data).join("");
    const full = document.createRange();
    if (h1) full.selectNodeContents(h1);
    const lineRects = h1 ? [...full.getClientRects()] : [];
    const lines: string[][] = lineRects.map(() => []);
    const re = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content))) {
      let seen = 0;
      const wordRange = document.createRange();
      let started = false;
      for (const node of nodes) {
        const len = node.data.length;
        if (!started && match.index < seen + len) {
          wordRange.setStart(node, match.index - seen);
          started = true;
        }
        if (started && match.index + match[0].length <= seen + len) {
          wordRange.setEnd(node, match.index + match[0].length - seen);
          break;
        }
        seen += len;
      }
      const wordRect = wordRange.getBoundingClientRect();
      const midY = wordRect.top + wordRect.height / 2;
      let index = lineRects.findIndex(
        (line) => midY >= line.top - 0.5 && midY <= line.bottom + 0.5,
      );
      if (index < 0) {
        let best = Infinity;
        lineRects.forEach((line, lineIndex) => {
          const distance = Math.abs(midY - (line.top + line.height / 2));
          if (distance < best) {
            best = distance;
            index = lineIndex;
          }
        });
      }
      if (index >= 0) lines[index].push(match[0]);
    }
    const filled = lines.filter((line) => line.length > 0);
    return {
      topHeight: top?.getBoundingClientRect().height ?? -1,
      h1Font: h1 ? parseFloat(getComputedStyle(h1).fontSize) : -1,
      bodyFont: parseFloat(getComputedStyle(paragraph).fontSize),
      lines: filled,
      singles: filled
        .map((line, index) => ({ index, line }))
        .filter((row) => row.line.length === 1),
    };
  }

  it("has exactly one h1 on every route, and the home h1 is the headline", async () => {
    for (const path of ROUTES) {
      const { browser, page } = await openPage(path, 390, 844, 100, "light");
      const headings = await page.evaluate(() =>
        [...document.querySelectorAll("h1")].map((el) =>
          (el.textContent ?? "").trim(),
        ),
      );
      await browser.close();
      expect(headings, `${path} h1 count`).toHaveLength(1);
      if (path === "/") {
        expect(headings[0], "home h1").toBe(site.positioning.headline);
      }
    }
  }, 120_000);

  it("does not scroll sideways at 320, 390, or 1280 in light and dark", async () => {
    for (const [width, height] of VIEWPORTS) {
      for (const textPercent of [100, 200] as const) {
        for (const colorScheme of ["light", "dark"] as const) {
          const { browser, page } = await openPage(
            "/",
            width,
            height,
            textPercent,
            colorScheme,
          );
          const layout = await page.evaluate(() => {
            const top = document.getElementById("top");
            const h1 = document.querySelector("#top h1");
            return {
              topHeight: top?.getBoundingClientRect().height ?? -1,
              fontSize: h1 ? parseFloat(getComputedStyle(h1).fontSize) : -1,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            };
          });
          process.stdout.write(
            `#top height ${width} ${textPercent}% ${colorScheme}: ${layout.topHeight}\n`,
          );
          if (width === 320) {
            process.stdout.write(
              `h1 font size 320 ${textPercent}% ${colorScheme}: ${layout.fontSize}\n`,
            );
          }
          await browser.close();
          expect(
            layout.scrollWidth,
            `${width} ${textPercent}% ${colorScheme} scrollWidth`,
          ).toBeLessThanOrEqual(layout.clientWidth);
        }
      }
    }
  }, 180_000);

  it("does not wrap the home h1 onto a one-word line", async () => {
    for (const [width, height] of VIEWPORTS) {
      for (const textPercent of [100, 200] as const) {
        for (const colorScheme of ["light", "dark"] as const) {
          const { browser, page } = await openPage(
            "/",
            width,
            height,
            textPercent,
            colorScheme,
          );
          const layout = await page.evaluate(readHome);
          process.stdout.write(
            `#top height ${width} ${textPercent}% ${colorScheme}: ${layout.topHeight}\n`,
          );
          await browser.close();
          // 320 at 200% text: the heading must stay at least body size in a
          // 240px column, so a one-word wrap is allowed only in that case.
          if (width === 320 && textPercent === 200) {
            continue;
          }
          expect(
            layout.singles,
            `${width} ${textPercent}% ${colorScheme} one-word h1 lines`,
          ).toEqual([]);
        }
      }
    }
  }, 180_000);

  it("keeps #top no taller than main 1c0847d", async () => {
    for (const [width, height] of HEIGHT_VIEWPORTS) {
      for (const textPercent of [100, 200] as const) {
        for (const colorScheme of ["light", "dark"] as const) {
          const { browser, page } = await openPage(
            "/",
            width,
            height,
            textPercent,
            colorScheme,
          );
          const topHeight = await page.evaluate(
            () => document.getElementById("top")?.getBoundingClientRect().height ?? -1,
          );
          process.stdout.write(
            `#top height ${width} ${textPercent}% ${colorScheme}: ${topHeight}\n`,
          );
          await browser.close();
          expect(
            topHeight,
            `${width} ${textPercent}% ${colorScheme} #top height`,
          ).toBeLessThanOrEqual(MAIN_TOP_HEIGHT[width][textPercent]);
        }
      }
    }
  }, 180_000);

  it("keeps the home h1 at least as large as body text", async () => {
    for (const [width, height] of HEIGHT_VIEWPORTS) {
      for (const textPercent of [100, 200] as const) {
        const { browser, page } = await openPage(
          "/",
          width,
          height,
          textPercent,
          "light",
        );
        const layout = await page.evaluate(readHome);
        process.stdout.write(
          `${width} ${textPercent}%: h1=${layout.h1Font} body=${layout.bodyFont} main=${MAIN_TOP_HEIGHT[width][textPercent]} pr=${layout.topHeight} one-word=${JSON.stringify(layout.singles.map((row) => row.line[0]))}\n`,
        );
        await browser.close();
        expect(
          layout.h1Font,
          `${width} ${textPercent}% h1 vs body`,
        ).toBeGreaterThanOrEqual(layout.bodyFont);
      }
    }
  }, 180_000);

  it("reads the About section heading as About", async () => {
    const { browser, page } = await openPage("/", 390, 844, 100, "light");
    const title = await page.evaluate(
      () => document.querySelector("#about h2")?.textContent?.trim() ?? "",
    );
    await browser.close();
    expect(title).toBe("About");
  });
});
