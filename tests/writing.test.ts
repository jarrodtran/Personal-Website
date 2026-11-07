import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";
import {
  fetchSubstackPosts,
  formatPostDate,
  isOwnWritingUrl,
  isSubstackUrl,
  loadWriting,
  parseFeed,
  writingFeedUrl,
  WRITING_BLURB_MAX_CHARS,
  WRITING_FEED_TIMEOUT_MS,
  WRITING_POST_LIMIT,
  type SubstackConfig,
} from "@/lib/writing";
import {
  WRITING_FIXTURE_BASE,
  WRITING_FIXTURE_LONG_BLURB,
  WRITING_FIXTURE_SECRET_BODY,
  WRITING_FIXTURE_TITLES,
} from "./fixtures/writing/titles";

const fixtures = path.join(__dirname, "fixtures/writing");
const threeXml = readFileSync(path.join(fixtures, "three-posts.xml"), "utf8");
const sixXml = readFileSync(path.join(fixtures, "six-posts.xml"), "utf8");
const emptyXml = readFileSync(path.join(fixtures, "empty.xml"), "utf8");

const ownFeed: SubstackConfig = {
  name: "",
  url: WRITING_FIXTURE_BASE,
};

function stubFeed(body: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 503,
      text: async () => body,
    }),
  );
}

describe("isSubstackUrl", () => {
  it("accepts only Substack hosts", () => {
    expect(isSubstackUrl("https://example.substack.com")).toBe(true);
    expect(isSubstackUrl("https://example.com")).toBe(false);
    expect(isSubstackUrl("not-a-url")).toBe(false);
  });
});

describe("isOwnWritingUrl", () => {
  it("keeps only https links on the configured base host", () => {
    expect(
      isOwnWritingUrl(`${WRITING_FIXTURE_BASE}/p/aurora`, WRITING_FIXTURE_BASE),
    ).toBe(true);
    expect(
      isOwnWritingUrl(
        `${WRITING_FIXTURE_BASE.replace("https://", "http://")}/p/aurora`,
        WRITING_FIXTURE_BASE,
      ),
    ).toBe(false);
    expect(
      isOwnWritingUrl(
        "https://other.substack.com/p/aurora",
        WRITING_FIXTURE_BASE,
      ),
    ).toBe(false);
    expect(
      isOwnWritingUrl("https://substack.com/p/aurora", WRITING_FIXTURE_BASE),
    ).toBe(false);
  });
});

