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
  ".jpg": "image/jpeg",
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
  "work",
  "approach",
  "library",
] as const;

/** Writing and About lead with or without essays; the work follows. */
const ORDER_NO_POSTS = [
  "top",
  "writing",
  "about",
  "work",
  "approach",
  "library",
];
const ORDER_WITH_POSTS = ORDER_NO_POSTS;

// Measured on origin/main (136043b) production build in this Playwright setup.
const MAIN_HOME_SCROLL_HEIGHT_100 = {
  320: 10501,
  390: 9312,
  640: 7838,
  768: 7351,
  1280: 6968,
} as const;

const MAIN_HOME_SCROLL_HEIGHT_200 = {
  320: 41616,
  390: 32925,
  768: 22560,
  1280: 15011,
} as const;

/** Product Lead height ruling for #143 (main baselines below). rule:home-height */
const PRODUCT_LEAD_TALLER_CAP_PX = 700;

// Prior head 4f2b3d9 only compared #top height at 1280 and #content scroll at
// 390, so a +663px taller #content at 1280 vs main never failed CI.

const VIEWPORT_HEIGHT = {
  320: 844,
  390: 844,
  640: 800,
  768: 800,
  1280: 800,
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
    const layout = await page.evaluate(
      (sectionIds) => {
        const sections = sectionIds.map((id) => document.getElementById(id));
        const h1 = document.querySelector("#top h1");
        const brand = document.querySelector("header a");
        const headerNav = document.querySelector(
          'header nav[aria-label="Primary"]',
        );
        return {
          h1: h1?.textContent?.trim() ?? "",
          h1Left: h1 ? Math.round(h1.getBoundingClientRect().left) : -1,
          brandLeft: brand
            ? Math.round(brand.getBoundingClientRect().left)
            : -1,
          introParagraphCount: document.querySelectorAll("#top p").length,
          sectionOrder: [
            ...document.querySelectorAll("[data-testid=home-prose] section"),
          ].map(({ id }) => id),
          sectionWidths: sections.map(
            (section) => section?.getBoundingClientRect().width ?? -1,
          ),
          hasPosts: document.querySelectorAll("#writing li").length > 0,
          hasContactAnchor: Boolean(document.getElementById("contact")),
          homeHeight: document.getElementById("content")?.scrollHeight ?? -1,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          desktopNavDisplay: headerNav
            ? getComputedStyle(headerNav).display
            : "",
        };
      },
      [...HOME_SECTION_IDS],
    );
    await browser.close();
    return layout;
  }

  it("uses the name as the only home h1 and orders sections by whether essays exist", async () => {
    const layout = await readHomeLayout(1280, 800);
    expect(layout.h1).toBe(site.positioning.name);
    // The lede and the rest of the introduction.
    expect(layout.introParagraphCount).toBe(2);
    expect(layout.sectionOrder).toEqual(
      layout.hasPosts ? ORDER_WITH_POSTS : ORDER_NO_POSTS,
    );
    expect(layout.hasContactAnchor).toBe(true);
  });

  it("gives homepage sections a 192px label rail and an 864px content column at 1280", async () => {
    const { browser, page } = await openHome(1280, 800);
    const geometry = await page.evaluate(() => {
      const box = (el: Element | null | undefined) => {
        const r = el?.getBoundingClientRect();
        return r
          ? { left: Math.round(r.left), width: Math.round(r.width) }
          : null;
      };
      return {
        brand: box(document.querySelector("header a")),
        sections: ["writing", "work", "approach", "about", "library"].map(
          (id) => {
            const section = document.getElementById(id);
            const label = section?.querySelector(".rail-label");
            const columns = label?.parentElement
              ? getComputedStyle(label.parentElement)
                  .gridTemplateColumns.split(" ")
                  .map((value) => Math.round(parseFloat(value)))
              : [];
            const content = [...(label?.parentElement?.children ?? [])].find(
              (el) =>
                el !== label && getComputedStyle(el).position !== "absolute",
            );
            return {
              id,
              label: box(label),
              heading: box(section?.querySelector("h2")),
              content: box(content),
              columns,
            };
          },
        ),
      };
    });
    await browser.close();
    for (const { id, label, heading, content, columns } of geometry.sections) {
      // Heading and brand share the left edge; the content column follows the rail.
      expect(heading?.left, `${id} h2 left edge`).toBe(geometry.brand?.left);
      expect(label?.width, `${id} rail width at 1280`).toBe(192);
      expect(content?.left, `${id} content left`).toBe(
        (geometry.brand?.left ?? 0) + 192 + 32,
      );
      // The content column is 864px; prose inside it is capped by .measure.
      expect(columns, `${id} grid columns at 1280`).toEqual([192, 864]);
    }
  });

  it("stacks the heading above the content below lg", async () => {
    const { browser, page } = await openHome(768, 800);
    const stacked = await page.evaluate(() =>
      ["writing", "work", "approach", "about", "library"].map((id) => {
        const section = document.getElementById(id);
        const label = section?.querySelector(".rail-label");
        const content = [...(label?.parentElement?.children ?? [])].find(
          (el) => el !== label && getComputedStyle(el).position !== "absolute",
        );
        return {
          id,
          sameLeft:
            Math.round(label?.getBoundingClientRect().left ?? -1) ===
            Math.round(content?.getBoundingClientRect().left ?? -2),
          above:
            (label?.getBoundingClientRect().bottom ?? 1e9) <=
            (content?.getBoundingClientRect().top ?? -1) + 1,
        };
      }),
    );
    await browser.close();
    for (const row of stacked) {
      expect(row.sameLeft, `${row.id} shares the left edge at 768`).toBe(true);
      expect(row.above, `${row.id} heading sits above content at 768`).toBe(
        true,
      );
    }
  });

  it("aligns the home h1 left edge with the header brand at 768 and 1280", async () => {
    for (const width of [768, 1280] as const) {
      const layout = await readHomeLayout(width, VIEWPORT_HEIGHT[width]);
      expect(layout.h1Left, `${width}px h1 left`).toBe(layout.brandLeft);
    }
  });

  it("does not scroll sideways at 320 with 200% text", async () => {
    const layout = await readHomeLayout(320, 844, 200);
    expect(layout.scrollWidth).toBe(layout.clientWidth);
  });

  it("keeps home shorter than main at 320 and 390 with 100% text", async () => {
    for (const width of [320, 390] as const) {
      const layout = await readHomeLayout(width, VIEWPORT_HEIGHT[width], 100);
      expect(
        layout.homeHeight,
        `${width}px home scroll height vs main`,
      ).toBeLessThan(MAIN_HOME_SCROLL_HEIGHT_100[width]);
    }
  });

  it("allows home at most 700px taller than main at 640px and up with 100% text", async () => {
    for (const width of [640, 768, 1280] as const) {
      const layout = await readHomeLayout(width, VIEWPORT_HEIGHT[width], 100);
      const main = MAIN_HOME_SCROLL_HEIGHT_100[width];
      expect(
        layout.homeHeight,
        `${width}px home scroll height vs main + ${PRODUCT_LEAD_TALLER_CAP_PX}`,
      ).toBeLessThanOrEqual(main + PRODUCT_LEAD_TALLER_CAP_PX);
    }
  });

  it("keeps home shorter than main at every width with 200% text", async () => {
    for (const width of [320, 390, 768, 1280] as const) {
      const layout = await readHomeLayout(width, VIEWPORT_HEIGHT[width], 200);
      expect(
        layout.homeHeight,
        `${width}px home scroll height at 200% vs main`,
      ).toBeLessThan(MAIN_HOME_SCROLL_HEIGHT_200[width]);
    }
  });

  it("keeps the #140 desktop nav breakpoint at 1280", async () => {
    const layout = await readHomeLayout(1280, 800);
    expect(layout.desktopNavDisplay).toBe("flex");
  });

  it("starts every page's first heading at the nav brand's left edge at 1280", async () => {
    const browser = await chromium.launch();
    try {
      for (const path of [
        "/",
        "/work/tesla-energy-ai-product/",
        "/resume/",
        "/writing/",
        "/library/",
      ]) {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 800 },
        });
        await page.goto(`${origin}${path}`, { waitUntil: "load" });
        const edges = await page.evaluate(() => {
          const left = (el: Element | null) =>
            el ? el.getBoundingClientRect().left : Number.NaN;
          return {
            brand: left(document.querySelector("header a")),
            heading: left(document.querySelector("main h1")),
          };
        });
        expect(edges.heading, `${path} h1 left edge`).toBeCloseTo(
          edges.brand,
          0,
        );
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
});
