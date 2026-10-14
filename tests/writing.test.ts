import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSubstackPosts,
  formatPostDate,
  isSubstackUrl,
  loadWriting,
  parseFeed,
} from "@/lib/writing";

const rss = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title>Later essay</title>
  <link>https://example.substack.com/p/later</link>
  <pubDate>Tue, 02 Mar 2026 12:00:00 GMT</pubDate>
  <description>The newer note.</description>
</item>
<item>
  <title>Earlier essay</title>
  <link>https://example.substack.com/p/earlier</link>
  <pubDate>Sun, 01 Mar 2026 12:00:00 GMT</pubDate>
  <description>The older note.</description>
</item>
</channel></rss>`;

const atom = `<?xml version="1.0"?>
<feed>
  <entry>
    <title>Atom essay</title>
    <link href="https://example.substack.com/p/atom"/>
    <published>2026-03-03T12:00:00Z</published>
    <summary>From Atom.</summary>
  </entry>
</feed>`;

describe("isSubstackUrl", () => {
  it("accepts only Substack hosts", () => {
    expect(isSubstackUrl("https://jarrodtran.substack.com")).toBe(true);
    expect(isSubstackUrl("https://example.com")).toBe(false);
    expect(isSubstackUrl("not-a-url")).toBe(false);
  });
});

describe("parseFeed", () => {
  it("reads RSS items and Atom entries", () => {
    expect(parseFeed(rss)).toEqual([
      {
        title: "Later essay",
        href: "https://example.substack.com/p/later",
        date: "2026-03-02T12:00:00.000Z",
        summary: "The newer note.",
      },
      {
        title: "Earlier essay",
        href: "https://example.substack.com/p/earlier",
        date: "2026-03-01T12:00:00.000Z",
        summary: "The older note.",
      },
    ]);
    expect(parseFeed(atom)).toEqual([
      {
        title: "Atom essay",
        href: "https://example.substack.com/p/atom",
        date: "2026-03-03T12:00:00.000Z",
        summary: "From Atom.",
      },
    ]);
  });
});

describe("formatPostDate", () => {
  it("formats a real date in en-GB", () => {
    expect(formatPostDate("2026-03-01T12:00:00.000Z")).toBe("1 Mar 2026");
  });
});

describe("fetchSubstackPosts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns [] when the feed URL is empty, down, or throws", async () => {
    expect(
      await fetchSubstackPosts({ name: "", url: "", feedUrl: "" }),
    ).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => rss }),
    );
    expect(
      await fetchSubstackPosts({
        name: "",
        url: "",
        feedUrl: "https://example.substack.com/feed",
      }),
    ).toEqual([]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(
      await fetchSubstackPosts({
        name: "",
        url: "",
        feedUrl: "https://example.substack.com/feed",
      }),
    ).toEqual([]);
  });

  it("parses a live feed without inventing posts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => rss }),
    );
    const posts = await loadWriting({
      name: "",
      url: "https://example.substack.com",
      feedUrl: "https://example.substack.com/feed",
    });
    expect(posts.map((post) => post.title)).toEqual([
      "Later essay",
      "Earlier essay",
    ]);
  });
});
