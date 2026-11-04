import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { WRITING_FIXTURE_TITLES } from "./fixtures/writing/titles";

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

function buildWritingFixtureOut(): () => void {
  const root = process.cwd();
  const out = join(root, "out");
  const backup = join(root, "out.tap-empty");
  const fixture = join(root, "tests/fixtures/writing/three-posts.xml");
  rmSync(backup, { recursive: true, force: true });
  cpSync(out, backup, { recursive: true });
  try {
    execFileSync("pnpm", ["build"], {
      cwd: root,
      env: { ...process.env, WRITING_FEED_PATH: fixture },
      stdio: "pipe",
    });
  } catch (error) {
    rmSync(out, { recursive: true, force: true });
    cpSync(backup, out, { recursive: true });
    rmSync(backup, { recursive: true, force: true });
    throw error;
  }
  return () => {
    rmSync(out, { recursive: true, force: true });
    cpSync(backup, out, { recursive: true });
    rmSync(backup, { recursive: true, force: true });
  };
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

  it("keeps the writing subscribe link and post titles at least 44px tall", async () => {
    const { browser, page } = await open("/");
    const writing = await page.evaluate(() => {
      const section = document.getElementById("writing");
      return [...(section?.querySelectorAll("a") ?? [])].map((control) => ({
        name: control.textContent?.replace(/\s+/g, " ").trim() ?? "",
        height: control.getBoundingClientRect().height,
      }));
    });
    await browser.close();
    expect(writing.length).toBeGreaterThan(0);
    expect(
      writing.some((link) => link.name.includes("Subscribe on Substack")),
    ).toBe(true);
    for (const link of writing) {
      expect(link.height, link.name).toBeGreaterThanOrEqual(44);
    }
  });

  it("underlines the first writing title only while hovered", async () => {
    const restore = buildWritingFixtureOut();
    let browser: Awaited<ReturnType<typeof open>>["browser"] | undefined;
    try {
      const opened = await open("/");
      browser = opened.browser;
      const title = opened.page.locator("#writing li a").first();
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
      await browser?.close();
      restore();
    }
  }, 180_000);

  // rule:tap-targets-44px
  it("keeps every visible link and button at least 44px tall", async () => {
    for (const path of ["/", "/work/tesla-energy-ai-product/"]) {
      const { browser, page } = await open(path);
      const short = await page.evaluate(() => {
        const tapBox = (control: Element) => {
          const box = control.getBoundingClientRect();
          const after = getComputedStyle(control, "::after");
          if (
            after.position === "absolute" &&
            after.content &&
            after.content !== "none"
          ) {
            const width = parseFloat(after.width);
            const height = parseFloat(after.height);
            if (Number.isFinite(width) && Number.isFinite(height)) {
              return {
                width: Math.max(box.width, width),
                height: Math.max(box.height, height),
              };
            }
          }
          return box;
        };

        return [...document.querySelectorAll("a, button")]
          .filter((control) => {
            const style = getComputedStyle(control);
            const box = tapBox(control);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              box.width > 1 &&
              box.height > 1
            );
          })
          .filter((control) => tapBox(control).height < 44)
          .map((control) => {
            const name =
              control.getAttribute("aria-label") ||
              control.textContent?.trim() ||
              control.getAttribute("href") ||
              control.tagName;
            return `${name}: ${tapBox(control).height.toFixed(1)}px`;
          });
      });
      await browser.close();
      expect(short, `${path} short controls`).toEqual([]);
    }
  });

  it("makes each selected work title link cover its card with a 44px tap box", async () => {
    const { browser, page } = await open("/");
    const cards = await page.evaluate(
      (slugs) => {
        const section = document.getElementById("work");
        return [...(section?.querySelectorAll("article") ?? [])].map(
          (article, index) => {
            const link = article.querySelector("a");
            const after = link ? getComputedStyle(link, "::after") : null;
            const articleBox = article.getBoundingClientRect();
            const afterWidth = after ? parseFloat(after.width) : 0;
            const afterHeight = after ? parseFloat(after.height) : 0;
            return {
              slug: slugs[index],
              href: link?.getAttribute("href") ?? "",
              linkCount: article.querySelectorAll("a").length,
              afterWidth,
              afterHeight,
              articleWidth: articleBox.width,
              articleHeight: articleBox.height,
            };
          },
        );
      },
      site.selectedWork.map((item) => item.slug),
    );
    await browser.close();

    expect(cards).toHaveLength(site.selectedWork.length);
    for (const card of cards) {
      expect(card.linkCount, card.slug).toBe(1);
      expect(card.href, card.slug).toMatch(new RegExp(`/work/${card.slug}/?$`));
      expect(card.afterWidth, `${card.slug} tap width`).toBeGreaterThanOrEqual(
        44,
      );
      expect(
        card.afterHeight,
        `${card.slug} tap height`,
      ).toBeGreaterThanOrEqual(44);
      expect(
        card.afterWidth,
        `${card.slug} overlay width`,
      ).toBeGreaterThanOrEqual(card.articleWidth - 4);
      expect(
        card.afterHeight,
        `${card.slug} overlay height`,
      ).toBeGreaterThanOrEqual(card.articleHeight - 4);
    }
  });

  it("puts the selected work card ring on the article, not the title link", async () => {
    const { browser, page } = await open("/");
    const title = page.locator("#work article a").first();
    await title.scrollIntoViewIfNeeded();
    await page.keyboard.press("Tab");
    await title.focus();

    const outlines = await title.evaluate((link) => {
      const article = link.closest("article");
      if (!article) return null;
      const linkStyle = getComputedStyle(link);
      const articleStyle = getComputedStyle(article);
      return {
        linkMatches: link.matches(":focus-visible"),
        linkOutlineStyle: linkStyle.outlineStyle,
        articleOutlineStyle: articleStyle.outlineStyle,
        articleOutlineWidth: articleStyle.outlineWidth,
      };
    });
    await browser.close();

    expect(outlines).not.toBeNull();
    expect(outlines?.linkMatches).toBe(true);
    expect(outlines?.linkOutlineStyle).toBe("none");
    expect(outlines?.articleOutlineStyle).toBe("solid");
    expect(outlines?.articleOutlineWidth).toBe("2px");
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
    expect(view.hero).toEqual([site.positioning.headline]);
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

  it("keeps the header short and Résumé reachable at 320x256 with 200% text", async () => {
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

    expect(menu.text).toMatch(/R[ée]sum[ée]/);
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
