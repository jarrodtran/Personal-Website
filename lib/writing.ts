import { readFileSync } from "node:fs";

export interface WritingPost {
  title: string;
  href: string;
  date: string;
  summary: string;
}

export interface SubstackConfig {
  name: string;
  url: string;
}

export const WRITING_POST_LIMIT = 5;
/** Rows the homepage shows before linking to the full /writing/ archive. */
export const HOME_ESSAY_LIMIT = 3;
/** The /writing/ archive groups entries by year once it holds more than this. */
export const ARCHIVE_GROUP_AFTER = 10;
export const WRITING_BLURB_MAX_CHARS = 220;
export const WRITING_FEED_TIMEOUT_MS = 10_000;
export const WRITING_DATE_TIME_ZONE = "America/Chicago";

export function writingPublicationUrl(
  config: Pick<SubstackConfig, "url">,
): string {
  return config.url.trim().replace(/\/+$/, "");
}

export function writingSubscribeUrl(
  config: Pick<SubstackConfig, "url">,
): string {
  const base = writingPublicationUrl(config);
  return base ? `${base}/subscribe` : "";
}

export function writingFeedUrl(config: Pick<SubstackConfig, "url">): string {
  const base = writingPublicationUrl(config);
  return base ? `${base}/feed` : "";
}

export function isSubstackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "substack.com" || host.endsWith(".substack.com");
  } catch {
    return false;
  }
}

export function isOwnWritingUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(writingPublicationUrl({ url: baseUrl }));
    return parsed.protocol === "https:" && parsed.hostname === base.hostname;
  } catch {
    return false;
  }
}

export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Calendar year of a post in the site's time zone, or "" when undated. */
export function postYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: WRITING_DATE_TIME_ZONE,
  }).format(date);
}

export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: WRITING_DATE_TIME_ZONE,
  }).format(date);
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (entity, key: string) => {
      if (!key.startsWith("#"))
        return Object.hasOwn(entities, key) ? entities[key] : entity;
      const hex = key[1]?.toLowerCase() === "x";
      const value = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (
        value === 0 ||
        value > 0x10ffff ||
        (value >= 0xd800 && value <= 0xdfff)
      ) {
        return "�";
      }
      return String.fromCodePoint(value);
    },
  );
}

function decode(text: string): string {
  const raw = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return oneLine(decodeEntities(raw).replace(/<\/?[a-z][^>]*>/gi, " "));
}

function capBlurb(text: string): string {
  const chars = Array.from(text);
  if (chars.length <= WRITING_BLURB_MAX_CHARS) return text;
  const limit = WRITING_BLURB_MAX_CHARS - 1;
  const prefix = chars.slice(0, limit).join("");
  const boundary = prefix.lastIndexOf(" ");
  const clipped =
    chars[limit] === " " || boundary < limit / 2
      ? prefix
      : prefix.slice(0, boundary);
  return `${clipped.trimEnd()}…`;
}

function tag(block: string, name: string): string {
  const match = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  return match ? decode(match[1]) : "";
}

function hrefOf(block: string): string {
  const rel = block.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  if (rel?.[1]) return decodeEntities(rel[1]);
  const any = block.match(/<link\b[^>]*href="([^"]+)"/i);
  if (any?.[1]) return decodeEntities(any[1]);
  return tag(block, "link") || tag(block, "guid");
}

function looksLikeFeed(xml: string): boolean {
  return /<(rss|feed|rdf:RDF)\b/i.test(xml);
}

function selectPosts(
  posts: WritingPost[],
  baseUrl: string,
  limit: number,
): WritingPost[] {
  return posts
    .filter((post) => isOwnWritingUrl(post.href, baseUrl))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export function parseFeed(xml: string, baseUrl: string): WritingPost[] {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(
    (match) => match[0],
  );
  const entries = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(
    (match) => match[0],
  );
  const blocks = items.length > 0 ? items : entries;

  return blocks.flatMap((block) => {
    const title = tag(block, "title");
    const href = hrefOf(block);
    if (!title || !href || !isOwnWritingUrl(href, baseUrl)) return [];
    const rawDate =
      tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const parsed = rawDate ? new Date(rawDate) : null;
    return [
      {
        title,
        href,
        date:
          parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
        summary: capBlurb(
          oneLine(tag(block, "description") || tag(block, "summary")),
        ),
      },
    ];
  });
}

export type WritingLoad =
  { ok: true; posts: WritingPost[] } | { ok: false; posts: []; reason: string };

function readFixturePosts(
  baseUrl: string,
  limit: number,
): WritingPost[] | null {
  const fixture = process.env.WRITING_FEED_PATH;
  if (!fixture) return null;
  return selectPosts(
    parseFeed(readFileSync(fixture, "utf8"), baseUrl),
    baseUrl,
    limit,
  );
}

/**
 * Reads the Substack feed at build time. The homepage keeps the default cap;
 * the /writing/ archive passes `Infinity` to list every post the feed holds.
 */
export async function loadWritingResult(
  config: SubstackConfig,
  { limit = WRITING_POST_LIMIT }: { limit?: number } = {},
): Promise<WritingLoad> {
  const fixture = readFixturePosts(config.url, limit);
  if (fixture) return { ok: true, posts: fixture };

  const feedUrl = writingFeedUrl(config);
  if (!feedUrl) return { ok: true, posts: [] };

  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(WRITING_FEED_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { ok: false, posts: [], reason: `HTTP ${response.status}` };
    }
    const xml = await response.text();
    if (!looksLikeFeed(xml)) {
      return { ok: false, posts: [], reason: "malformed feed XML" };
    }
    return {
      ok: true,
      posts: selectPosts(parseFeed(xml, config.url), config.url, limit),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "fetch failed";
    return { ok: false, posts: [], reason };
  }
}
