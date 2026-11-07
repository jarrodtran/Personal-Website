import { describe, expect, it } from "vitest";
import { parseFeed } from "@/lib/writing";
import { WRITING_FIXTURE_BASE } from "./fixtures/writing/titles";

describe("Substack feed entity and escaped-HTML decoding", () => {
  it("decodes numeric, hex, and named entities and strips entity-escaped HTML tags from summaries", () => {
    const xml = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>What&#x27;s working &amp; what&#8217;s next</title>
    <link>${WRITING_FIXTURE_BASE}/p/entities</link>
    <pubDate>Mon, 02 Nov 2026 18:00:00 GMT</pubDate>
    <description>&lt;p&gt;First&amp;nbsp;sentence&amp;apos;s point.&lt;/p&gt;&lt;p&gt;Second sentence.&lt;/p&gt;</description>
  </item>
</channel></rss>`;

    const posts = parseFeed(xml, WRITING_FIXTURE_BASE);
    expect(posts).toHaveLength(1);
    expect(posts[0]?.title).toBe("What's working & what\u2019s next");
    expect(posts[0]?.summary).toBe(
      "First sentence's point. Second sentence.",
    );
  });
});
