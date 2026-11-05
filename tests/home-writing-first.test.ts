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

const HOME_SECTION_IDS = [
  "top",
  "writing",
  "about",
  "experience",
  "work",
  "approach",
  "contact",
] as const;

// Measured on origin/main (136043b) production build in this Playwright setup.
const MAIN_HOME_SCROLL_HEIGHT = {
  390: 9312,
  1280: 6968,
} as const;

const MAIN_TOP_HEIGHT = {
  390: 198.09375,
  1280: 230.046875,
} as const;

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("home writing-first test needs a production build in out/");
}

describe("writing-first home", () => {
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

  async function openHome(
    width: number,
    height: number,
    textPercent: 100 | 200 = 100,
  ) {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height },
    });
    await page.goto(`${origin}/`, { waitUntil: "load" });
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

  async function readHomeLayout(
    width: number,
    height: number,
    textPercent: 100 | 200 = 100,
  ) {
    const { browser, page } = await openHome(width, height, textPercent);
    const layout = await page.evaluate((sectionIds) => {
      const sections = sectionIds.map((id) => document.getElementById(id));
      const h1 = document.querySelector("#top h1");
      const headerNav = document.querySelector('header nav[aria-label="Primary"]');
      return {
        h1: h1?.textContent?.trim() ?? "",
        introParagraphCount: document.querySelectorAll("#top p").length,
        sectionOrder: sections.map((section) => section?.id ?? ""),
        sectionWidths: sections.map(
          (section) => section?.getBoundingClientRect().width ?? -1,
        ),
        homeHeight: document.getElementById("content")?.scrollHeight ?? -1,
        topHeight: document.getElementById("top")?.getBoundingClientRect().height ?? -1,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        desktopNavDisplay: headerNav ? getComputedStyle(headerNav).display : "",
      };
    }, [...HOME_SECTION_IDS]);
    await browser.close();
    return layout;
  }

  it("uses the name as the only home h1 and puts Writing second", async () => {
    const layout = await readHomeLayout(1280, 800);
    expect(layout.h1).toBe(site.positioning.name);
    expect(layout.h1).not.toBe(site.positioning.headline);
    expect(layout.introParagraphCount).toBe(0);
    expect(layout.sectionOrder.slice(0, 2)).toEqual(["top", "writing"]);
  });

  it("keeps each home section no wider than the prose column at 1280", async () => {
    const layout = await readHomeLayout(1280, 800);
    for (const [index, width] of layout.sectionWidths.entries()) {
      expect(
        width,
        `${HOME_SECTION_IDS[index]} width at 1280`,
      ).toBeLessThanOrEqual(640);
    }
  });

  it("does not scroll sideways at 320 with 200% text", async () => {
    const layout = await readHomeLayout(320, 844, 200);
    expect(layout.scrollWidth).toBe(layout.clientWidth);
  });

  it("keeps the home page shorter than main at 390 and 1280", async () => {
    for (const width of [390, 1280] as const) {
      const height = width === 390 ? 844 : 800;
      const layout = await readHomeLayout(width, height);
      expect(
        layout.topHeight,
        `${width}px #top height`,
      ).toBeLessThan(MAIN_TOP_HEIGHT[width]);
      if (width === 390) {
        expect(
          layout.homeHeight,
          `${width}px home scroll height`,
        ).toBeLessThan(MAIN_HOME_SCROLL_HEIGHT[390]);
      }
    }
  });

  it("keeps the #140 desktop nav breakpoint at 1280", async () => {
    const layout = await readHomeLayout(1280, 800);
    expect(layout.desktopNavDisplay).toBe("flex");
  });
});
