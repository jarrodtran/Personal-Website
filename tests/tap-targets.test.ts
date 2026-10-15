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

  it("shows the hero, then the Writing heading, on the first screen", async () => {
    const { browser, page } = await open("/");
    const view = await page.evaluate(() => {
      const hero = document.getElementById("top");
      const heading = document.querySelector("#writing h2");
      const box = heading?.getBoundingClientRect();
      return {
        hero: (hero?.innerText || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        writingTitle: heading?.textContent?.trim() ?? "",
        writingBottom: box?.bottom ?? 0,
        viewport: window.innerHeight,
      };
    });
    await browser.close();
    expect(view.hero).toEqual([
      site.positioning.name,
      site.positioning.headline,
    ]);
    expect(view.writingTitle).toBe(site.sections.writing.title);
    expect(view.writingBottom).toBeGreaterThan(0);
    expect(view.writingBottom).toBeLessThanOrEqual(view.viewport);
  });

  it("aligns the hero name with the nav column at 1280px", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: "light",
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    const left = await page.evaluate(() => {
      const h1 = document.querySelector("#top h1");
      const brand = document.querySelector("header a");
      return {
        h1: h1 ? Math.round(h1.getBoundingClientRect().left) : null,
        brand: brand ? Math.round(brand.getBoundingClientRect().left) : null,
      };
    });
    await browser.close();
    expect(left.h1).toBe(160);
    expect(left.brand).toBe(160);
  });

  async function headerLayout(width: number, colorScheme: "light" | "dark") {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width, height: width <= 390 ? 844 : 800 },
      colorScheme,
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    if (colorScheme === "dark") {
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("dark"),
      );
    }
    const layout = await page.evaluate((name) => {
      const visibleBox = (el: Element | null | undefined) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          box.width <= 1 ||
          box.height <= 1
        ) {
          return null;
        }
        return box;
      };

      const header = document.querySelector("header");
      const nameLink = [...document.querySelectorAll("header a")].find(
        (el) => el.textContent?.trim() === name,
      );
      const theme = [
        ...document.querySelectorAll('[aria-label="Toggle color theme"]'),
      ]
        .map((el) => visibleBox(el))
        .find((box) => box);
      const menu = visibleBox(
        document.querySelector('[aria-label="Open menu"]'),
      );
      const headerBox = header?.getBoundingClientRect();
      const nameBox = visibleBox(nameLink);

      return {
        nameWidth: nameBox?.width ?? 0,
        nameLeft: nameBox?.left ?? null,
        headerMid: headerBox ? headerBox.left + headerBox.width / 2 : 0,
        themeLeft: theme?.left ?? null,
        menuLeft: menu?.left ?? null,
      };
    }, site.positioning.name);
    await browser.close();
    return layout;
  }

  it.each(["light", "dark"] as const)(
    "keeps Jarrod Tran readable and actions on the right at 390px %s",
    async (colorScheme) => {
      const layout = await headerLayout(390, colorScheme);
      expect(layout.nameWidth).toBeGreaterThanOrEqual(80);
      expect(layout.themeLeft).toBeGreaterThanOrEqual(layout.headerMid);
      expect(layout.menuLeft).toBeGreaterThanOrEqual(layout.headerMid);
    },
  );

  it.each(["light", "dark"] as const)(
    "does not regress the header at 1280px %s",
    async (colorScheme) => {
      const layout = await headerLayout(1280, colorScheme);
      expect(layout.nameWidth).toBeGreaterThanOrEqual(80);
      expect(layout.nameLeft).toBe(160);
      expect(layout.themeLeft).toBeGreaterThanOrEqual(layout.headerMid);
      expect(layout.menuLeft).toBeNull();
    },
  );

  it.each(
    (["writing", "work"] as const).flatMap((hash) =>
      (
        [
          { width: 390, height: 844 },
          { width: 1280, height: 800 },
        ] as const
      ).flatMap((viewport) =>
        (["light", "dark"] as const).map((colorScheme) => ({
          hash,
          ...viewport,
          colorScheme,
        })),
      ),
    ),
  )(
    "keeps the #$hash heading below the sticky header at $width $colorScheme",
    async ({ hash, width, height, colorScheme }) => {
      const browser = await chromium.launch();
      const page = await browser.newPage({
        viewport: { width, height },
        colorScheme,
        reducedMotion: "reduce",
      });
      await page.goto(`${origin}/#${hash}`, { waitUntil: "networkidle" });
      if (colorScheme === "dark") {
        await page.waitForFunction(() =>
          document.documentElement.classList.contains("dark"),
        );
      }
      await page.waitForSelector(`#${hash} h2`);
      const boxes = await page.evaluate((id) => {
        const header = document.querySelector("header");
        const heading = document.querySelector(`#${id} h2`);
        return {
          headingTop: heading?.getBoundingClientRect().top ?? -1,
          headerBottom: header?.getBoundingClientRect().bottom ?? 0,
        };
      }, hash);
      await browser.close();
      expect(boxes.headingTop).toBeGreaterThanOrEqual(boxes.headerBottom);
    },
  );

  it("resolves résumé, email, LinkedIn, and the next case-study link", async () => {
    const { browser, page } = await open("/");
    const home = await page.evaluate(() => {
      const resume =
        document.querySelector<HTMLAnchorElement>("header a[download]");
      const email =
        document.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
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
