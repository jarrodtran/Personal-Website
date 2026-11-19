import axe from "axe-core";
import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  collectLayoutViolations,
  formatLayoutFailure,
  requireOutBuild,
  settleLayoutPage,
  startOutServer,
  type ColorScheme,
  type TextScale,
} from "./browser-layout";

requireOutBuild("library interactions test needs a production build in out/");

/**
 * The layout and axe gates load /library/ in its default state: the shelf,
 * dialog closed. This covers the states they never see: the shelf after a
 * click, the open book panel, the deep link from the home page, and search.
 */
describe("library interactions", () => {
  let origin = "";
  let close = async () => {};
  let browser: Browser;

  beforeAll(async () => {
    const server = await startOutServer();
    origin = server.origin;
    close = server.close;
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
    await close();
  });

  async function open(
    width: number,
    colorScheme: ColorScheme,
    textScale: TextScale,
    hash = "",
  ): Promise<Page> {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      colorScheme,
    });
    await page.goto(`${origin}/library/${hash}`, { waitUntil: "networkidle" });
    await settleLayoutPage(page, colorScheme, textScale);
    return page;
  }

  // rule:tap-targets-44px
  // rule:no-horizontal-overflow
  it("keeps the shelf view and the open panel inside the viewport with 44px targets", async () => {
    const failures: string[] = [];
    for (const width of [320, 390, 1280]) {
      for (const textScale of [100, 200] as const) {
        for (const colorScheme of ["light", "dark"] as const) {
          const page = await open(width, colorScheme, textScale);
          try {
            await page.getByRole("button", { name: "Shelf" }).click();
            await page.waitForSelector("ul[data-shelf]");
            for (const violation of await page.evaluate(
              collectLayoutViolations,
            )) {
              failures.push(
                formatLayoutFailure(
                  "/library/ shelf",
                  width,
                  textScale,
                  colorScheme,
                  violation,
                ),
              );
            }
            await page.locator("ul[data-shelf] a").first().click();
            await page.waitForSelector("dialog[open]");
            for (const violation of await page.evaluate(
              collectLayoutViolations,
            )) {
              failures.push(
                formatLayoutFailure(
                  "/library/ panel",
                  width,
                  textScale,
                  colorScheme,
                  violation,
                ),
              );
            }
          } finally {
            await page.close();
          }
        }
      }
    }
    expect(failures).toEqual([]);
  }, 240_000);

  it("opens a book from its #book- link, steps through books, and clears the hash on close", async () => {
    const page = await open(390, "light", 100, "#book-atomic-habits");
    try {
      const dialog = page.locator("dialog[open]");
      await expect
        .poll(() => dialog.locator("h2").textContent())
        .toBe("Atomic Habits");
      await page.getByRole("button", { name: "Next" }).click();
      const next = await dialog.locator("h2").textContent();
      expect(next).not.toBe("Atomic Habits");
      // page.url() can lag history.replaceState; read the hash from the page.
      expect(await page.evaluate(() => location.hash)).toMatch(
        /^#book-[a-z0-9-]+$/,
      );
      await page.keyboard.press("ArrowLeft");
      await expect
        .poll(() => dialog.locator("h2").textContent())
        .toBe("Atomic Habits");
      await page.keyboard.press("Escape");
      await expect.poll(() => page.locator("dialog[open]").count()).toBe(0);
      await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
    } finally {
      await page.close();
    }
  });

  it("filters by search and by category, and remembers the shelf view", async () => {
    const page = await open(390, "light", 100);
    try {
      await page.getByLabel("Search titles and authors").fill("peterson");
      await expect
        .poll(() => page.locator('p[aria-live="polite"]').first().textContent())
        .toMatch(/^4 books/);
      await page.getByLabel("Search titles and authors").fill("");
      await page
        .getByLabel("Category", { exact: true })
        .selectOption("Fiction");
      await expect
        .poll(() => page.locator('p[aria-live="polite"]').first().textContent())
        .toMatch(/books? in Fiction$/);
      await page.getByRole("button", { name: "Shelf" }).click();
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector("ul[data-shelf]");
    } finally {
      await page.close();
    }
  });

  it("has no axe violations with the shelf showing and a book open", async () => {
    const failures: string[] = [];
    for (const width of [390, 1280]) {
      for (const colorScheme of ["light", "dark"] as const) {
        const page = await open(width, colorScheme, 100);
        try {
          await page.getByRole("button", { name: "Shelf" }).click();
          await page.locator("ul[data-shelf] a").nth(3).click();
          await page.waitForSelector("dialog[open]");
          await page.addScriptTag({ content: axe.source });
          for (const target of ["main", "dialog[open]"]) {
            const { violations } = await page.evaluate(
              (selector) =>
                (window as unknown as { axe: typeof axe }).axe.run(selector, {
                  runOnly: [
                    "wcag2a",
                    "wcag2aa",
                    "wcag21a",
                    "wcag21aa",
                    "wcag22aa",
                  ],
                }),
              target,
            );
            for (const violation of violations) {
              for (const node of violation.nodes) {
                failures.push(
                  `${width} ${colorScheme} ${target} ${violation.id}: ${node.target.join(" ")}`,
                );
              }
            }
          }
        } finally {
          await page.close();
        }
      }
    }
    expect(failures).toEqual([]);
  }, 120_000);
});
