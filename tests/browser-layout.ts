import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import type { Page } from "playwright-core";

export const LAYOUT_WIDTHS = [320, 390, 640, 767, 768, 1280] as const;
export const TEXT_SCALES = [100, 200] as const;
export const COLOR_SCHEMES = ["light", "dark"] as const;

export type TextScale = (typeof TEXT_SCALES)[number];
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export type LayoutViolation = {
  kind: "page-overflow" | "element-overflow" | "tap-target";
  name: string;
  detail: string;
};

const types: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const SKIP_ENTRY = /^[._]/;

export function siteBasePath(): string {
  return (process.env.BASE_PATH ?? "").replace(/\/$/, "");
}

export function withoutBasePath(
  pathname: string,
  basePath = siteBasePath(),
): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }
  return pathname;
}

export function requireOutBuild(message: string): string {
  const outDir = join(process.cwd(), "out");
  if (!existsSync(join(outDir, "index.html"))) {
    throw new Error(message);
  }
  return outDir;
}

export function listTopLevelPageRoutes(outDir: string): string[] {
  const routes: string[] = [];

  function visit(dir: string, urlPath: string) {
    for (const name of readdirSync(dir)) {
      if (name === "404.html" || name === "404") continue;
      if (SKIP_ENTRY.test(name)) continue;
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        visit(full, `${urlPath}${name}/`);
        continue;
      }
      if (name === "index.html") {
        routes.push(urlPath === "" ? "/" : `/${urlPath}`);
      }
    }
  }

  visit(outDir, "");
  return routes.sort();
}

export async function startOutServer(outDir = "out"): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const basePath = siteBasePath();
  const server: Server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    const stripped = withoutBasePath(pathname, basePath);
    const path = stripped.endsWith("/") ? `${stripped}index.html` : stripped;
    const file = join(outDir, normalize(decodeURIComponent(path)));
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
  return {
    origin: `http://127.0.0.1:${address.port}${basePath}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export function collectLayoutViolations(): LayoutViolation[] {
  const viewport = document.documentElement.clientWidth;
  const violations: LayoutViolation[] = [];

  const nameOf = (el: Element) =>
    el.getAttribute("aria-label") ||
    el.getAttribute("data-layout-probe") ||
    el.textContent?.replace(/\s+/g, " ").trim() ||
    el.getAttribute("href") ||
    el.tagName;

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
    return { width: box.width, height: box.height };
  };

  const isSkipLink = (el: Element) => {
    if (el.tagName !== "A") return false;
    const href = el.getAttribute("href") ?? "";
    const text = (el.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return href === "#content" || text.startsWith("skip ");
  };

  const isVisuallyHidden = (el: Element) => {
    if (el.closest(".sr-only")) return true;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
    if (parseFloat(style.opacity) === 0) return true;
    const box = el.getBoundingClientRect();
    if (box.width <= 1 && box.height <= 1) return true;
    if (style.clipPath === "inset(100%)") return true;
    if (/^rect\(\s*0px,\s*0px,\s*0px,\s*0px\s*\)$/.test(style.clip))
      return true;
    return false;
  };

  const isInlineProseLink = (el: Element) => {
    if (el.tagName !== "A") return false;
    if (getComputedStyle(el).display !== "inline") return false;
    const block = el.closest("p, li, dd, blockquote, figcaption");
    if (!block) return false;
    const blockText = (block.textContent ?? "").replace(/\s+/g, " ").trim();
    const linkText = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    return Boolean(linkText) && blockText !== linkText;
  };

  const scrollWidth = document.documentElement.scrollWidth;
  if (scrollWidth > viewport) {
    violations.push({
      kind: "page-overflow",
      name: "document",
      detail: `scrollWidth ${scrollWidth} > clientWidth ${viewport}`,
    });
  }

  const overflowing: Element[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (isVisuallyHidden(el) || isSkipLink(el)) continue;
    if (el.getBoundingClientRect().right > viewport + 1) {
      overflowing.push(el);
    }
  }
  for (const el of overflowing) {
    if (overflowing.some((other) => other !== el && other.contains(el)))
      continue;
    const box = el.getBoundingClientRect();
    violations.push({
      kind: "element-overflow",
      name: nameOf(el),
      detail: `right ${box.right.toFixed(1)} > viewport ${viewport}`,
    });
  }

  for (const control of document.querySelectorAll("a, button, input")) {
    if (
      control.tagName === "INPUT" &&
      control.getAttribute("type") === "hidden"
    ) {
      continue;
    }
    if (
      isVisuallyHidden(control) ||
      isSkipLink(control) ||
      isInlineProseLink(control)
    ) {
      continue;
    }
    const box = tapBox(control);
    if (box.width < 44 || box.height < 44) {
      violations.push({
        kind: "tap-target",
        name: nameOf(control),
        detail: `${box.width.toFixed(1)}x${box.height.toFixed(1)} < 44x44`,
      });
    }
  }

  return violations;
}

export function formatLayoutFailure(
  route: string,
  width: number,
  textScale: TextScale,
  colorScheme: ColorScheme,
  violation: LayoutViolation,
): string {
  return `${route} ${width} ${textScale}% ${colorScheme}: ${violation.name} ${violation.kind} ${violation.detail}`;
}

export async function settleLayoutPage(
  page: Page,
  colorScheme: ColorScheme,
  textScale: TextScale,
): Promise<void> {
  if (colorScheme === "dark") {
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("dark"),
    );
  }
  if (textScale === 200) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
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
  if (textScale === 200) {
    await page.waitForTimeout(300);
  }
}
