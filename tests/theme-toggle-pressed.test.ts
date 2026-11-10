import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireOutBuild, startOutServer } from "./browser-layout";

const VIEWPORTS = [320, 390, 768, 1280] as const;

async function waitForIdle(page: import("playwright-core").Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const finish = () => resolve();
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(finish);
        } else {
          setTimeout(finish, 0);
        }
      }),
  );
}

// rule:theme-toggle-pressed
describe("theme toggle aria-pressed matches visible dark mode (Playwright)", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    requireOutBuild(
      "theme toggle pressed test needs a production build in out/",
    );
    const server = await startOutServer();
    origin = server.origin;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("with prefers-color-scheme dark, after idle the toggle is pressed and html is dark", async () => {
    const browser = await chromium.launch();
    try {
      for (const width of VIEWPORTS) {
        const context = await browser.newContext({
          colorScheme: "dark",
          viewport: { width, height: width },
        });
        const page = await context.newPage();
        try {
          await page.goto(`${origin}/`, { waitUntil: "networkidle" });
          await waitForIdle(page);
          const htmlHasDark = await page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          );
          expect(htmlHasDark, `viewport ${width}: html.dark`).toBe(true);
          const toggles = page.locator('button[aria-label="Toggle color theme"]');
          const count = await toggles.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            const pressed = await toggles.nth(i).getAttribute("aria-pressed");
            expect(pressed, `viewport ${width} toggle ${i}: aria-pressed`).toBe(
              "true",
            );
          }
        } finally {
          await page.close();
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }, 180_000);
});
