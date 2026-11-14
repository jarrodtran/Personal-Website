import { readFileSync } from "node:fs";

export interface WritingPost {
  title: string;
  href: string;
  date: string;
  summary: string;
  /** On-site essay page, set only when the feed carries the full body. */
  path?: string;
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

/** Substack's own signup form, meant to sit in an iframe. */
export function writingEmbedUrl(config: Pick<SubstackConfig, "url">): string {
  const base = writingPublicationUrl(config);
  return base ? `${base}/embed` : "";
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

function rawTag(block: string, name: string): string {
  const match = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  if (!match) return "";
  const inner = match[1];
  const cdata = inner.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return (cdata ? cdata[1] : decodeEntities(inner)).trim();
}

/** The post body as HTML: RSS content:encoded, or Atom content. */
export function essayBodyOf(block: string): string {
  return rawTag(block, "content:encoded") || rawTag(block, "content");
}

/** The Substack post slug from /p/<slug>, or "" when the URL has none. */
export function essaySlug(href: string): string {
  try {
    const match = new URL(href).pathname.match(
      /^\/p\/([a-z0-9][a-z0-9-]{0,199})\/?$/,
    );
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

function looksLikeFeed(xml: string): boolean {
  return /<(rss|feed|rdf:RDF)\b/i.test(xml);
}

export function selectPosts(
  posts: WritingPost[],
  baseUrl: string,
  limit: number,
): WritingPost[] {
  return posts
    .filter((post) => isOwnWritingUrl(post.href, baseUrl))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

function feedBlocks(xml: string): string[] {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(
    (match) => match[0],
  );
  const entries = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(
    (match) => match[0],
  );
  return items.length > 0 ? items : entries;
}

export function parseFeed(xml: string, baseUrl: string): WritingPost[] {
  return feedBlocks(xml).flatMap((block) => {
    const title = tag(block, "title");
    const href = hrefOf(block);
    if (!title || !href || !isOwnWritingUrl(href, baseUrl)) return [];
    const rawDate =
      tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const parsed = rawDate ? new Date(rawDate) : null;
    const slug = essaySlug(href);
    const path = slug && essayBodyOf(block) ? `/writing/${slug}/` : "";
    return [
      {
        title,
        href,
        date:
          parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
        summary: capBlurb(
          oneLine(tag(block, "description") || tag(block, "summary")),
        ),
        ...(path ? { path } : {}),
      },
    ];
  });
}

/** Raw body HTML for every own post that has one, keyed by slug. */
export function parseEssayBodies(
  xml: string,
  baseUrl: string,
): Map<string, string> {
  const bodies = new Map<string, string>();
  for (const block of feedBlocks(xml)) {
    const href = hrefOf(block);
    const slug = essaySlug(href);
    const body = essayBodyOf(block);
    if (slug && body && isOwnWritingUrl(href, baseUrl) && !bodies.has(slug)) {
      bodies.set(slug, body);
    }
  }
  return bodies;
}

export type WritingLoad =
  { ok: true; posts: WritingPost[] } | { ok: false; posts: []; reason: string };

type FeedXml = { ok: true; xml: string } | { ok: false; reason: string };

async function fetchFeedXml(feedUrl: string): Promise<FeedXml> {
  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(WRITING_FEED_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
    const xml = await response.text();
    if (!looksLikeFeed(xml)) return { ok: false, reason: "malformed feed XML" };
    return { ok: true, xml };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "fetch failed";
    return { ok: false, reason };
  }
}

const buildFeeds = new Map<string, Promise<FeedXml>>();

/**
 * One fetch per feed per build worker, so the home page, the archive, and
 * every essay page agree on the same feed. Outside a build (tests) every call
 * fetches afresh.
 */
function loadFeedXml(feedUrl: string): Promise<FeedXml> {
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    return fetchFeedXml(feedUrl);
  }
  let pending = buildFeeds.get(feedUrl);
  if (!pending) {
    pending = fetchFeedXml(feedUrl);
    buildFeeds.set(feedUrl, pending);
  }
  return pending;
}

/** The feed XML from the fixture file or the network, or null when unset. */
async function feedSource(config: SubstackConfig): Promise<FeedXml | null> {
  const fixture = process.env.WRITING_FEED_PATH;
  if (fixture) return { ok: true, xml: readFileSync(fixture, "utf8") };
  const feedUrl = writingFeedUrl(config);
  if (!feedUrl) return null;
  return loadFeedXml(feedUrl);
}

/**
 * Reads the Substack feed at build time. The homepage keeps the default cap;
 * the /writing/ archive passes `Infinity` to list every post the feed holds.
 */
export async function loadWritingResult(
  config: SubstackConfig,
  { limit = WRITING_POST_LIMIT }: { limit?: number } = {},
): Promise<WritingLoad> {
  const source = await feedSource(config);
  if (!source) return { ok: true, posts: [] };
  if (!source.ok) return { ok: false, posts: [], reason: source.reason };
  return {
    ok: true,
    posts: selectPosts(parseFeed(source.xml, config.url), config.url, limit),
  };
}

/**
 * Static export refuses a dynamic route with no pages, so before the first
 * essay /writing/[slug] builds this one stand-in, and postbuild deletes it.
 * It can never clash with a real slug, which must start with [a-z0-9].
 */
export const ESSAY_PLACEHOLDER_SLUG = "_none";

export interface WritingEssay {
  post: WritingPost & { path: string };
  slug: string;
  /** Raw feed HTML. Sanitize before rendering. */
  body: string;
}

/** Every own post whose full body is in the feed, newest first. */
export async function loadEssays(
  config: SubstackConfig,
): Promise<WritingEssay[]> {
  const source = await feedSource(config);
  if (!source?.ok) return [];
  const bodies = parseEssayBodies(source.xml, config.url);
  return selectPosts(
    parseFeed(source.xml, config.url),
    config.url,
    Infinity,
  ).flatMap((post) => {
    const slug = essaySlug(post.href);
    const body = bodies.get(slug);
    return post.path && body
      ? [{ post: { ...post, path: post.path }, slug, body }]
      : [];
  });
}
