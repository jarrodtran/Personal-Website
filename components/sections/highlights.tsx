import { site } from "@/content/site";

export function Highlights() {
  return (
    <div
      aria-label="Impact highlights"
      className="border-border mb-12 grid grid-cols-2 gap-x-[24px] border-y sm:grid-cols-1 sm:gap-x-0"
    >
      {site.highlights.map((item) => (
        <div
          key={item.label}
          className="border-border @container min-w-0 px-0 py-6 max-sm:nth-[-n+2]:border-b sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6 sm:gap-y-1 sm:border-r-0 sm:px-0 sm:py-4 sm:not-last:border-b"
        >
          <p className="tabular font-display text-[min(1.875rem,29cqi)] leading-[1.2] sm:shrink-0 sm:text-[min(2.15rem,29cqi)]">
            {item.value}
          </p>
          <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-snug wrap-anywhere sm:mt-0 sm:min-w-0 sm:flex-1">
            {item.label}
          </p>
          {item.source ? (
            <p className="text-accent font-mono-label mt-3 sm:mt-0 sm:shrink-0">
              {item.source}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
