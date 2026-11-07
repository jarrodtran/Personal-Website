import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const types: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("nav menu focus test needs a production build in out/");
}

type MenuStop = {
  text: string;
  inMenu: boolean;
  top: number;
  bottom: number;
  height: number;
  viewport: number;
};

function readStop(page: Page): Promise<MenuStop> {
  return page.evaluate(() => {
    const active = document.activeElement;
    const box = active?.getBoundingClientRect();
    const inPanel = Boolean(active?.closest("#mobile-nav"));
    const isToggle = active?.getAttribute("aria-controls") === "mobile-nav";
    return {
      text: (active?.getAttribute("aria-label") || active?.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48),
      inMenu: inPanel || isToggle,
      top: box ? Math.round(box.top) : -1,
      bottom: box ? Math.round(box.bottom) : -1,
      height: box ? Math.round(box.height) : 0,
      viewport: window.innerHeight,
    };
  });
}

function expectMenuStop(stop: MenuStop) {
  expect(stop.inMenu, stop.text).toBe(true);
  expect(stop.top, stop.text).toBeGreaterThanOrEqual(0);
  expect(stop.bottom, stop.text).toBeLessThanOrEqual(stop.viewport);
  expect(stop.height, stop.text).toBeGreaterThanOrEqual(44);
}

/**
 * Issue #151: with the phone menu open, the page behind it cannot scroll, so
 * Tab has to stay on the menu trigger or a menu link, on screen.
 */
describe("phone menu keyboard containment", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    const server = createServer(async (request, response) => {
      const { pathname } = new URL(request.url ?? "/", "http://localhost");
      const path = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
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
    origin = `http://127.0.0.1:${address.port}`;
    close = () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
  });

  afterAll(async () => {
    await close();
  });

  it("keeps the page behind the open menu out of reach", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
    await page.locator('button[aria-label="Open menu"]').click();
    await page.locator("#mobile-nav a").first().waitFor();

    const behind = await page.evaluate(() => {
      const main = document.getElementById("content");
      const footer = document.querySelector("footer");
      return {
        mainInert: main?.inert ?? false,
        footerInert: footer?.inert ?? false,
      };
    });
    expect(behind).toEqual({ mainInert: true, footerInert: true });

    await page.keyboard.press("Shift+Tab");
    expectMenuStop(await readStop(page));

    const stops = await page.evaluate(() => {
      const links = [
        ...document.querySelectorAll<HTMLElement>("#mobile-nav a"),
      ];
      links[links.length - 1]?.focus();
      return links.length;
    });
    expect(stops).toBeGreaterThan(0);

    for (let step = 0; step < 4; step++) {
      await page.keyboard.press("Tab");
      expectMenuStop(await readStop(page));
    }

    await page.keyboard.press("Escape");
    const after = await page.evaluate(() => {
      const main = document.getElementById("content");
      const footer = document.querySelector("footer");
      return {
        panel: document.getElementById("mobile-nav") !== null,
        mainInert: main?.inert ?? true,
        footerInert: footer?.inert ?? true,
        focusOnToggle:
          document.activeElement?.getAttribute("aria-controls") ===
          "mobile-nav",
      };
    });
    expect(after.panel).toBe(false);
    expect(after.mainInert).toBe(false);
    expect(after.footerInert).toBe(false);
    expect(after.focusOnToggle).toBe(true);
    await browser.close();
  }, 120_000);

  it("returns focus to the trigger when a menu link closes the menu", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
    const before = await page.evaluate(
      () =>
        document.querySelector("#writing")?.getBoundingClientRect().top ?? -1,
    );
    await page.locator('button[aria-label="Open menu"]').click();
    await page.locator("#mobile-nav a", { hasText: "Writing" }).click();
    await page.waitForFunction(
      (start) => {
        const button = document.querySelector(
          'header button[aria-expanded="false"]',
        );
        const top =
          document.querySelector("#writing")?.getBoundingClientRect().top ??
          start;
        return (
          !document.getElementById("mobile-nav") &&
          location.hash === "#writing" &&
          document.activeElement === button &&
          top < start &&
          top >= 0
        );
      },
      before,
      { timeout: 2000 },
    );
    const landed = await page.evaluate(() => ({
      label: document.activeElement?.getAttribute("aria-label") ?? "",
      top:
        document.querySelector("#writing")?.getBoundingClientRect().top ?? -1,
      height: Math.round(
        document
          .querySelector('header button[aria-expanded="false"]')
          ?.getBoundingClientRect().height ?? 0,
      ),
    }));
    expect(landed.label).toBe("Open menu");
    expect(landed.top).toBeGreaterThanOrEqual(0);
    expect(landed.top).toBeLessThan(before);
    expect(landed.height).toBeGreaterThanOrEqual(44);
    await browser.close();
  }, 120_000);
});
