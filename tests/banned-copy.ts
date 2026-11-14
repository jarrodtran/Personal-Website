import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type CopyHit = {
  source: string;
  line: number;
  phrase: string;
  context: string;
};

const LIST_FILE = "content/banned-phrases.txt";
const CONTEXT_RADIUS = 40;
const DASH_PHRASES = ["\u2014", "\u2013"] as const;

export function parseBannedPhrases(fileText: string): string[] {
  const phrases: string[] = [];
  for (const rawLine of fileText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    phrases.push(line);
  }
  return phrases;
}

export function contextAt(text: string, index: number, length: number): string {
  const start = Math.max(0, index - CONTEXT_RADIUS);
  const end = Math.min(text.length, index + length + CONTEXT_RADIUS);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function uniquePhrases(phrases: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const phrase of [...phrases, ...DASH_PHRASES]) {
    if (phrase === "" || seen.has(phrase)) continue;
    seen.add(phrase);
    ordered.push(phrase);
  }
  return ordered;
}

function lineAt(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

export function findPhraseHits(
  text: string,
  phrases: string[],
): Array<{ phrase: string; index: number; line: number; context: string }> {
  const lower = text.toLowerCase();
  const hits: Array<{
    phrase: string;
    index: number;
    line: number;
    context: string;
  }> = [];

  for (const phrase of uniquePhrases(phrases)) {
    const needle = phrase.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const index = lower.indexOf(needle, from);
      if (index === -1) break;
      hits.push({
        phrase,
        index,
        line: lineAt(text, index),
        context: contextAt(text, index, phrase.length),
      });
      from = index + Math.max(phrase.length, 1);
    }
  }

  return hits.sort(
    (a, b) => a.index - b.index || a.phrase.localeCompare(b.phrase),
  );
}

