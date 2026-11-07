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
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
        if (href.startsWith("//")) continue;

        const [target, fragment] = href.split("#");
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
