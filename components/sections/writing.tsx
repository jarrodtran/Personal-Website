import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { tap, textAction } from "@/lib/ui";
import {
  formatPostDate,
  isSubstackUrl,
  type WritingPost,
} from "@/lib/writing";

export function Writing({ posts }: { posts: WritingPost[] }) {
  const latest = posts.slice(0, 5);
  const archive = site.substack.url;
  const canArchive = Boolean(archive) && isSubstackUrl(archive);

  return (
    <Section id="writing">
      <SectionHeading
        eyebrow={site.sections.writing.eyebrow}
        title={site.sections.writing.title}
      />
      {latest.length === 0 ? (
        <p className="text-muted-foreground text-[1.0625rem] leading-relaxed">
          First post soon
        </p>
      ) : (
        <>
          <ol className="border-border border-t">
            {latest.map((post) => (
              <li key={post.href} className="border-border border-b py-4">
                <a
                  href={post.href}
                  className={`${tap} font-medium`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {post.title}
                </a>
                {post.date ? (
                  <p className="text-muted-foreground font-mono-label">
                    {formatPostDate(post.date)}
                  </p>
                ) : null}
                {post.summary ? (
                  <p className="text-muted-foreground measure mt-1 text-[1.0625rem] leading-relaxed">
                    {post.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          {canArchive ? (
            <a
              href={archive}
              className={`${textAction} mt-6`}
              target="_blank"
              rel="noreferrer"
            >
              All writing
            </a>
          ) : null}
        </>
      )}
    </Section>
  );
}
