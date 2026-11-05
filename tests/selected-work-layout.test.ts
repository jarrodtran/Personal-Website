import { chromium, type Browser } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { requireOutBuild, startOutServer } from "./browser-layout";

requireOutBuild("selected-work layout test needs a production build in out/");

const WIDTHS = [320, 390, 640, 768, 1280] as const;
type Width = (typeof WIDTHS)[number];

const VIEWPORT_HEIGHT: Record<Width, number> = {
  320: 844,
  390: 844,
  640: 800,
  768: 800,
  1280: 800,
};

// #work heights measured on main 7200137 (the two-column card grid this PR
// replaces) in this Playwright Chromium setup. The prose layout must not grow
// the section at 100% text and must be shorter at 200% text.
const MAIN_WORK_HEIGHT: Record<Width, { 100: number; 200: number }> = {
  320: { 100: 3286.8125, 200: 14197.78125 },
  390: { 100: 3033.25, 200: 11132.53125 },
  640: { 100: 2450.78125, 200: 10304.109375 },
  768: { 100: 2323.125, 200: 8495.46875 },
  1280: { 100: 2323.125, 200: 4745.0625 },
};

const MIN_PARAGRAPH_WIDTH = 240;

describe("selected work prose entries", () => {
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

  async function readLayout(width: Width, textPercent: 100 | 200) {
    const page = await browser.newPage({
      viewport: { width, height: VIEWPORT_HEIGHT[width] },
      colorScheme: "light",
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${origin}/`, { waitUntil: "load", timeout: 60_000 });
    if (textPercent === 200) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
    }
    await page.waitForTimeout(500);
    const layout = await page.evaluate(
      (panelValues) => {
        const work = document.getElementById("work");
        const workBox = work?.getBoundingClientRect();
        const entries = [
          ...(work?.querySelectorAll<HTMLElement>("[data-work-entry]") ?? []),
        ];
        const list = work?.querySelector("ol") ?? null;
        const parentStyle = list ? getComputedStyle(list) : null;
        const rows = entries.map((entry, index) => {
          const entryBox = entry.getBoundingClientRect();
          const entryStyle = getComputedStyle(entry);
          const heading = entry.querySelector("h3");
          const headingBox = heading?.getBoundingClientRect();
          const link = entry.querySelector("a");
          const after = link ? getComputedStyle(link, "::after") : null;
          const figure = entry.querySelector("[data-work-figure]");
          const figureStyle = figure ? getComputedStyle(figure) : null;
          const figureBox = figure?.getBoundingClientRect();
          const label = entry.querySelector("[data-work-label]");
          const labelBox = label?.getBoundingClientRect();
          const metric = entry.querySelector("[data-work-metric]");
          const metricStyle = metric ? getComputedStyle(metric) : null;
          const paragraphs = [
            ...entry.querySelectorAll(
              "p:not([data-work-figure]):not([data-work-label])",
            ),
          ];
          return {
            value: panelValues[index] ?? "",
            title: heading?.textContent?.trim() ?? "",
            href: link?.getAttribute("href") ?? "",
            linkCount: entry.querySelectorAll("a").length,
            left: entryBox.left,
            right: entryBox.right,
            top: entryBox.top,
            width: entryBox.width,
            height: entryBox.height,
            reveal: entry.classList.contains("reveal"),
            borderTopWidth: entryStyle.borderTopWidth,
            borderTopStyle: entryStyle.borderTopStyle,
            titleBottom: headingBox?.bottom ?? -1,
            figure: {
              text: figure?.textContent?.trim() ?? "",
              fontSize: figureStyle ? parseFloat(figureStyle.fontSize) : -1,
              left: figureBox?.left ?? -1,
              right: figureBox?.right ?? -1,
              top: figureBox?.top ?? -1,
              scrollWidth: figure?.scrollWidth ?? -1,
              clientWidth: figure?.clientWidth ?? -1,
            },
            label: {
              text: label?.textContent?.trim() ?? "",
              left: labelBox?.left ?? -1,
              right: labelBox?.right ?? -1,
              top: labelBox?.top ?? -1,
              bottom: labelBox?.bottom ?? -1,
            },
            metric: {
              backgroundColor: metricStyle?.backgroundColor ?? "",
              aspectRatio: metricStyle?.aspectRatio ?? "auto",
            },
            paragraphs: paragraphs.map((paragraph) => {
              const box = paragraph.getBoundingClientRect();
              return {
                text: paragraph.textContent?.trim() ?? "",
                left: box.left,
                right: box.right,
                top: box.top,
                width: box.width,
              };
            }),
            afterWidth: after ? parseFloat(after.width) : 0,
            afterHeight: after ? parseFloat(after.height) : 0,
          };
        });
        return {
          heading: work?.querySelector("h2")?.textContent?.trim() ?? "",
          workLeft: workBox?.left ?? -1,
          workRight: workBox?.right ?? -1,
          workWidth: workBox?.width ?? -1,
          workHeight: workBox?.height ?? -1,
          parentDisplay: parentStyle?.display ?? "",
          parentGrid: parentStyle?.gridTemplateColumns ?? "",
          rows,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      },
      site.selectedWork.map((item) => item.panel.value),
    );
    await page.close();
    return { ...layout, errors };
  }

  type Layout = Awaited<ReturnType<typeof readLayout>>;
  const cache = new Map<string, Layout>();

  async function measure(width: Width, textPercent: 100 | 200) {
    const key = `${width}-${textPercent}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const layout = await readLayout(width, textPercent);
    cache.set(key, layout);
    return layout;
  }

  it("renders one full-width single-column entry per case study", async () => {
    for (const width of WIDTHS) {
      const layout = await measure(width, 100);
      expect(layout.heading, `${width} heading`).toBe(site.sections.work.title);
      expect(layout.parentDisplay, `${width} list display`).toBe("block");
      expect(layout.parentGrid, `${width} list grid`).toBe("none");
      expect(layout.rows, `${width} entries`).toHaveLength(
        site.selectedWork.length,
      );

      layout.rows.forEach((row, index) => {
        const item = site.selectedWork[index];
        expect(row.title, `${width} entry ${index} title`).toBe(item.title);
        expect(row.href, `${width} entry ${index} href`).toBe(
          `/work/${item.slug}/`,
        );
        expect(row.left, `${width} entry ${index} left`).toBeCloseTo(
          layout.workLeft,
          0,
        );
        expect(row.width, `${width} entry ${index} width`).toBeCloseTo(
          layout.workWidth,
          0,
        );
        expect(row.reveal, `${width} entry ${index} reveal`).toBe(true);
        expect(row.borderTopWidth, `${width} entry ${index} divider`).toBe(
          "1px",
        );
        expect(
          row.borderTopStyle,
          `${width} entry ${index} divider style`,
        ).toBe("solid");
      });

      for (let index = 1; index < layout.rows.length; index += 1) {
        expect(
          layout.rows[index].top,
          `${width} entry ${index} stacked below ${index - 1}`,
        ).toBeGreaterThan(layout.rows[index - 1].top);
      }
    }
  }, 120_000);

  it("renders each metric as a transparent lead line above the prose", async () => {
    for (const width of WIDTHS) {
      const layout = await measure(width, 100);
      expect(layout.rows, `${width} entries`).toHaveLength(
        site.selectedWork.length,
      );
      layout.rows.forEach((row, index) => {
        const item = site.selectedWork[index];
        expect(row.figure.text, `${width} ${item.slug} figure`).toBe(
          item.panel.value,
        );
        expect(row.label.text, `${width} ${item.slug} label`).toBe(
          item.panel.label,
        );
        expect(
          row.metric.backgroundColor,
          `${width} ${item.slug} metric background`,
        ).toBe("rgba(0, 0, 0, 0)");
        expect(
          row.metric.aspectRatio,
          `${width} ${item.slug} metric aspect`,
        ).toBe("auto");
        expect(
          row.figure.fontSize,
          `${width} ${item.slug} display figure`,
        ).toBeGreaterThanOrEqual(32);
        expect(
          row.figure.top,
          `${width} ${item.slug} lead line below title`,
        ).toBeGreaterThanOrEqual(row.titleBottom - 1);
        expect(
          row.figure.top,
          `${width} ${item.slug} lead line above prose`,
        ).toBeLessThan(row.paragraphs[0].top);
        expect(
          row.figure.left,
          `${width} ${item.slug} figure left`,
        ).toBeGreaterThanOrEqual(row.left - 1);
        expect(
          row.label.right,
          `${width} ${item.slug} label right`,
        ).toBeLessThanOrEqual(row.right + 1);
      });
    }
  }, 120_000);

  it("keeps every problem, contribution, and outcome paragraph readable", async () => {
    for (const width of WIDTHS) {
      for (const textPercent of [100, 200] as const) {
        const layout = await measure(width, textPercent);
        expect(layout.rows, `${width} ${textPercent}% entries`).toHaveLength(
          site.selectedWork.length,
        );
        layout.rows.forEach((row, index) => {
          const item = site.selectedWork[index];
          expect(
            row.paragraphs,
            `${width} ${textPercent}% ${item.slug}`,
          ).toHaveLength(3);
          expect(
            row.paragraphs.map((paragraph) => paragraph.text),
            `${width} ${textPercent}% ${item.slug} copy`,
          ).toEqual([item.problem, item.contribution, item.outcome]);
          row.paragraphs.forEach((paragraph, paragraphIndex) => {
            expect(
              paragraph.width,
              `${width} ${textPercent}% ${item.slug} paragraph ${paragraphIndex} width`,
            ).toBeGreaterThanOrEqual(MIN_PARAGRAPH_WIDTH);
            expect(
              paragraph.width,
              `${width} ${textPercent}% ${item.slug} paragraph ${paragraphIndex} fits entry`,
            ).toBeLessThanOrEqual(row.width + 1);
            expect(
              paragraph.left,
              `${width} ${textPercent}% ${item.slug} paragraph ${paragraphIndex} left`,
            ).toBeGreaterThanOrEqual(row.left - 1);
            expect(
              paragraph.right,
              `${width} ${textPercent}% ${item.slug} paragraph ${paragraphIndex} right`,
            ).toBeLessThanOrEqual(row.right + 1);
          });
        });
      }
    }
  }, 120_000);

  it("keeps every figure and label inside its entry at 200% text", async () => {
    for (const width of WIDTHS) {
      const at100 = await measure(width, 100);
      const at200 = await measure(width, 200);
      expect(at200.overflow, `${width} 200% horizontal scroll`).toBe(false);
      expect(at200.rows, `${width} 200% entries`).toHaveLength(
        site.selectedWork.length,
      );
      at200.rows.forEach((row, index) => {
        const small = at100.rows[index];
        const item = site.selectedWork[index];
        expect(row.figure.text, `${width} ${item.slug} figure text`).toBe(
          item.panel.value,
        );
        expect(row.label.text, `${width} ${item.slug} label text`).toBe(
          item.panel.label,
        );
        expect(
          row.figure.fontSize,
          `${width} ${item.slug} figure grows at 200%`,
        ).toBeGreaterThan(small.figure.fontSize);
        expect(
          row.figure.scrollWidth,
          `${width} ${item.slug} figure scroll width`,
        ).toBeLessThanOrEqual(row.figure.clientWidth + 1);
        expect(
          row.figure.left,
          `${width} ${item.slug} figure left`,
        ).toBeGreaterThanOrEqual(row.left - 1);
        expect(
          row.figure.right,
          `${width} ${item.slug} figure right`,
        ).toBeLessThanOrEqual(row.right + 1);
        expect(
          row.label.left,
          `${width} ${item.slug} label left`,
        ).toBeGreaterThanOrEqual(row.left - 1);
        expect(
          row.label.right,
          `${width} ${item.slug} label right`,
        ).toBeLessThanOrEqual(row.right + 1);
        expect(
          row.label.bottom,
          `${width} ${item.slug} label bottom`,
        ).toBeLessThanOrEqual(row.height + row.top + 1);
      });
    }
  }, 120_000);

  it("does not grow #work past the old card grid, and shortens at 200% text", async () => {
    for (const width of WIDTHS) {
      const at100 = await measure(width, 100);
      const at200 = await measure(width, 200);
      expect(
        at100.workHeight,
        `${width} 100% #work height`,
      ).toBeLessThanOrEqual(MAIN_WORK_HEIGHT[width][100]);
      expect(at200.workHeight, `${width} 200% #work height`).toBeLessThan(
        MAIN_WORK_HEIGHT[width][200],
      );
    }
  }, 120_000);

  it("does not overflow or log console errors at any width", async () => {
    for (const width of WIDTHS) {
      for (const textPercent of [100, 200] as const) {
        const layout = await measure(width, textPercent);
        expect(layout.overflow, `${width} ${textPercent}% overflow`).toBe(
          false,
        );
        expect(layout.errors, `${width} ${textPercent}% console`).toEqual([]);
      }
    }
  }, 120_000);

  it("covers each entry with a 44px-tall title link overlay", async () => {
    for (const [width, textPercent] of [
      [320, 100],
      [390, 100],
      [1280, 200],
    ] as const) {
      const layout = await measure(width, textPercent);
      expect(layout.rows, `${width} ${textPercent}% entries`).toHaveLength(
        site.selectedWork.length,
      );
      layout.rows.forEach((row, index) => {
        const item = site.selectedWork[index];
        expect(row.linkCount, `${width} ${item.slug} link count`).toBe(1);
        expect(
          row.afterWidth,
          `${width} ${item.slug} tap width`,
        ).toBeGreaterThanOrEqual(Math.max(44, row.width - 4));
        expect(
          row.afterHeight,
          `${width} ${item.slug} tap height`,
        ).toBeGreaterThanOrEqual(Math.max(44, row.height - 4));
      });
    }
  }, 120_000);

  it("puts the focus ring on the entry, not the title link", async () => {
    const layout = await measure(1280, 100);
    expect(layout.rows).toHaveLength(site.selectedWork.length);
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: "light",
    });
    await page.goto(`${origin}/`, { waitUntil: "load" });
    const title = page.locator("#work [data-work-entry] a").first();
    await title.scrollIntoViewIfNeeded();
    await title.focus();
    const outlines = await title.evaluate((link) => {
      const entry = link.closest("article");
      if (!entry) return null;
      return {
        linkMatches: link.matches(":focus-visible"),
        linkOutlineStyle: getComputedStyle(link).outlineStyle,
        entryOutlineStyle: getComputedStyle(entry).outlineStyle,
        entryOutlineWidth: getComputedStyle(entry).outlineWidth,
      };
    });
    await page.close();

    expect(outlines).not.toBeNull();
    expect(outlines?.linkMatches).toBe(true);
    expect(outlines?.linkOutlineStyle).toBe("none");
    expect(outlines?.entryOutlineStyle).toBe("solid");
    expect(outlines?.entryOutlineWidth).toBe("2px");
  }, 120_000);
});
