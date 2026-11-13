import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { site, siteUrl } from "@/content/site";
import { normalizeBasePath } from "@/lib/base-path";

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

const ORIGIN = new URL(siteUrl).origin;
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);

/** Resolve relative and same-origin links against the page serving them. */
function localUrl(value: string, from: string) {
  const url = new URL(value, `${ORIGIN}${BASE_PATH}${from}`);
  if (url.origin !== ORIGIN) return null;

  let path = url.pathname;
  if (BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`))) {
    path = path.slice(BASE_PATH.length) || "/";
  }
  return { path, fragment: decodeURIComponent(url.hash.slice(1)) };
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

        const local = localUrl(href, from);
        if (!local) continue;

        const { path, fragment } = local;
        const resolved = fileFor(path);
        if (!existsSync(resolved)) {
          missing.push(`${from} -> ${href}`);
          continue;
        }

        if (fragment) {
          const targetIds = pageIds.get(route(resolved));
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
        const local = localUrl(value, from);
        if (!local) continue;
        const asset = fileFor(local.path);
        if (!existsSync(asset)) missing.push(`${from} -> ${value}`);
      }
    }

    expect(missing, missing.join("\n")).toEqual([]);
  });

  it("includes a valid recipient in every mailto", () => {
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

  it("ships a nonempty résumé PDF", () => {
    expect(existsSync(join(OUT, "resume.pdf"))).toBe(true);
    expect(statSync(join(OUT, "resume.pdf")).size).toBeGreaterThan(1000);
  });

  it("reaches every case study from the home page", () => {
    const home = readFileSync(join(OUT, "index.html"), "utf8");
    const paths = hrefs(home).map((href) => localUrl(href, "/")?.path);
    for (const { slug } of site.selectedWork) {
      expect(paths).toContain(`/work/${slug}/`);
    }
  });
});
