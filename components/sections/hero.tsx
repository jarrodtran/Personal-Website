import { ArrowUpRight } from "lucide-react";
import { siteContainer } from "@/components/section";
import { SubscribeButton, subscribeHref } from "@/components/subscribe";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { btnGhost, btnPrimary } from "@/lib/ui";
import type { WritingPost } from "@/lib/writing";

const primaryClass = `${btnPrimary} w-fit max-w-full`;

export function Hero({ latest }: { latest?: WritingPost }) {
  const subscribe = subscribeHref();
  return (
    <section
      id="top"
      className="flex scroll-mt-24 flex-col justify-start py-[var(--spacing-section)]"
    >
      <div className={`@container ${siteContainer}`}>
        <h1 className="measure font-display text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance">
          {site.positioning.name}
        </h1>
        <p className="font-display measure mt-4 text-[length:var(--text-h3)] leading-[var(--leading-title)] text-balance">
          {site.positioning.lede}
        </p>
        <p className="text-foreground measure text-body mt-3 leading-[var(--leading-copy)]">
          {site.positioning.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {latest?.path ? (
            <a href={withBasePath(latest.path)} className={primaryClass}>
              {site.writing.readLatest}
            </a>
          ) : latest ? (
            <a
              href={latest.href}
              className={primaryClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {site.writing.readLatest}
              <ArrowUpRight
                className="size-[16px] shrink-0"
                aria-hidden="true"
              />
              <span className="sr-only">(opens Substack)</span>
            </a>
          ) : subscribe ? (
            <SubscribeButton href={subscribe} primary />
          ) : null}
          <a href="#work" className={`${btnGhost} w-fit max-w-full`}>
            {site.positioning.workAction}
          </a>
        </div>
      </div>
    </section>
  );
}