describe("parseFeed", () => {
  it("reads a 3-post fixture newest-capable, strips HTML, caps blurbs, and drops foreign or http links", () => {
    const posts = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    expect(posts.map((post) => post.title)).toEqual([
      ...WRITING_FIXTURE_TITLES,
    ]);
    expect(posts).toHaveLength(3);
    expect(posts[0]?.href).toBe(`${WRITING_FIXTURE_BASE}/p/zxq-aurora`);
    expect(posts[0]?.summary).toBe(
      WRITING_FIXTURE_LONG_BLURB.slice(0, WRITING_BLURB_MAX_CHARS).trimEnd(),
    );
    expect(posts[0]?.summary.length).toBeLessThanOrEqual(
      WRITING_BLURB_MAX_CHARS,
    );
    expect(posts[0]?.summary).not.toContain("<");
    expect(posts[1]?.summary).toBe("Beacon note after HTML is gone.");
    expect(posts[2]?.summary).toBe("");
    expect(
      posts.some((post) => post.summary.includes(WRITING_FIXTURE_SECRET_BODY)),
    ).toBe(false);
    expect(posts.some((post) => post.href.includes("other.substack.com"))).toBe(
      false,
    );
    expect(posts.some((post) => post.href.startsWith("http://"))).toBe(false);
  });

  it("reads Atom entries on the own host and ignores entry bodies", () => {
    const atom = `<?xml version="1.0"?>
<feed>
  <entry>
    <title>Atom essay</title>
    <link href="${WRITING_FIXTURE_BASE}/p/atom"/>
    <published>2026-03-03T12:00:00Z</published>
    <summary>From Atom.</summary>
    <content>ZXQ_WRITING_FIXTURE_SECRET_BODY</content>
  </entry>
</feed>`;
    expect(parseFeed(atom, WRITING_FIXTURE_BASE)).toEqual([
      {
        title: "Atom essay",
        href: `${WRITING_FIXTURE_BASE}/p/atom`,
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

  it("uses America/Chicago so a UTC morning does not keep the UTC calendar day", () => {
    expect(formatPostDate("2026-11-02T05:00:00.000Z")).toBe("1 Nov 2026");
    expect(formatPostDate("2026-11-02T18:00:00.000Z")).toBe("2 Nov 2026");
  });

  it("returns an empty string when the date is unparseable", () => {
    expect(formatPostDate("not-a-date")).toBe("");
  });
});

describe("fetchSubstackPosts and loadWriting", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns [] when the feed URL is empty", async () => {
    expect(await fetchSubstackPosts({ name: "", url: "" })).toEqual([]);
  });

  it("returns [] quietly on non-200, throw, timeout, or malformed XML", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const timeout = vi.spyOn(AbortSignal, "timeout");

    stubFeed(threeXml, false);
    expect(await fetchSubstackPosts(ownFeed)).toEqual([]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchSubstackPosts(ownFeed)).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("aborted"), { name: "TimeoutError" }),
        ),
    );
    expect(await fetchSubstackPosts(ownFeed)).toEqual([]);

    stubFeed("<html>not a feed</html>");
    expect(await fetchSubstackPosts(ownFeed)).toEqual([]);

    expect(timeout).toHaveBeenCalledWith(WRITING_FEED_TIMEOUT_MS);
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("::warning::")),
    ).toBe(false);
  });

  it("loads a live fixture newest first without inventing posts", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFeed(threeXml);
    const posts = await loadWriting(ownFeed);
    expect(posts.map((post) => post.title)).toEqual([
      ...WRITING_FIXTURE_TITLES,
    ]);
    expect(posts[0]?.date).toBe("2026-11-02T18:00:00.000Z");
    expect(posts[1]?.date).toBe("2026-11-02T05:00:00.000Z");
    expect(formatPostDate(posts[1]?.date ?? "")).toBe("1 Nov 2026");
    expect(warn).not.toHaveBeenCalled();
  });

  it("caps shown posts at 5 from a larger fixture", async () => {
    stubFeed(sixXml);
    const posts = await loadWriting(ownFeed);
    expect(WRITING_POST_LIMIT).toBe(5);
    expect(posts).toHaveLength(5);
    expect(posts.map((post) => post.title)).toEqual([
      "ZXQ Writing Fixture Aurora",
      "ZXQ Writing Fixture Beacon",
      "ZXQ Writing Fixture Cedar",
      "ZXQ Writing Fixture Drift",
      "ZXQ Writing Fixture Ember",
    ]);
  });

  it("treats a valid empty feed as zero posts and does not warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFeed(emptyXml);
    expect(await loadWriting(ownFeed)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("fetches the feed URL derived from the configured base", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => emptyXml,
    });
    vi.stubGlobal("fetch", fetchMock);
    const alt = { name: "", url: "https://altname.substack.com" };
    expect(writingFeedUrl(alt)).toBe("https://altname.substack.com/feed");
    await loadWriting(alt);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://altname.substack.com/feed",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });
});

describe("substack base config", () => {
  it("hardcodes the publication URL only on site.substack.url", () => {
    const token = "jarrodtran.substack.com";
    const root = path.resolve(__dirname, "..");
    const hits: string[] = [];
    const skip = new Set(["node_modules", "out", ".git", ".next", "tests"]);

    function walk(dir: string) {
      for (const name of readdirSync(dir, { encoding: "utf8" })) {
        if (skip.has(name)) continue;
        const full = path.join(dir, name);
        const rel = path.relative(root, full);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx|mjs|js|yml|yaml|md|json)$/.test(name)) continue;
        const source = readFileSync(full, "utf8");
        if (!source.includes(token)) continue;
        if (rel === "content/site.ts") {
          source.split("\n").forEach((line, index) => {
            if (
              line.includes(token) &&
              !/url:\s*"https:\/\/jarrodtran\.substack\.com"/.test(line)
            ) {
              hits.push(`${rel}:${index + 1}`);
            }
          });
          continue;
        }
        hits.push(rel);
      }
    }

    walk(root);
    expect(hits).toEqual([]);
    expect(site.substack.url).toContain(token);
    expect(site.substack).not.toHaveProperty("feedUrl");
  });
});

describe("writing title underline", () => {
  it("overrides main li a so titles have no underline at rest", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../app/globals.css"),
      "utf8",
    );
    const source = readFileSync(
      path.resolve(__dirname, "../components/sections/writing.tsx"),
      "utf8",
    );
    expect(css).toMatch(/main li a/);
    expect(css).toMatch(
      /#writing\s+li\s+a:not\(:hover\)\s*\{[^}]*text-decoration:\s*none/,
    );
    expect(source).toMatch(/no-underline/);
    expect(source).toMatch(/hover:underline/);
  });
});
