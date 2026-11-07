import { cn } from "@/lib/cn";
import { site } from "@/content/site";

export function Highlights() {
  const sharedSource = site.highlights.every(
    (item) => item.source === site.highlights[0]?.source,
  )
    ? site.highlights[0]?.source
    : undefined;

  return (
    <div aria-label="Impact highlights" className="border-border mb-12 border-y">
      <div className="grid grid-cols-2 gap-x-[24px] sm:gap-x-0">
        {site.highlights.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "@container border-border min-w-0 py-6",
              index < 2 && "border-b",
              index % 2 === 0 ? "sm:border-r sm:pr-6" : "sm:pl-6",
            )}
          >
            <p className="tabular font-display text-[min(1.875rem,29cqi)] leading-[1.2] sm:text-[min(2.15rem,29cqi)]">
              {item.value}
            </p>
            <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-snug wrap-anywhere">
              {item.label}
            </p>
            {!sharedSource && item.source ? (
              <p className="text-accent font-mono-label mt-3">{item.source}</p>
            ) : null}
          </div>
        ))}
      </div>
      {sharedSource ? (
        <p className="text-accent font-mono-label border-border border-t py-3">
          {sharedSource}
        </p>
      ) : null}
    </div>
  );
}
