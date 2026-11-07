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

  it("keeps one h1 on real routes, and no repeated name on home", async () => {
    for (const path of ROUTES) {
      const { browser, page } = await openPage(path, 390, 844, 100, "light");
      const { headings, brand, href } = await page.evaluate(() => ({
        headings: [...document.querySelectorAll("h1")].map((el) =>
          (el.textContent ?? "").trim(),
        ),
        brand: document.querySelector("header a")?.textContent?.trim() ?? "",
        href: location.href,
      }));
      await browser.close();
      // /work/ and /writing/ meta-refresh onto home, so they showed this h1 too.
      if (path === "/" || path === "/work/" || path === "/writing/") {
        expect(headings, `${path} h1 count`).toEqual([]);
        expect(brand, `${path} header brand`).toBe(site.positioning.name);
        if (path !== "/") {
          const hash = path.slice(1, -1);
          expect(href, `${path} refresh target`).toContain(`/#${hash}`);
        }
      } else {
        expect(headings, `${path} h1 count`).toHaveLength(1);
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
            return {
              topHeight: top?.getBoundingClientRect().height ?? -1,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            };
          });
          process.stdout.write(
            `#top height ${width} ${textPercent}% ${colorScheme}: ${layout.topHeight}\n`,
          );
          await browser.close();
          expect(
            layout.scrollWidth,
            `${width} ${textPercent}% ${colorScheme} scrollWidth`,
          ).toBeLessThanOrEqual(layout.clientWidth);
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

  it("keeps the writing heading below the sticky header when jumping to #top", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    try {
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      const before = await page.evaluate(
        () =>
          document.querySelector("#writing h2")?.getBoundingClientRect().top ??
          0,
      );
      expect(before).toBeLessThan(0);
      await page.locator("header a").first().click();
      await page.waitForFunction(() => location.hash === "#top");
      const boxes = await page.evaluate(() => {
        const header = document.querySelector("header");
        const heading = document.querySelector("#writing h2");
        const top = document.getElementById("top");
        return {
          headingTop: heading?.getBoundingClientRect().top ?? -1,
          headerBottom: header?.getBoundingClientRect().bottom ?? 0,
          topId: top?.id ?? "",
          topText: (top?.textContent ?? "").trim(),
        };
      });
      expect(boxes.topId).toBe("top");
      expect(boxes.topText).toBe("");
      expect(boxes.headingTop).toBeGreaterThanOrEqual(boxes.headerBottom);
    } finally {
      await browser.close();
    }
  });

  it("reads the About section heading as About", async () => {
    const { browser, page } = await openPage("/", 390, 844, 100, "light");
    const title = await page.evaluate(
      () => document.querySelector("#about h2")?.textContent?.trim() ?? "",
    );
    await browser.close();
    expect(title).toBe("About");
  });
});
