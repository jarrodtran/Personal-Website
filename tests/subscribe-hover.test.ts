import type { Page } from "playwright-core";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireOutBuild, startOutServer } from "./browser-layout";

async function tokenBorder(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.setAttribute("data-token-probe", "");
    probe.style.borderTopColor = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return color;
  }, token);
}

describe("ghost Subscribe hover", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    requireOutBuild("Subscribe hover test needs a production build in out/");
    const server = await startOutServer();
    origin = server.origin;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("moves the border to --foreground in both themes", async () => {
    const browser = await chromium.launch();
    try {
      for (const scheme of ["light", "dark"] as const) {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 900 },
          colorScheme: scheme,
        });
        await page.emulateMedia({
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        await page.goto(`${origin}/`, { waitUntil: "load" });
        await page.waitForFunction(
          (expected) => document.documentElement.classList.contains(expected),
          scheme,
        );
        const link = page.locator("#writing [data-testid=subscribe] a").first();
        await link.scrollIntoViewIfNeeded();
        const resting = await link.evaluate(
          (el) => getComputedStyle(el).borderTopColor,
        );
        expect(resting).toBe(await tokenBorder(page, "--border-control"));
        const foreground = await tokenBorder(page, "--foreground");
        await link.hover();
        await expect
          .poll(
            () => link.evaluate((el) => getComputedStyle(el).borderTopColor),
            { timeout: 1000 },
          )
          .toBe(foreground);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  });
});
