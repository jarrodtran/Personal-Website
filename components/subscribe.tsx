import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { btnGhost, btnPrimary } from "@/lib/ui";
import { isOwnWritingUrl, writingSubscribeUrl } from "@/lib/writing";

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

/**
 * An email field and Subscribe button in the site's own style. It submits by
 * GET to the Substack subscribe page in a new tab, which fills the email in.
 */
export function SubscribeForm({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <form
      action={href}
      method="get"
      target="_blank"
      rel="noopener noreferrer"
      className={cn("flex w-full flex-wrap gap-2", className)}
    >
      <label htmlFor="subscribe-email" className="sr-only">
        Email address
      </label>
      <input
        id="subscribe-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="border-border-control bg-background text-foreground placeholder:text-muted-foreground text-small min-h-11 min-w-0 flex-[1_1_12rem] border px-3"
      />
      <button type="submit" className={cn(btnPrimary, "max-w-full")}>
        {site.writing.subscribe.action}
        <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
        <span className="sr-only">(opens Substack)</span>
      </button>
    </form>
  );
}

/**
 * Heading, pitch, email form, and small print. h3 under a section, h2 at page
 * level. With `form`, the email field and button sit beside or under the
 * pitch; otherwise one Subscribe link does.
 */
export function SubscribeBlock({
  level = 3,
  form = false,
  className,
}: {
  level?: 2 | 3;
  form?: boolean;
  className?: string;
}) {
  const href = subscribeHref();
  if (!href) return null;
  const Heading = level === 2 ? "h2" : "h3";
  const { title, body, note } = site.writing.subscribe;

  return (
    <div
      data-testid="subscribe"
      className={cn(
        form
          ? "@container flex flex-col gap-4 @[44rem]:flex-row @[44rem]:items-center @[44rem]:justify-between @[44rem]:gap-8"
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
      {form ? (
        <SubscribeForm
          href={href}
          className="@[44rem]:w-[24rem] @[44rem]:shrink-0"
        />
      ) : (
        <SubscribeButton href={href} className="@[34rem]:shrink-0" />
      )}
    </div>
  );
}
