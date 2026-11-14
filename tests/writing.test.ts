import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";
import {
  formatPostDate,
  isOwnWritingUrl,
  isSubstackUrl,
  ESSAY_PLACEHOLDER_SLUG,
  essaySlug,
  loadEssays,
  loadWritingResult,
  parseEssayBodies,
  parseFeed,
  writingFeedUrl,
  WRITING_BLURB_MAX_CHARS,
  WRITING_FEED_TIMEOUT_MS,
  WRITING_POST_LIMIT,
  type SubstackConfig,
} from "@/lib/writing";
import {
  WRITING_FIXTURE_BASE,
  WRITING_FIXTURE_SECRET_BODY,
  WRITING_FIXTURE_TITLES,
} from "./fixtures/writing/titles";
import { essayWordCount, sanitizeEssayHtml } from "@/lib/essay-html";

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
      `ZXQ aurora blurb start.${" Alpha word.".repeat(16)}…`,
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

  it("reads Atom entries on the own host and keeps bodies out of the summary", () => {
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
        path: "/writing/atom/",
      },
    ]);
    expect(parseEssayBodies(atom, WRITING_FIXTURE_BASE).get("atom")).toBe(
      WRITING_FIXTURE_SECRET_BODY,
    );
  });

  it("only gives an on-site path to own posts with a body and a clean slug", () => {
    const posts = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    const paths = Object.fromEntries(
      posts.map((post) => [essaySlug(post.href), post.path ?? ""]),
    );
    expect(paths["zxq-aurora"]).toBe("/writing/zxq-aurora/");
    expect(paths["zxq-beacon"]).toBe("");
    expect(essaySlug(`${WRITING_FIXTURE_BASE}/p/../etc`)).toBe("");
    expect(essaySlug(`${WRITING_FIXTURE_BASE}/p/Up-Case`)).toBe("");
    expect(essaySlug(`${WRITING_FIXTURE_BASE}/about`)).toBe("");
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

describe("loadWritingResult", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns ok with [] when the feed URL is empty", async () => {
    expect(await loadWritingResult({ name: "", url: "" })).toEqual({
      ok: true,
      posts: [],
    });
  });

  it("returns ok: false quietly on non-200, throw, timeout, or malformed XML", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const timeout = vi.spyOn(AbortSignal, "timeout");

    stubFeed(threeXml, false);
    const non200 = await loadWritingResult(ownFeed);
    expect(non200.ok).toBe(false);
    expect(non200.posts).toEqual([]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const offline = await loadWritingResult(ownFeed);
    expect(offline.ok).toBe(false);
    expect(offline.posts).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("aborted"), { name: "TimeoutError" }),
        ),
    );
    const timedOut = await loadWritingResult(ownFeed);
    expect(timedOut.ok).toBe(false);
    expect(timedOut.posts).toEqual([]);

    stubFeed("<html>not a feed</html>");
    const malformed = await loadWritingResult(ownFeed);
    expect(malformed.ok).toBe(false);
    expect(malformed.posts).toEqual([]);

    expect(timeout).toHaveBeenCalledWith(WRITING_FEED_TIMEOUT_MS);
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("::warning::")),
    ).toBe(false);
  });

  it("loads a live fixture newest first without inventing posts", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFeed(threeXml);
    const { posts } = await loadWritingResult(ownFeed);
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
    const { posts } = await loadWritingResult(ownFeed);
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
    expect(await loadWritingResult(ownFeed)).toEqual({ ok: true, posts: [] });
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
    await loadWritingResult(alt);
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
      path.resolve(__dirname, "../components/essay-list.tsx"),
      "utf8",
    );
    expect(css).toMatch(/main li a/);
    expect(css).toMatch(
      /#essays\s+li\s+a:not\(:hover\)\s*\{[^}]*text-decoration:\s*none/,
    );
    expect(css).toMatch(
      /#writing\s+li\s+a:not\(:hover\)\s*\{[^}]*text-decoration:\s*none/,
    );
    expect(source).toMatch(/no-underline/);
    expect(source).toMatch(/hover:underline/);
  });
});

describe("essay bodies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads only own posts that carry a body, newest first", async () => {
    vi.stubEnv("WRITING_FEED_PATH", path.join(fixtures, "three-posts.xml"));
    const essays = await loadEssays(ownFeed);
    expect(essays.map((essay) => essay.slug)).toEqual([
      "zxq-aurora",
      "zxq-cedar",
    ]);
    expect(essays[0]?.post.path).toBe("/writing/zxq-aurora/");
  });

  it("keeps prose and footnotes and drops scripts, embeds, and Substack widgets", () => {
    const clean = sanitizeEssayHtml(`
      <h1>Top</h1>
      <p onclick="x()">Hi <a href="https://example.com" class="x" id="top">link</a><a class="footnote-anchor" href="#footnote-1" id="footnote-anchor-1">1</a></p>
      <script>alert(1)</script><style>p{}</style><iframe src="https://example.com"></iframe>
      <div class="subscription-widget-wrap"><p>Subscribe now</p><form><input></form></div>
      <p class="button-wrapper"><a class="button" href="https://example.substack.com/subscribe">Subscribe</a></p>
      <img src="https://substackcdn.com/a.png" alt="A chart" width="600" height="400" onerror="x()">
      <img src="http://insecure.example/a.png" alt="no">
      <p><a href="javascript:alert(1)">bad</a></p>
      <div class="footnote"><a href="#footnote-anchor-1" id="footnote-1">1</a><div><p>Note.</p></div></div>
    `);
    expect(clean).toContain("<h2>Top</h2>");
    expect(clean).toContain('<a href="https://example.com">link</a>');
    expect(clean).toContain('id="footnote-anchor-1"');
    expect(clean).toContain('id="footnote-1"');
    expect(clean).toContain('alt="A chart"');
    expect(clean).toContain('loading="lazy"');
    expect(clean).toContain("Note.");
    for (const banned of [
      "<script",
      "<style",
      "<iframe",
      "<form",
      "<input",
      "onclick",
      "onerror",
      "javascript:",
      "Subscribe",
      "class=",
      'id="top"',
      "http://insecure",
    ]) {
      expect(clean, banned).not.toContain(banned);
    }
    expect(essayWordCount("<p>One two <em>three</em></p>")).toBe(3);
  });
});

describe("essay route placeholder", () => {
  // tests/writing-output.test.ts checks that postbuild removes it from out/.
  it("cannot clash with a real slug", () => {
    expect(
      essaySlug(`${WRITING_FIXTURE_BASE}/p/${ESSAY_PLACEHOLDER_SLUG}`),
    ).toBe("");
  });
});
