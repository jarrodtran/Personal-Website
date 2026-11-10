import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const OUT = join(process.cwd(), "out");

if (!existsSync(join(OUT, "index.html"))) {
  throw new Error("internal link test needs a production build in out/");
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith(".html") ? [path] : [];
  });
}

function route(file: string): string {
  const path = relative(OUT, file).split("\\").join("/");
  return path === "index.html" ? "/" : `/${path.replace(/index\.html$/, "")}`;
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/\shref="([^"]*)"/g)].map((match) => match[1]);
}

/** Every value of a double-quoted attribute, e.g. src, srcset, action. */
function attributes(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map(
    (match) => match[1],
  );
}

/** One candidate per srcset entry, dropping the width or density descriptor. */
function srcsetEntries(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

const ORIGIN = "https://jarrodtran.com";
const BASE_PATH = (process.env.BASE_PATH ?? "").replace(/\/$/, "");

/**
 * The export-relative path of a same-site URL, or null for an external one.
 * Handles the apex origin and a BASE_PATH build prefix.
 */
function localPath(value: string): string | null {
  let path = value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    if (!path.startsWith(ORIGIN)) return null;
    path = path.slice(ORIGIN.length) || "/";
  }
  if (path.startsWith("//")) return null;
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length) || "/";
  }
  return path.startsWith("/") ? path : null;
}

function ids(html: string): Set<string> {
  return new Set(
    [...html.matchAll(/\sid="([^"]*)"/g)].map((match) => match[1]),
  );
}

/** A route or asset path to the file the static export serves for it. */
function fileFor(path: string): string {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  const direct = join(OUT, clean);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  return join(direct, "index.html");
}

const pages = htmlFiles(OUT);
const pageIds = new Map(
  pages.map((file) => [route(file), ids(readFileSync(file, "utf8"))]),
);

describe("internal links in the built export", () => {
  it("resolves every internal href and fragment", () => {
    const missing: string[] = [];
    const brokenAnchors: string[] = [];

    for (const file of pages) {
      const from = route(file);
      for (const href of hrefs(readFileSync(file, "utf8"))) {
        if (!href) continue;

        const local = localPath(href);
        if (!local) continue;

        const [target, fragment] = local.split("#");
        const path = target === "" ? from : target;

        if (path.startsWith("/_next/")) continue;

        const resolved = path.startsWith("/") ? fileFor(path) : null;
        if (!resolved || !existsSync(resolved)) {
          missing.push(`${from} -> ${href}`);
          continue;
        }

        if (fragment) {
          const targetIds = pageIds.get(path);
          if (!targetIds || !targetIds.has(fragment)) {
            brokenAnchors.push(`${from} -> ${href}`);
          }
        }
      }
    }

    expect(missing, missing.join("\n")).toEqual([]);
    expect(brokenAnchors, brokenAnchors.join("\n")).toEqual([]);
  });

  it("resolves every internal src and srcset asset", () => {
    const missing: string[] = [];

    for (const file of pages) {
      const from = route(file);
      const html = readFileSync(file, "utf8");
      const candidates = [
        ...attributes(html, "src"),
        ...attributes(html, "srcset").flatMap(srcsetEntries),
      ];

      for (const value of candidates) {
        if (!value || value.startsWith("data:")) continue;
        const local = localPath(value);
        if (!local) continue;
        const asset = fileFor(local);
        if (!existsSync(asset)) missing.push(`${from} -> ${value}`);
      }
    }

    expect(missing, missing.join("\n")).toEqual([]);
  });

  it("writes every mailto as a plain address", () => {
    const odd: string[] = [];

    for (const file of pages) {
      for (const href of hrefs(readFileSync(file, "utf8"))) {
        if (!href.toLowerCase().startsWith("mailto:")) continue;
        const address = href.slice("mailto:".length).split("?")[0];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
          odd.push(`${route(file)} -> ${href}`);
        }
      }
    }

    expect(odd, odd.join("\n")).toEqual([]);
  });

  it("ships the résumé the header and contact list download", () => {
    expect(existsSync(join(OUT, "resume.pdf"))).toBe(true);
    expect(statSync(join(OUT, "resume.pdf")).size).toBeGreaterThan(1000);
  });

  it("reaches every case study from the home page", () => {
    const home = readFileSync(join(OUT, "index.html"), "utf8");
    const links = hrefs(home).filter((href) => href.startsWith("/work/"));
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      expect(existsSync(fileFor(href)), href).toBe(true);
    }
  });
});
