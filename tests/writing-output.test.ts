import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
