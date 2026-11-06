import { chromium, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireOutBuild, startOutServer } from "./browser-layout";

requireOutBuild("menu focus test needs a production build in out/");

type Stop = {
  text: string;
  top: number;
  bottom: number;
  height: number;
  inMenu: boolean;
};

async function stop(page: Page): Promise<Stop> {
  return page.evaluate(() => {
    const el = document.activeElement;
    const box = el?.getBoundingClientRect();
    const inPanel = Boolean(el?.closest("#mobile-nav"));
    const isToggle = el?.getAttribute("aria-controls") === "mobile-nav";
    return {
      text: (el?.textContent || el?.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80),
      top: box?.top ?? -1,
      bottom: box?.bottom ?? -1,
      height: window.innerHeight,
      inMenu: inPanel || isToggle,
    };
  });
}

function expectVisibleMenuStop(landed: Stop) {
  expect(landed.inMenu, landed.text).toBe(true);
  expect(landed.top, landed.text).toBeGreaterThanOrEqual(0);
  expect(landed.bottom, landed.text).toBeLessThanOrEqual(landed.height + 1);
}

describe("mobile menu keyboard focus", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    const server = await startOutServer();
    origin = server.origin;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("keeps Tab inside the open menu at 390px and restores focus to the trigger on close", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    try {
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      const toggle = page.getByRole("button", { name: "Open menu" });
      await toggle.click();
      await page.waitForSelector("#mobile-nav a");

      const linkCount = await page.locator("#mobile-nav a").count();
      expect(linkCount).toBeGreaterThan(0);
      const forward: Stop[] = [];
      for (let i = 0; i < linkCount + 2; i++) {
        await page.keyboard.press("Tab");
        forward.push(await stop(page));
      }
      for (const landed of forward) {
        expectVisibleMenuStop(landed);
      }

      const locked = await page.evaluate(() => {
        window.scrollTo(0, 3000);
        return {
          overflow: document.body.style.overflow,
          scrollY: window.scrollY,
        };
      });
      expect(locked.overflow).toBe("hidden");
      expect(locked.scrollY).toBe(0);

      await page.getByRole("button", { name: "Close menu" }).focus();
      await page.keyboard.press("Shift+Tab");
      expectVisibleMenuStop(await stop(page));

      await page.keyboard.press("Escape");
      const closed = await page.evaluate(() => {
        const button = document.querySelector(
          'header button[aria-expanded="false"]',
        );
        return {
          panel: Boolean(document.getElementById("mobile-nav")),
          label: button?.getAttribute("aria-label") ?? "",
          focused: document.activeElement === button,
        };
      });
      expect(closed.panel).toBe(false);
      expect(closed.label).toBe("Open menu");
      expect(closed.focused).toBe(true);
      const released = await page.evaluate(() => document.body.style.overflow);
      expect(released).toBe("");
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForFunction(() => window.scrollY > 100);
    } finally {
      await browser.close();
    }
  });

  it("returns focus to the trigger after a menu link and keeps that section in view", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    try {
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      const before = await page.evaluate(
        () =>
          document.querySelector("#writing")?.getBoundingClientRect().top ?? -1,
      );
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.locator("#mobile-nav a", { hasText: "Writing" }).click();
      await page.waitForFunction((start) => {
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
      }, before);
      const landed = await page.evaluate(() => ({
        hash: location.hash,
        focused: document.activeElement?.getAttribute("aria-label") ?? "",
        top:
          document.querySelector("#writing")?.getBoundingClientRect().top ?? -1,
      }));
      expect(landed.hash).toBe("#writing");
      expect(landed.focused).toBe("Open menu");
      expect(landed.top).toBeGreaterThanOrEqual(0);
      expect(landed.top).toBeLessThan(before);
    } finally {
      await browser.close();
    }
  });
});
