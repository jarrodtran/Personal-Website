import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { selectedWorkSlugs, site } from "@/content/site";
import {
  extractHtmlCopy,
  findPhraseHits,
  formatHits,
  htmlPagePath,
  isFeedEssayFile,
  listBuiltFiles,
  loadBannedPhrases,
  parseBannedPhrases,
  requireBuiltHtml,
  scanBuiltHtml,
  scanBuiltPayloads,
  scanCopySources,
} from "./banned-copy";

const root = path.resolve(__dirname, "..");
const fixtures = path.join(__dirname, "fixtures/banned-copy");

function fixture(name: "clean.txt" | "dirty.txt"): string {
  return readFileSync(path.join(fixtures, name), "utf8");
}

// rule:banned-copy
describe("banned phrase list", () => {
  const listed = parseBannedPhrases(
    readFileSync(path.join(root, "content/banned-phrases.txt"), "utf8"),
  );

  it("loads Copy's list: comments and blanks dropped, substring phrases kept", () => {
    expect(listed).toContain("Manager, AI");
    expect(listed).toContain("Manager, AI & Factory Strategy");
    expect(listed).toContain("Mag7");
    expect(listed).toContain("Mag 7");
    expect(listed).toContain("Open to Work");
    expect(listed).toContain("NYC");
    expect(listed).toContain("New York City");
    expect(listed).toContain("San Francisco");
    expect(listed).toContain("relocat");
    expect(listed).toContain("\u2014");
    expect(listed).toContain("\u2013");
    expect(listed).toContain("delve");
    expect(listed).toContain("passionate about");
    expect(listed).toContain("in today's fast-paced");
    expect(listed).toContain("corporate operator");
    expect(listed).not.toContain("#OpenToWork");
    expect(listed).not.toContain("OpenToWork");
    expect(listed).not.toContain("SF");
    expect(listed.some((phrase) => phrase.startsWith("#"))).toBe(false);
    expect(listed.some((phrase) => phrase.trim() === "")).toBe(false);
  });

  it("does not add bare SF beyond what Copy listed", () => {
    expect(loadBannedPhrases(root).includes("SF")).toBe(false);
  });
});

describe("planted fixtures", () => {
  const phrases = loadBannedPhrases(root);

  it("passes on a planted clean case", () => {
    expect(findPhraseHits(fixture("clean.txt"), phrases)).toEqual([]);
  });

  it("fails on a planted dirty case, naming the phrase and surrounding text", () => {
    const text = fixture("dirty.txt");
    const hits = findPhraseHits(text, phrases);
    const phrasesFound = hits.map((hit) => hit.phrase);
    expect(phrasesFound).toEqual(expect.arrayContaining(["delve", "\u2014"]));

    const delve = hits.find((hit) => hit.phrase === "delve");
    expect(delve?.context).toMatch(/delve/i);
    expect(delve?.context.toLowerCase()).toContain(
      "please delve into the brief",
    );

    const dash = hits.find((hit) => hit.phrase === "\u2014");
    expect(dash?.context).toContain("\u2014");
    expect(dash?.context).toMatch(/brief/);
  });
});

describe("html copy extraction", () => {
  it("reads visible text, title, meta description, and alt, and skips script bodies", () => {
    const html = `
      <html>
        <head>
          <title>Tab title</title>
          <meta name="description" content="Meta delve line" />
          <script>delve in script</script>
        </head>
        <body>
          <p>Visible text with a dash \u2014 here</p>
          <img alt="robust photo" />
        </body>
      </html>
    `;
    const extracted = extractHtmlCopy(html);
    expect(extracted).toContain("Tab title");
    expect(extracted).toContain("Meta delve line");
    expect(extracted).toContain("Visible text with a dash");
    expect(extracted).toContain("robust photo");
    expect(extracted).not.toContain("delve in script");
  });

  it("maps built html files to page paths", () => {
    expect(htmlPagePath("out/index.html")).toBe("/");
    expect(htmlPagePath("out/404.html")).toBe("/404");
    expect(htmlPagePath("out/work/apple-iphone-india/index.html")).toBe(
      "/work/apple-iphone-india/",
    );
  });
});

describe("repo scan", () => {
  const phrases = loadBannedPhrases(root);

  it("skips content/banned-phrases.txt so Copy can list dashes and the old title", () => {
    const hits = scanCopySources(root, phrases);
    expect(
      hits.filter((hit) => hit.source.endsWith("banned-phrases.txt")),
    ).toEqual([]);
  });

  it("skips only essay pages from the feed, never the archive or other pages", () => {
    expect(isFeedEssayFile("out/writing/some-essay/index.html")).toBe(true);
    expect(isFeedEssayFile("out/writing/some-essay/index.txt")).toBe(true);
    expect(isFeedEssayFile("out/writing/index.html")).toBe(false);
    expect(isFeedEssayFile("out/writing/__next._full.txt")).toBe(false);
    expect(isFeedEssayFile("out/index.html")).toBe(false);
    expect(isFeedEssayFile("out/work/apple-iphone-india/index.html")).toBe(
      false,
    );
  });

  it("allows the official title string", () => {
    expect(findPhraseHits(site.positioning.currentRole, phrases)).toEqual([]);
  });

  it("walks every exported html route, including case studies", () => {
    requireBuiltHtml(root);
    const files = listBuiltFiles(root, ".html");
    const required = [
      "out/index.html",
      "out/404.html",
      "out/_not-found/index.html",
      "out/writing/index.html",
      "out/work/index.html",
      ...selectedWorkSlugs().map((slug) => `out/work/${slug}/index.html`),
    ];
    expect(files).toEqual(expect.arrayContaining(required));
    expect(listBuiltFiles(root, ".txt")).toEqual(
      expect.arrayContaining([
        "out/index.txt",
        ...selectedWorkSlugs().map((slug) => `out/work/${slug}/index.txt`),
      ]),
    );
    expect(listBuiltFiles(root, ".txt")).not.toContain("out/robots.txt");
  });

  it("has no banned phrase, em-dash, or en-dash in copy sources or built HTML", () => {
    requireBuiltHtml(root);
    const hits = [
      ...scanCopySources(root, phrases),
      ...scanBuiltHtml(root, phrases),
      ...scanBuiltPayloads(root, phrases),
    ];
    expect(hits, formatHits(hits)).toEqual([]);
  });
});
