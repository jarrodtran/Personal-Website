import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";
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

/**
 * Issue #151: with the phone menu open, the page behind it cannot scroll, so
 * Tab must not reach it either. Every stop has to stay on screen.
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

    const stops = await page.evaluate(() => {
      const links = [
        ...document.querySelectorAll<HTMLElement>("#mobile-nav a"),
      ];
      links[links.length - 1]?.focus();
      return links.length;
    });
    expect(stops).toBeGreaterThan(0);

    const seen: {
      tag: string;
      text: string;
      inPage: boolean;
      top: number;
    }[] = [];
    for (let step = 0; step < 4; step++) {
      await page.keyboard.press("Tab");
      seen.push(
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          const box = active?.getBoundingClientRect();
          return {
            tag: active?.tagName ?? "",
            text: (active?.textContent ?? "").trim().slice(0, 48),
            inPage: Boolean(active?.closest("#content, footer")),
            top: box ? Math.round(box.top) : -1,
          };
        }),
      );
    }

    for (const stop of seen) {
      expect(
        stop.inPage,
        `Tab reached the page behind the menu: ${stop.text}`,
      ).toBe(false);
      expect(
        stop.top,
        `Tab reached an off-screen stop at y=${stop.top}: ${stop.text}`,
      ).toBeLessThan(844);
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
});
