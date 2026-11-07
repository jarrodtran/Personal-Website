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

const ROUTES = ["/", "/work/tesla-energy-ai-product/"];

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("print layout test needs a production build in out/");
}

/**
 * Printing is a real path off this site: a recruiter prints the home page or
 * saves a case study as PDF. On paper the page has to be one light sheet with
 * no sticky header, no buttons, and readable ink whatever the screen theme is.
 */
describe("print stylesheet", () => {
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

  async function readPrint(path: string, colorScheme: "light" | "dark") {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      colorScheme,
    });
    await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
    if (colorScheme === "dark") {
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("dark"),
      );
    }
    await page.emulateMedia({ media: "print" });
    const print = await page.evaluate(() => {
      const style = (selector: string) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element) : null;
      };
      const body = getComputedStyle(document.body);
      const header = style("header");
      const footer = style("footer");
      const button = style("main button");
      const section = getComputedStyle(
        document.getElementById("experience") ??
          document.querySelector("main section") ??
          document.body,
      );
      const external = document.querySelector<HTMLAnchorElement>(
        'main a[href^="http"]',
      );
      return {
        bodyBackground: body.backgroundColor,
        bodyColor: body.color,
        headerDisplay: header?.display ?? "missing",
        footerDisplay: footer?.display ?? "missing",
        buttonDisplay: button?.display ?? "none",
        sectionBackground: section.backgroundColor,
        externalUrlInPrint: external
          ? getComputedStyle(external, "::after").content
          : "",
        mainVisible:
          (document.querySelector("main")?.getBoundingClientRect().height ??
            0) > 0,
      };
    });
    await page.emulateMedia({ media: "screen" });
    const screen = await page.evaluate(() => {
      const header = document.querySelector("header");
      return {
        headerDisplay: header ? getComputedStyle(header).display : "missing",
        bodyBackground: getComputedStyle(document.body).backgroundColor,
      };
    });
    await browser.close();
    return { print, screen };
  }

  it("prints the home page light with no header, footer, or buttons", async () => {
    const { print } = await readPrint("/", "dark");
    expect(print.bodyBackground).toBe("rgb(255, 255, 255)");
    expect(print.bodyColor).toBe("rgb(17, 17, 17)");
    expect(print.headerDisplay).toBe("none");
    expect(print.footerDisplay).toBe("none");
    expect(print.buttonDisplay).toBe("none");
    expect(print.sectionBackground).toBe("rgba(0, 0, 0, 0)");
    expect(print.mainVisible).toBe(true);
    expect(print.externalUrlInPrint).toContain("https://");
  });

  it("prints a case study light in system dark mode", async () => {
    const { print } = await readPrint("/work/tesla-energy-ai-product/", "dark");
    expect(print.bodyBackground).toBe("rgb(255, 255, 255)");
    expect(print.headerDisplay).toBe("none");
    expect(print.bodyColor).toBe("rgb(17, 17, 17)");
  });

  it("leaves the screen layout untouched", async () => {
    const { screen } = await readPrint("/", "dark");
    expect(screen.headerDisplay).not.toBe("none");
    expect(screen.bodyBackground).not.toBe("rgb(255, 255, 255)");
  });

  it("covers every built page", async () => {
    for (const path of ROUTES) {
      const { print } = await readPrint(path, "light");
      expect(print.headerDisplay, path).toBe("none");
    }
  }, 120_000);
});
