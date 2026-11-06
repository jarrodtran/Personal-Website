import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Writing } from "@/components/sections/writing";
import type { WritingPost } from "@/lib/writing";

function fixturePosts(count: number): WritingPost[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Fixture post ${i + 1}`,
    href: `https://example.com/fixture-post-${i + 1}`,
    date: "2026-11-01",
    summary: `Fixture summary ${i + 1}`,
  }));
}

describe("writing list limit", () => {
  it("renders only the latest 3 posts when the feed has more", () => {
    const markup = renderToStaticMarkup(
      <Writing posts={fixturePosts(5)} />,
    );
    expect(markup.match(/<li/g) ?? []).toHaveLength(3);
    expect(markup).toContain("Fixture post 1");
    expect(markup).toContain("Fixture post 3");
    expect(markup).not.toContain("Fixture post 4");
    expect(markup).not.toContain("Fixture post 5");
  });

  it("renders every post when the feed has fewer than 3", () => {
    const markup = renderToStaticMarkup(
      <Writing posts={fixturePosts(2)} />,
    );
    expect(markup.match(/<li/g) ?? []).toHaveLength(2);
  });
});
