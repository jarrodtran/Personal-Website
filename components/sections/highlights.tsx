import { site } from "@/content/site";

export function Highlights() {
  return (
    <div
      aria-label="Impact highlights"
      className="border-border mb-12 grid grid-cols-2 gap-x-[24px] border-y sm:grid-cols-4 sm:gap-x-0"
    >
      {site.highlights.map((item) => (
        <div
          key={item.label}
          className="border-border @container min-w-0 px-0 py-6 not-last:border-b sm:border-b-0 sm:px-[24px] sm:py-7 sm:not-last:border-r sm:first:pl-0 sm:last:pr-0"
        >
          <p className="tabular font-display text-[min(1.875rem,29cqi)] leading-[1.2] sm:text-[min(2.15rem,29cqi)]">
            {item.value}
          </p>
          <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-snug wrap-anywhere">
            {item.label}
          </p>
          {item.source ? (
            <p className="text-accent font-mono-label mt-3">{item.source}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
