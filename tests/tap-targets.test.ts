import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { writingSubscribeUrl } from "@/lib/writing";
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

  it("shows the hero with its two actions, then the Selected work heading, with no posts", async () => {
    const { browser, page } = await open("/");
    const view = await page.evaluate(() => {
      const hero = document.getElementById("top");
      const heading = document.querySelector("#top ~ section h2");
      const box = heading?.getBoundingClientRect();
      return {
        hero: (hero?.innerText || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        writingTitle: heading?.textContent?.trim() ?? "",
        writingBottom: box?.bottom ?? 0,
      };
    });
    await browser.close();
    expect(view.hero.slice(0, 2)).toEqual([
      site.positioning.name,
      site.positioning.intro,
    ]);
    expect(view.hero.slice(2)).toEqual([site.positioning.workAction, "Résumé"]);
    expect(view.hero.join(" ")).not.toContain("Subscribe");
    expect(view.writingTitle).toBe(site.sections.work.title);
    expect(view.writingBottom).toBeGreaterThan(0);
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
    expect(left.h1).toBe(96);
    expect(left.brand).toBe(96);
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
      const navLinks = [
        ...document.querySelectorAll('header nav[aria-label="Primary"] a'),
      ].filter((el) => visibleBox(el));
      const menuButton = visibleBox(
        document.querySelector('header button[aria-label="Open menu"]'),
      );
      const headerBox = header?.getBoundingClientRect();
      const nameBox = visibleBox(nameLink);

      return {
        nameWidth: nameBox?.width ?? 0,
        nameLeft: nameBox?.left ?? null,
        headerMid: headerBox ? headerBox.left + headerBox.width / 2 : 0,
        themeLeft: theme?.left ?? null,
        navLinkCount: navLinks.length,
        menuButton: Boolean(menuButton),
      };
    }, site.positioning.name);
    await browser.close();
    return layout;
  }

  it.each(["light", "dark"] as const)(
    "keeps Jarrod Tran readable, every nav link visible, and the theme toggle on the right at 390px %s",
    async (colorScheme) => {
      const layout = await headerLayout(390, colorScheme);
      expect(layout.nameWidth).toBeGreaterThanOrEqual(80);
      expect(layout.themeLeft).toBeGreaterThanOrEqual(layout.headerMid);
      expect(layout.navLinkCount).toBe(site.nav.length);
      expect(layout.menuButton).toBe(false);
    },
  );

  it.each(["light", "dark"] as const)(
    "does not regress the header at 1280px %s",
    async (colorScheme) => {
      const layout = await headerLayout(1280, colorScheme);
      expect(layout.nameWidth).toBeGreaterThanOrEqual(80);
      expect(layout.nameLeft).toBe(96);
      expect(layout.themeLeft).toBeGreaterThanOrEqual(layout.headerMid);
      expect(layout.navLinkCount).toBe(site.nav.length);
      expect(layout.menuButton).toBe(false);
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

  it("gives /writing/ a native 44px signup form that submits to Substack", async () => {
    const { browser, page } = await open("/writing/");
    const form = await page.evaluate(() => {
      const el = document.querySelector<HTMLFormElement>(
        "[data-testid=subscribe] form",
      );
      const input = el?.querySelector<HTMLInputElement>("input");
      const button = el?.querySelector<HTMLButtonElement>("button");
      const box = (node: Element | null | undefined) => {
        const r = node?.getBoundingClientRect();
        return { w: r?.width ?? 0, h: r?.height ?? 0 };
      };
      return {
        iframes: document.querySelectorAll("iframe").length,
        method: el?.method,
        target: el?.target,
        rel: el?.getAttribute("rel"),
        action: el?.action,
        type: input?.type,
        name: input?.name,
        required: input?.required,
        autocomplete: input?.autocomplete,
        label: input?.labels?.[0]?.textContent?.trim(),
        input: box(input),
        button: box(button),
      };
    });
    await browser.close();
    expect(form.iframes).toBe(0);
    expect(form.method).toBe("get");
    expect(form.target).toBe("_blank");
    expect(form.rel).toContain("noopener");
    expect(form.action).toBe(writingSubscribeUrl(site.substack));
    expect(form.type).toBe("email");
    expect(form.name).toBe("email");
    expect(form.required).toBe(true);
    expect(form.autocomplete).toBe("email");
    expect(form.label).toBeTruthy();
    expect(form.input.h).toBeGreaterThanOrEqual(44);
    expect(form.button.h).toBeGreaterThanOrEqual(44);
    expect(form.button.w).toBeGreaterThanOrEqual(44);
  });

  it("resolves résumé, email, LinkedIn, and the next case-study link", async () => {
    const { browser, page } = await open("/");
    const home = await page.evaluate(() => {
      const resume = document.querySelector<HTMLAnchorElement>(
        '#about a[href$="/resume/"]',
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
    expect(home.resume).toMatch(/\/resume\/$/);
    expect(home.email).toBe(`mailto:${site.contact.email}`);
    expect(home.linkedin).toBe(site.contact.linkedin);

    const casePage = await open("/work/tesla-energy-ai-product/");
    const nextHref = await casePage.page
      .locator("a", { hasText: "Next:" })
      .getAttribute("href");
    await casePage.browser.close();
    expect(nextHref).toMatch(/\/work\/tesla-energy-portfolio\/?$/);
  });

  it("keeps the header out of the way and every nav link reachable at 320x256 with 200% text", async () => {
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

    // Below md the links wrap under the name instead of hiding behind a menu
    // button, and the header scrolls away so the extra rows never cover text.
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector("header")!).position,
    );
    expect(position).not.toBe("sticky");
    expect(position).not.toBe("fixed");

    const last = page.locator('header nav[aria-label="Primary"] a').last();
    await last.scrollIntoViewIfNeeded();
    const result = await last.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return {
        text: el.textContent?.trim() ?? "",
        clickable: Boolean(hit && (hit === el || el.contains(hit))),
      };
    });
    await browser.close();

    expect(result.text).toBe("Résumé");
    expect(result.clickable).toBe(true);
  });

  it.each([
    { width: 320, height: 256 },
    { width: 1280, height: 800 },
  ])(
    "keeps the header theme icon at 16px at $width with 200% text",
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
          if (label !== "Toggle color theme") continue;
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
      expect(icons.some((icon) => icon.name.startsWith("Subscribe"))).toBe(
        true,
      );
      for (const icon of icons) {
        expect(icon.width, `${icon.name} width`).toBe(16);
        expect(icon.height, `${icon.name} height`).toBe(16);
      }
    },
  );
});
