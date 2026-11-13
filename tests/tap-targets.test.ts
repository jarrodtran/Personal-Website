import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import {
  COLOR_SCHEMES,
  LAYOUT_WIDTHS,
  TEXT_SCALES,
  collectLayoutViolations,
  formatLayoutFailure,
  listTopLevelPageRoutes,
  requireOutBuild,
  settleLayoutPage,
  startOutServer,
} from "./browser-layout";
import { WRITING_FIXTURE_TITLES } from "./fixtures/writing/titles";

const outDir = requireOutBuild(
  "tap-targets test needs a production build in out/",
);
const layoutRoutes = listTopLevelPageRoutes(outDir);

describe("390px tap targets and first screen", () => {
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

  // rule:tap-targets-44px
  // rule:no-horizontal-overflow
  it("keeps built pages inside the viewport with 44 by 44 tap targets", async () => {
    expect(layoutRoutes.length).toBeGreaterThan(0);
    const failures: string[] = [];
    for (const route of layoutRoutes) {
      for (const width of LAYOUT_WIDTHS) {
        for (const textScale of TEXT_SCALES) {
          for (const colorScheme of COLOR_SCHEMES) {
            const page = await browser.newPage({
              viewport: { width, height: width },
              colorScheme,
            });
            try {
              await page.goto(`${origin}${route}`, {
                waitUntil: "networkidle",
              });
              await settleLayoutPage(page, colorScheme, textScale);
              const violations = await page.evaluate(collectLayoutViolations);
              for (const violation of violations) {
                failures.push(
                  formatLayoutFailure(
                    route,
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
    }
    expect(failures).toEqual([]);
  }, 360_000);

  it("skips inline prose links, skip links, and sr-only controls", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 390 },
      colorScheme: "light",
    });
    try {
      await page.setContent(`
        <style>
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
          }
        </style>
        <p>Read the <a href="/prose">inline note</a> in this sentence.</p>
        <a class="sr-only" href="#content">Skip to content</a>
        <a class="sr-only" href="/hidden">hidden control</a>
        <a href="/ok" style="display:flex;width:48px;height:48px">ok</a>
      `);
      expect(await page.evaluate(collectLayoutViolations)).toEqual([]);
    } finally {
      await page.close();
    }
  });

  it("fails a too-wide box and a too-small tap target", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 390 },
      colorScheme: "light",
    });
    try {
      await page.setContent(`
        <div data-layout-probe="wide" style="width:200vw">wide box</div>
        <a data-layout-probe="tiny" href="#tiny" style="display:flex;width:12px;height:10px">tiny tap</a>
      `);
      const kinds = (await page.evaluate(collectLayoutViolations)).map(
        (violation) => violation.kind,
      );
      expect(kinds).toContain("page-overflow");
      expect(kinds).toContain("element-overflow");
      expect(kinds).toContain("tap-target");
    } finally {
      await page.close();
    }
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

  it("underlines the first writing title only while hovered", async () => {
    const fixtureOut = join(process.cwd(), "out.writing-fixture");
    let fixtureServer: Awaited<ReturnType<typeof startOutServer>> | undefined;
    let page: Awaited<ReturnType<Browser["newPage"]>> | undefined;
    try {
      execFileSync("pnpm", ["build"], {
        env: {
          ...process.env,
          WRITING_FIXTURE_EXPORT: "1",
          WRITING_FEED_PATH: "tests/fixtures/writing/three-posts.xml",
        },
        stdio: "inherit",
      });
      fixtureServer = await startOutServer(fixtureOut);
      page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto(`${fixtureServer.origin}/`, { waitUntil: "networkidle" });
      const title = page.locator("#writing li a").first();
      await title.scrollIntoViewIfNeeded();
      expect(await title.innerText()).toContain(WRITING_FIXTURE_TITLES[0]);
      const rest = await title.evaluate(
        (node) => getComputedStyle(node).textDecorationLine,
      );
      expect(rest).toBe("none");
      await title.hover();
      const hovered = await title.evaluate(
        (node) => getComputedStyle(node).textDecorationLine,
      );
      expect(hovered).toBe("underline");
    } finally {
      await page?.close();
      await fixtureServer?.close();
      rmSync(fixtureOut, { recursive: true, force: true });
    }
  }, 180_000);

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
    expect(view.hero).toEqual([site.positioning.name, site.positioning.intro]);
    expect(view.writingTitle).toBe(site.substack.name);
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
      const resume = document.querySelector<HTMLAnchorElement>(
        "#about a[download], #contact a[download]",
      );
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

  it("keeps the header short and Contact reachable at 320x256 with 200% text", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 320, height: 256 },
      colorScheme: "light",
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
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

    const closed = await page.evaluate(() => {
      const header = document.querySelector("header");
      const bar = header?.firstElementChild;
      return {
        headerHeight: header?.getBoundingClientRect().height ?? 0,
        barBottom: bar?.getBoundingClientRect().bottom ?? 0,
      };
    });
    expect(closed.headerHeight).toBeLessThan(184);
    expect(closed.barBottom).toBeLessThan(184);

    await page.locator('button[aria-controls="mobile-nav"]').click();
    await page.waitForSelector("#mobile-nav a");

    const menu = await page.evaluate(() => {
      const panel = document.querySelector("#mobile-nav");
      if (panel) panel.scrollTop = panel.scrollHeight;
      const links = [...document.querySelectorAll("#mobile-nav a")];
      const last = links[links.length - 1];
      const lastBox = last?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      const hit = lastBox
        ? document.elementFromPoint(
            lastBox.left + lastBox.width / 2,
            Math.min(
              lastBox.bottom - 1,
              (panelBox?.bottom ?? window.innerHeight) - 1,
            ),
          )
        : null;
      return {
        text: last?.textContent?.trim() ?? "",
        top: lastBox?.top ?? -1,
        bottom: lastBox?.bottom ?? -1,
        panelTop: panelBox?.top ?? -1,
        panelBottom: panelBox?.bottom ?? -1,
        viewport: window.innerHeight,
        clickable: Boolean(last && hit && (hit === last || last.contains(hit))),
      };
    });
    await browser.close();

    expect(menu.text).toBe("Contact");
    expect(menu.top).toBeGreaterThanOrEqual(menu.panelTop - 1);
    expect(menu.bottom).toBeLessThanOrEqual(menu.viewport + 1);
    expect(menu.bottom).toBeLessThanOrEqual(menu.panelBottom + 1);
    expect(menu.clickable).toBe(true);
  });

  it.each([
    { width: 320, height: 256 },
    { width: 1280, height: 800 },
  ])(
    "keeps header theme and menu icons at 16px at $width with 200% text",
    async ({ width, height }) => {
      const browser = await chromium.launch();
      const page = await browser.newPage({
        viewport: { width, height },
        colorScheme: "light",
      });
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px";
      });
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

      const icons = await page.evaluate(() => {
        const visible = (el: Element | null) => {
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

        const result: { label: string; width: number; height: number }[] = [];
        for (const button of document.querySelectorAll("header button")) {
          if (!visible(button)) continue;
          const label = button.getAttribute("aria-label") ?? "";
          if (
            label !== "Toggle color theme" &&
            label !== "Open menu" &&
            label !== "Close menu"
          ) {
            continue;
          }
          for (const svg of button.querySelectorAll("svg")) {
            const box = visible(svg);
            if (!box) continue;
            result.push({
              label,
              width: box.width,
              height: box.height,
            });
          }
        }
        return result;
      });
      await browser.close();

      expect(icons.some((icon) => icon.label === "Toggle color theme")).toBe(
        true,
      );
      if (width === 320) {
        expect(icons.some((icon) => icon.label === "Open menu")).toBe(true);
      }
      for (const icon of icons) {
        expect(icon.width, `${icon.label} width`).toBe(16);
        expect(icon.height, `${icon.label} height`).toBe(16);
      }
    },
  );

  it.each([
    { width: 320, height: 844, text: 200 },
    { width: 390, height: 844, text: 200 },
    { width: 1280, height: 800, text: 100 },
    { width: 1280, height: 800, text: 200 },
  ])(
    "keeps every link and button icon at 16px at $width with $text% text",
    async ({ width, height, text }) => {
      const browser = await chromium.launch();
      const page = await browser.newPage({
        viewport: { width, height },
        colorScheme: "light",
      });
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      if (text === 200) {
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

      const icons = await page.evaluate(() => {
        return [...document.querySelectorAll("a svg, button svg")]
          .filter((svg) => {
            const style = getComputedStyle(svg);
            const box = svg.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              box.width > 1 &&
              box.height > 1
            );
          })
          .map((svg) => {
            const host = svg.closest("a, button");
            const box = svg.getBoundingClientRect();
            return {
              name:
                host?.getAttribute("aria-label") ||
                host?.textContent?.replace(/\s+/g, " ").trim() ||
                "icon",
              width: Number(box.width.toFixed(1)),
              height: Number(box.height.toFixed(1)),
            };
          });
      });
      await browser.close();

      expect(icons.length).toBeGreaterThan(0);
      expect(
        icons.some((icon) => icon.name.includes("Subscribe on Substack")),
      ).toBe(true);
      for (const icon of icons) {
        expect(icon.width, `${icon.name} width`).toBe(16);
        expect(icon.height, `${icon.name} height`).toBe(16);
      }
    },
  );
});
