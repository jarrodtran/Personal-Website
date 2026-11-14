import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { btnGhost, btnPrimary } from "@/lib/ui";
import {
  isOwnWritingUrl,
  writingEmbedUrl,
  writingSubscribeUrl,
} from "@/lib/writing";

/** The Substack subscribe page, or "" when the configured URL is not ours. */
export function subscribeHref(): string {
  const href = writingSubscribeUrl(site.substack);
  return isOwnWritingUrl(href, site.substack.url) ? href : "";
}

export function SubscribeButton({
  href,
  primary = false,
  className,
}: {
  href: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        primary ? btnPrimary : btnGhost,
        "w-fit max-w-full",
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      {site.writing.subscribe.action}
      <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
      <span className="sr-only">(opens Substack)</span>
    </a>
  );
}

/** Substack's signup form URL, or "" when the configured URL is not ours. */
export function subscribeEmbedHref(): string {
  const href = writingEmbedUrl(site.substack);
  return isOwnWritingUrl(href, site.substack.url) ? href : "";
}

/**
 * Heading, pitch, button, and small print. h3 under a section, h2 at page
 * level. With `embed`, Substack's own email form replaces the button so a
 * reader can subscribe without leaving the page. It is Substack's markup in
 * an iframe, so it stays light in dark mode.
 */
export function SubscribeBlock({
  level = 3,
  embed = false,
  className,
}: {
  level?: 2 | 3;
  embed?: boolean;
  className?: string;
}) {
  const href = subscribeHref();
  if (!href) return null;
  const embedHref = embed ? subscribeEmbedHref() : "";
  const Heading = level === 2 ? "h2" : "h3";
  const { title, body, note } = site.writing.subscribe;

  return (
    <div
      data-testid="subscribe"
      className={cn(
        embedHref
          ? "flex flex-col gap-4"
          : "@container flex flex-col gap-4 @[34rem]:flex-row @[34rem]:items-center @[34rem]:justify-between @[34rem]:gap-8",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="text-body leading-[var(--leading-title)] font-medium">
          {title}
        </Heading>
        <p className="text-foreground measure mt-1 text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty">
          {body}
        </p>
        <p className="text-muted-foreground text-small mt-2">{note}</p>
      </div>
      {embedHref ? (
        <iframe
          src={embedHref}
          title={site.writing.subscribe.embedTitle}
          loading="lazy"
          className="border-border h-80 w-full max-w-[30rem] rounded-md border"
        />
      ) : (
        <SubscribeButton href={href} className="@[34rem]:shrink-0" />
      )}
    </div>
  );
}
