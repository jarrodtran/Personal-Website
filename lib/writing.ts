export interface WritingPost {
  title: string;
  href: string;
  date: string;
  summary: string;
}

export interface SubstackConfig {
  name: string;
  url: string;
  feedUrl: string;
}

export function isSubstackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "substack.com" || host.endsWith(".substack.com");
  } catch {
    return false;
  }
}

export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function decode(text: string): string {
  return oneLine(
    text
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}

function tag(block: string, name: string): string {
  const match = block.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"),
  );
  return match ? decode(match[1]) : "";
}

function hrefOf(block: string): string {
  const rel = block.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  if (rel?.[1]) return rel[1];
  const any = block.match(/<link\b[^>]*href="([^"]+)"/i);
  if (any?.[1]) return any[1];
  return tag(block, "link") || tag(block, "guid");
}

export function parseFeed(xml: string): WritingPost[] {
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
    if (!title || !href) return [];
    const rawDate =
      tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const parsed = rawDate ? new Date(rawDate) : null;
    return [
      {
        title,
        href,
        date:
          parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
        summary: oneLine(
          tag(block, "description") ||
            tag(block, "summary") ||
            tag(block, "content"),
        ),
      },
    ];
  });
}

export async function fetchSubstackPosts(
  config: SubstackConfig,
): Promise<WritingPost[]> {
  const feedUrl = config.feedUrl.trim();
  if (!feedUrl) return [];
  try {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];
    return parseFeed(await response.text());
  } catch {
    return [];
  }
}

export async function loadWriting(
  config: SubstackConfig,
): Promise<WritingPost[]> {
  const posts = await fetchSubstackPosts(config);
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
