import type { Metadata } from "next";
import { EssayList } from "@/components/essay-list";
import { SubscribeBlock } from "@/components/subscribe";
import { NoEssays } from "@/components/sections/writing";
import { site } from "@/content/site";
import {
  ARCHIVE_GROUP_AFTER,
  loadWritingResult,
  postYear,
  type WritingPost,
} from "@/lib/writing";

async function loadArchive() {
  const result = await loadWritingResult(site.substack, { limit: Infinity });
  if (!result.ok) {
    console.error(`writing feed: ${result.reason}`);
  }
  return result;
}

export async function generateMetadata(): Promise<Metadata> {
  const { posts } = await loadArchive();
  // Stay out of search until the first essay is listed.
  return posts.length === 0
    ? { title: "Writing", robots: { index: false, follow: true } }
    : { title: "Writing", alternates: { canonical: "/writing/" } };
}

function byYear(posts: WritingPost[]): Array<[string, WritingPost[]]> {
  const groups = new Map<string, WritingPost[]>();
  for (const post of posts) {
    const year = post.date ? postYear(post.date) : "";
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups];
}

export default async function WritingPage() {
  const { ok, posts } = await loadArchive();
  const grouped = posts.length > ARCHIVE_GROUP_AFTER;

  return (
    <div className="lg:max-w-site mx-auto w-full max-w-5xl px-5 sm:px-8">
      <div
        id="essays"
        className="lg:max-w-home w-full max-w-prose py-[var(--spacing-section)]"
      >
        <h1 className="measure font-display text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance">
          {site.substack.name}
        </h1>
        <p className="text-foreground measure text-body mt-4 leading-[var(--leading-copy)]">
          {site.writing.archiveIntro}
        </p>
        {posts.length === 0 ? (
          <>
            <div className="mt-8">
              <NoEssays unavailable={!ok} />
            </div>
            <SubscribeBlock level={2} embed className="mt-8" />
          </>
        ) : (
          <>
            <SubscribeBlock level={2} embed className="mt-8" />
            {grouped ? (
              byYear(posts).map(([year, items]) => (
                <section key={year || "undated"} className="mt-10">
                  <h2 className="text-muted-foreground text-small tabular mb-2 font-medium">
                    {year || "Undated"}
                  </h2>
                  <EssayList posts={items} />
                </section>
              ))
            ) : (
              <EssayList posts={posts} className="mt-10" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
