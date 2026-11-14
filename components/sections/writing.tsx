import { EssayList } from "@/components/essay-list";
import { Section, SectionHeading } from "@/components/section";
import { SubscribeBlock } from "@/components/subscribe";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { tap, textAction } from "@/lib/ui";
import {
  HOME_ESSAY_LIMIT,
  isOwnWritingUrl,
  writingPublicationUrl,
  type WritingPost,
} from "@/lib/writing";

/** The empty state, or a direct Substack link when the feed could not load. */
export function NoEssays({ unavailable = false }: { unavailable?: boolean }) {
  const publication = writingPublicationUrl(site.substack);
  const linkable =
    unavailable && isOwnWritingUrl(publication, site.substack.url);
  return (
    <p className="text-muted-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
      {linkable ? (
        <a href={publication} className={`${tap} underline underline-offset-4`}>
          Read {site.substack.name} on Substack
        </a>
      ) : (
        site.writing.empty
      )}
    </p>
  );
}

export function Writing({
  posts,
  unavailable = false,
}: {
  posts: WritingPost[];
  unavailable?: boolean;
}) {
  const latest = posts.slice(0, HOME_ESSAY_LIMIT);
  const more = posts.length > HOME_ESSAY_LIMIT;

  return (
    <Section id="writing">
      <SectionHeading title={site.writing.latestTitle} />
      {latest.length === 0 ? (
        <NoEssays unavailable={unavailable} />
      ) : (
        <EssayList posts={latest} expanded={latest.length === 1} />
      )}
      {more ? (
        <p className="mt-3">
          <a href={withBasePath("/writing/")} className={textAction}>
            {site.writing.allEssays}
          </a>
        </p>
      ) : null}
      <SubscribeBlock className="mt-8" />
    </Section>
  );
}
