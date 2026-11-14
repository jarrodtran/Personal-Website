import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/ui";
import { formatPostDate, type WritingPost } from "@/lib/writing";

/**
 * One row per essay: title link, summary, date. The date sits right of the
 * title from the sm breakpoint and under the summary below it.
 */
export function EssayList({
  posts,
  expanded = false,
  className,
}: {
  posts: WritingPost[];
  /** A lone essay gets a longer summary. */
  expanded?: boolean;
  className?: string;
}) {
  return (
    <ol
      role="list"
      className={cn("border-border divide-border divide-y border-y", className)}
    >
      {posts.map((post) => {
        const dateLabel = post.date ? formatPostDate(post.date) : "";
        return (
          <li
            key={post.href}
            className="grid grid-cols-1 gap-x-6 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
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
            {post.summary ? (
              <p
                className={cn(
                  "text-muted-foreground measure text-small",
                  expanded ? "line-clamp-3" : "line-clamp-2",
                )}
              >
                {post.summary}
              </p>
            ) : null}
            {dateLabel ? (
              <time
                dateTime={post.date}
                className="text-muted-foreground text-small tabular mt-1 block sm:col-start-2 sm:row-start-1 sm:mt-0 sm:self-center sm:text-right sm:whitespace-nowrap"
              >
                {dateLabel}
              </time>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
