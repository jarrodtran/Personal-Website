import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { missingEssays } from "../scripts/postbuild.mjs";
import { site } from "@/content/site";
import { WRITING_FIXTURE_ALL_TITLES } from "./fixtures/writing/titles";

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");

if (!existsSync(path.join(outDir, "index.html"))) {
  throw new Error("writing-output test needs a production build in out/");
}

function walkFiles(dir: string, match: (name: string) => boolean): string[] {
  const found: string[] = [];
  for (const file of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
    if (match(file)) found.push(path.join(dir, file));
  }
  return found;
}

describe("writing fixtures stay out of the shipped site", () => {
  it("does not include any fixture post title in built HTML", () => {
    const hits: string[] = [];
    for (const file of walkFiles(outDir, (name) => name.endsWith(".html"))) {
      const html = readFileSync(file, "utf8");
      for (const title of WRITING_FIXTURE_ALL_TITLES) {
        if (html.includes(title)) {
          hits.push(`${path.relative(root, file)}: ${title}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("drops the essay route placeholder from the export", () => {
    expect(existsSync(path.join(outDir, "writing", "_none"))).toBe(false);
  });

  it("does not keep fixture posts in content/", () => {
    const contentDir = path.join(root, "content");
    const hits: string[] = [];
    for (const file of walkFiles(contentDir, (name) =>
      /\.(ts|tsx)$/.test(name),
    )) {
      const source = readFileSync(file, "utf8");
      for (const title of WRITING_FIXTURE_ALL_TITLES) {
        if (source.includes(title)) {
          hits.push(`${path.relative(root, file)}: ${title}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("empty and failed feeds look the same to visitors", () => {
  it("shows the coming-soon copy, not a Substack link, when the build has no essays", () => {
    const html = readFileSync(path.join(outDir, "index.html"), "utf8");
    if (html.includes("/writing/") && /<ol\b/.test(html)) return;
    expect(html).toContain(site.writing.empty);
    expect(html).not.toContain(`Read ${site.substack.name} on Substack`);
  });
});

describe("native signup form", () => {
  it("replaces the Substack iframe on /writing/", () => {
    const html = readFileSync(
      path.join(outDir, "writing", "index.html"),
      "utf8",
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("/embed");
    expect(html).toMatch(/<form[^>]*method="get"/);
    expect(html).toMatch(/<input[^>]*type="email"/);
  });
});

describe("postbuild feed check", () => {
  const marker = {
    source: "snapshot",
    count: 1,
    newest: { href: "https://example.substack.com/p/a", path: "/writing/a/" },
  };

  it("fails when the feed has an own post the homepage does not list", () => {
    expect(missingEssays(marker, "<html>nothing</html>")).toHaveLength(1);
  });

  it("passes when the homepage lists it, or the feed has no posts", () => {
    expect(missingEssays(marker, '<a href="/writing/a/">A</a>')).toEqual([]);
    expect(missingEssays({ ...marker, count: 0, newest: null }, "")).toEqual(
      [],
    );
    expect(missingEssays(null, "")).toEqual([]);
  });
});