function decodeEntities(value: string): string {
  return value
    .replace(/&mdash;/gi, "\u2014")
    .replace(/&ndash;/gi, "\u2013")
    .replace(/&#x2014;/gi, "\u2014")
    .replace(/&#x2013;/gi, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, digits: string) =>
      String.fromCodePoint(Number(digits)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    );
}

function attributeValues(html: string, name: string): string[] {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "gi",
  );
  return [...html.matchAll(pattern)].map((match) =>
    decodeEntities(match[1] ?? match[2] ?? ""),
  );
}

function metaDescriptions(html: string): string[] {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.flatMap((tag) => {
    if (!/\bname\s*=\s*(?:"description"|'description')/i.test(tag)) {
      return [];
    }
    return attributeValues(tag, "content");
  });
}

export function extractHtmlCopy(html: string): string {
  const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map(
    (match) => decodeEntities(match[1] ?? ""),
  );
  const descriptions = metaDescriptions(html);
  const alts = attributeValues(html, "alt");
  const visible = decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
      .replace(/<title\b[\s\S]*?<\/title>/gi, " ")
      .replace(/<meta\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );

  return [...titles, ...descriptions, ...alts, visible].join("\n");
}

export function loadBannedPhrases(root: string): string[] {
  return parseBannedPhrases(readFileSync(path.join(root, LIST_FILE), "utf8"));
}

function toHits(source: string, text: string, phrases: string[]): CopyHit[] {
  return findPhraseHits(text, phrases).map((hit) => ({
    source,
    line: hit.line,
    phrase: hit.phrase,
    context: hit.context,
  }));
}

export function scanCopySources(root: string, phrases: string[]): CopyHit[] {
  const contentDir = path.join(root, "content");
  const hits: CopyHit[] = [];
  for (const relative of readdirSync(contentDir, {
    recursive: true,
    encoding: "utf8",
  })) {
    const base = path.basename(relative);
    if (base === path.basename(LIST_FILE)) continue;
    if (!relative.endsWith(".ts")) continue;
    const source = path.posix.join(
      "content",
      relative.split(path.sep).join("/"),
    );
    const text = readFileSync(path.join(contentDir, relative), "utf8");
    hits.push(...toHits(source, text, phrases));
  }
  return hits;
}

export function htmlPagePath(relativeHtmlPath: string): string {
  const normalized = relativeHtmlPath.replace(/\\/g, "/");
  const withoutOut = normalized.replace(/^out\//, "");
  if (withoutOut === "404.html") return "/404";
  if (withoutOut.endsWith("/index.html")) {
    const page = `/${withoutOut.slice(0, -"index.html".length)}`;
    return page === "/" ? "/" : page;
  }
  if (withoutOut === "index.html") return "/";
  if (withoutOut.endsWith(".html")) {
    return `/${withoutOut.slice(0, -".html".length)}`;
  }
  return `/${withoutOut}`;
}

const SKIP_PAYLOAD_NAMES = new Set(["robots.txt"]);

/**
 * Essay pages under /writing/<slug>/ carry Jarrod's own essays from the
 * Substack feed. His prose is his to write, so the house copy rules (banned
 * phrases, dashes) skip those pages. Everything else is still scanned.
 */
export function isFeedEssayFile(file: string): boolean {
  return /^out\/writing\/[a-z0-9][a-z0-9-]*\//.test(file.replace(/\\/g, "/"));
}

export function requireBuiltHtml(root: string): string {
  const outDir = path.join(root, "out");
  if (!existsSync(path.join(outDir, "index.html"))) {
    throw new Error("banned-copy test needs a production build in out/");
  }
  return outDir;
}

export function listBuiltFiles(root: string, extension: string): string[] {
  const outDir = requireBuiltHtml(root);
  const files: string[] = [];
  for (const relative of readdirSync(outDir, {
    recursive: true,
    encoding: "utf8",
  })) {
    if (!relative.endsWith(extension)) continue;
    if (SKIP_PAYLOAD_NAMES.has(path.basename(relative))) continue;
    files.push(`out/${relative.split(path.sep).join("/")}`);
  }
  return files.sort();
}

function rawLineForPhrase(
  html: string,
  phrase: string,
  occurrence: number,
): number | undefined {
  const lower = html.toLowerCase();
  const needle = phrase.toLowerCase();
  let from = 0;
  let seen = 0;
  while (from < lower.length) {
    const index = lower.indexOf(needle, from);
    if (index === -1) return undefined;
    if (seen === occurrence) return lineAt(html, index);
    seen += 1;
    from = index + Math.max(phrase.length, 1);
  }
  return undefined;
}

function hitsForFile(
  source: string,
  text: string,
  phrases: string[],
  rawForLine = text,
): CopyHit[] {
  const seen = new Map<string, number>();
  return findPhraseHits(text, phrases).map((hit) => {
    const occurrence = seen.get(hit.phrase) ?? 0;
    seen.set(hit.phrase, occurrence + 1);
    return {
      source,
      line: rawLineForPhrase(rawForLine, hit.phrase, occurrence) ?? hit.line,
      phrase: hit.phrase,
      context: hit.context,
    };
  });
}

export function scanBuiltHtml(root: string, phrases: string[]): CopyHit[] {
  const hits: CopyHit[] = [];
  for (const file of listBuiltFiles(root, ".html")) {
    if (isFeedEssayFile(file)) continue;
    const source = `${file} (${htmlPagePath(file)})`;
    const html = readFileSync(path.join(root, file), "utf8");
    const wording = phrases.filter(
      (phrase) => phrase !== "\u2013" && phrase !== "\u2014",
    );
    // Visible copy plus title, meta description, and alt. Dashes are
    // counted on the raw file so inlined RSC payloads are not missed.
    hits.push(
      ...hitsForFile(source, extractHtmlCopy(html), wording, html).filter(
        (hit) => hit.phrase !== "\u2013" && hit.phrase !== "\u2014",
      ),
    );
    hits.push(...hitsForFile(`${source} [raw]`, html, [...DASH_PHRASES]));
  }
  return hits;
}

export function scanBuiltPayloads(root: string, phrases: string[]): CopyHit[] {
  const hits: CopyHit[] = [];
  for (const file of listBuiltFiles(root, ".txt")) {
    if (isFeedEssayFile(file)) continue;
    const text = readFileSync(path.join(root, file), "utf8");
    hits.push(...hitsForFile(`${file} (rsc)`, text, phrases));
  }
  return hits;
}

export function formatHits(hits: CopyHit[]): string {
  if (hits.length === 0) return "no banned-copy hits";
  return hits
    .map(
      (hit) =>
        `${hit.source}:${hit.line}  ${JSON.stringify(hit.phrase)}  ... ${hit.context} ...`,
    )
    .join("\n");
}
