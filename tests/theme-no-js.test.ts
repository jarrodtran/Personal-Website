import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { palette } from "@/lib/palette";

const types: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
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

function hexToRgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("theme-no-js test needs a production build in out/");
}

describe("theme with JavaScript disabled", () => {
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

  async function paint(path: string, colorScheme: "light" | "dark") {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme,
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(`${origin}${path}`, { waitUntil: "load" });
    const styles = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return {
        background: body.backgroundColor,
        color: body.color,
        htmlClass: document.documentElement.className,
      };
    });
    await browser.close();
    return styles;
  }

  it("uses the dark palette when the OS is dark", async () => {
    const home = await paint("/", "dark");
    expect(home.htmlClass).not.toMatch(/\bdark\b/);
    expect(home.background).toBe(hexToRgb(palette.dark.bg));
    expect(home.color).toBe(hexToRgb(palette.dark.fg));

    const notFound = await paint("/404.html", "dark");
    expect(notFound.background).toBe(hexToRgb(palette.dark.bg));
    expect(notFound.color).toBe(hexToRgb(palette.dark.fg));
  });

  it("keeps the light palette when the OS is light", async () => {
    const home = await paint("/", "light");
    expect(home.background).toBe(hexToRgb(palette.light.bg));
    expect(home.color).toBe(hexToRgb(palette.light.fg));
  });
});
