import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

if (!existsSync(join(process.cwd(), "out/index.html"))) {
  throw new Error("tokens test needs a production build in out/");
}

describe("design tokens on :root", () => {
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

  it("exposes --container-prose and body typography via computed styles", async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(`${origin}/`, { waitUntil: "load" });

    const metrics = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.setAttribute("data-testid", "token-probe");
      probe.style.maxWidth = "var(--container-prose)";
      probe.style.width = "100vw";
      document.body.appendChild(probe);
      const probeStyle = getComputedStyle(probe);
      const bodyStyle = getComputedStyle(document.body);
      return {
        probeWidth: probeStyle.width,
        fontSize: bodyStyle.fontSize,
        lineHeight: bodyStyle.lineHeight,
      };
    });

    await browser.close();

    expect(parseFloat(metrics.probeWidth)).toBe(640);
    expect(metrics.fontSize).toBe("18px");
    expect(parseFloat(metrics.lineHeight)).toBeCloseTo(29.7, 2);
  });

  it("writes each hex once inside :root", async () => {
    const chunks = join(process.cwd(), "out/_next/static/chunks");
    const file = readdirSync(chunks).find((name) => name.endsWith(".css"));
    expect(file, "built stylesheet").toBeTruthy();
    const css = await readFile(join(chunks, file ?? ""), "utf8");
    const counts = new Map<string, number>();
    for (const block of rootBlocks(css)) {
      for (const match of block.matchAll(/#(?:[0-9a-fA-F]{3,8})\b/g)) {
        const hex = normalizeHex(match[0]);
        counts.set(hex, (counts.get(hex) ?? 0) + 1);
      }
    }
    const repeated = [...counts.entries()].filter(([, count]) => count > 1);
    expect(repeated).toEqual([]);
  });
});

function rootBlocks(css: string): string[] {
  const blocks: string[] = [];
  for (const match of css.matchAll(/:root\s*\{/g)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let index = start;
    while (index < css.length && depth > 0) {
      const char = css[index];
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      index += 1;
    }
    blocks.push(css.slice(start, index - 1));
  }
  return blocks;
}

function normalizeHex(hex: string): string {
  let body = hex.slice(1).toLowerCase();
  if (body.length === 3 || body.length === 4) {
    body = [...body].map((char) => `${char}${char}`).join("");
  }
  if (body.length === 8) body = body.slice(0, 6);
  return `#${body}`;
}
