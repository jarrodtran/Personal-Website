import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");

if (!existsSync(path.join(outDir, "index.html"))) {
  throw new Error("no-photo test needs a production build in out/");
}

const PHOTO_TOKENS = ["avatar.webp", "avatar-og.png"] as const;

function listedFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" });
}

function htmlFiles(dir: string): string[] {
  return listedFiles(dir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(dir, file));
}

// rule:no-photo
describe("built HTML does not ship a photo of Jarrod", () => {
  const pages = htmlFiles(outDir).map((file) => ({
    file: path.relative(root, file),
    html: readFileSync(file, "utf8"),
  }));

  it("does not export avatar.webp or avatar-og.png", () => {
    const hits = listedFiles(outDir).filter((file) =>
      PHOTO_TOKENS.some((token) => path.basename(file) === token),
    );
    expect(hits).toEqual([]);
  });

  it("does not reference avatar.webp or avatar-og.png", () => {
    const hits = pages
      .filter((page) => PHOTO_TOKENS.some((token) => page.html.includes(token)))
      .map((page) => page.file);
    expect(hits).toEqual([]);
  });

  // Book covers in the Library teaser are the only images allowed on home.
  it("renders the home page with no img outside the library covers", () => {
    const home = readFileSync(path.join(outDir, "index.html"), "utf8");
    const sources = [...home.matchAll(/<img\b[^>]*>/gi)].map(
      ([tag]) => tag.match(/\bsrc="([^"]*)"/)?.[1] ?? "",
    );
    expect(sources.length).toBeGreaterThan(0);
    expect(
      sources.filter(
        (src) => !/^(?:\/[\w-]+)?\/library\/covers\/[\w-]+\.jpg$/.test(src),
      ),
    ).toEqual([]);
  });
});
