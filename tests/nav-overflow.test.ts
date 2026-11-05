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

const basePath = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

function withoutBasePath(pathname: string): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }
  return pathname;
}

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("nav overflow test needs a production build in out/");
}

describe("header overflow before scripts load", () => {
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

  it.each(["light", "dark"] as const)(
    "keeps document scrollWidth inside the viewport at 768 with 200% text before scripts load in %s",
    async (colorScheme) => {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        viewport: { width: 768, height: 800 },
        colorScheme,
        javaScriptEnabled: false,
      });
      const page = await context.newPage();
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (request.resourceType() !== "document") {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        const body = (await response.text()).replace(
          "<html",
          '<html style="font-size:200%"',
        );
        await route.fulfill({ response, body });
      });
      await page.goto(`${origin}/`, { waitUntil: "load" });
      const layout = await page.evaluate(() => ({
        scrollWidth: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
        innerWidth: window.innerWidth,
      }));
      await browser.close();
      expect(
        layout.scrollWidth,
        `${colorScheme} 768 200% no-js scrollWidth`,
      ).toBeLessThanOrEqual(layout.innerWidth);
    },
  );
});
