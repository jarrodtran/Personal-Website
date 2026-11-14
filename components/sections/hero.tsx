import { ArrowUpRight } from "lucide-react";
import { SubscribeButton, subscribeHref } from "@/components/subscribe";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { btnPrimary } from "@/lib/ui";
import type { WritingPost } from "@/lib/writing";

export function Hero({ latest }: { latest?: WritingPost }) {
  const subscribe = subscribeHref();

  return (
    <section
      id="top"
      className="flex scroll-mt-24 flex-col justify-start py-[var(--spacing-section)]"
    >
      <div className="@container mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h1 className="measure font-display text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance">
          {site.positioning.name}
        </h1>
        <p className="text-foreground measure text-body mt-4 leading-[var(--leading-copy)]">
          {site.positioning.intro}
        </p>
        {latest?.path ? (
          <a
            href={withBasePath(latest.path)}
            className={`${btnPrimary} mt-6 w-fit max-w-full`}
          >
            {site.writing.readLatest}
          </a>
        ) : latest ? (
          <a
            href={latest.href}
            className={`${btnPrimary} mt-6 w-fit max-w-full`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {site.writing.readLatest}
            <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
            <span className="sr-only">(opens Substack)</span>
          </a>
        ) : subscribe ? (
          <SubscribeButton href={subscribe} primary className="mt-6" />
        ) : null}
      </div>
    </section>
  );
}
