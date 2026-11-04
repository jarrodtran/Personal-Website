import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { btnGhost, tap } from "@/lib/ui";
import {
  formatPostDate,
  isOwnWritingUrl,
  writingSubscribeUrl,
  type WritingPost,
} from "@/lib/writing";

const EMPTY_COPY =
  "First post coming soon. Subscribe to get it by email.";

function SubscribeLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className={`${btnGhost} mt-6 w-fit`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Subscribe on Substack
      <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
    </a>
  );
}

export function Writing({ posts }: { posts: WritingPost[] }) {
  const latest = posts.slice(0, 5);
  const subscribe = writingSubscribeUrl(site.substack);
  const canSubscribe =
    Boolean(subscribe) && isOwnWritingUrl(subscribe, site.substack.url);

  return (
    <Section id="writing">
      <SectionHeading title={site.substack.name} />
      <div className="max-w-2xl">
        {latest.length === 0 ? (
          <p className="text-muted-foreground measure text-lg leading-relaxed">
            {EMPTY_COPY}
          </p>
        ) : (
          <ol className="border-border border-t">
            {latest.map((post) => {
              const dateLabel = post.date ? formatPostDate(post.date) : "";
              return (
                <li key={post.href} className="border-border border-b py-4">
                  <a
                    href={post.href}
                    className={`${tap} text-foreground max-w-full gap-1 text-lg font-medium no-underline hover:underline`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="min-w-0">{post.title}</span>
                    <ArrowUpRight
                      className="size-[16px] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(opens Substack)</span>
                  </a>
                  {dateLabel ? (
                    <time
                      dateTime={post.date}
                      className="text-muted-foreground font-mono-label tabular block"
                    >
                      {dateLabel}
                    </time>
                  ) : null}
                  {post.summary ? (
                    <p className="text-muted-foreground measure mt-1 line-clamp-2 text-lg leading-relaxed">
                      {post.summary}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        {canSubscribe ? <SubscribeLink href={subscribe} /> : null}
      </div>
    </Section>
  );
}
