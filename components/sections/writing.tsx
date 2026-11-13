import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { btnGhost, tap } from "@/lib/ui";
import {
  formatPostDate,
  isOwnWritingUrl,
  writingSubscribeUrl,
  type WritingPost,
} from "@/lib/writing";

const EMPTY_COPY = "Get new essays by email.";

function SubscribeLink({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(btnGhost, "w-fit max-w-full flex-wrap", className)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="min-w-0 flex-1">Subscribe on Substack</span>
      <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
    </a>
  );
}

export function Writing({
  posts,
  unavailable = false,
}: {
  posts: WritingPost[];
  unavailable?: boolean;
}) {
  const latest = posts.slice(0, 5);
  const subscribe = writingSubscribeUrl(site.substack);
  const canSubscribe =
    Boolean(subscribe) && isOwnWritingUrl(subscribe, site.substack.url);
  const empty = latest.length === 0;

  return (
    <Section id="writing">
      <SectionHeading title={site.substack.name} />
      {empty ? (
        <div className="@container flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-muted-foreground measure min-w-0 text-[length:var(--text-body)] leading-[var(--leading-copy)]">
            {unavailable ? "Recent posts are unavailable here." : EMPTY_COPY}
            {unavailable && canSubscribe ? (
              <>
                {" "}
                <a href={subscribe} className="underline underline-offset-4">
                  Read Worth Mulling on Substack
                </a>
                .
              </>
            ) : null}
          </p>
          {canSubscribe ? (
            <SubscribeLink
              href={subscribe}
              className="max-w-full min-w-0 @[28rem]:shrink-0"
            />
          ) : null}
        </div>
      ) : (
        <div className="max-w-2xl">
          <ol role="list" className="border-border border-t">
            {latest.map((post) => {
              const dateLabel = post.date ? formatPostDate(post.date) : "";
              return (
                <li key={post.href} className="border-border border-b py-4">
                  <a
                    href={post.href}
                    className={`${tap} text-foreground text-body max-w-full gap-1 leading-[var(--leading-title)] font-medium no-underline hover:underline`}
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
                    <p className="text-muted-foreground measure mt-1 line-clamp-2 text-[length:var(--text-body)] leading-[var(--leading-copy)]">
                      {post.summary}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {canSubscribe ? (
            <SubscribeLink href={subscribe} className="mt-6" />
          ) : null}
        </div>
      )}
    </Section>
  );
}
