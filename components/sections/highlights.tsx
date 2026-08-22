import { site } from "@/content/site";

export function Highlights() {
  return (
    <section aria-label="Impact highlights" className="pb-6 sm:pb-10">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="border-border grid grid-cols-2 border-y sm:grid-cols-4">
          {site.highlights.map((item) => (
            <div
              key={item.label}
              className="border-border px-0 py-6 not-last:border-b sm:border-b-0 sm:px-6 sm:py-7 sm:not-last:border-r sm:first:pl-0 sm:last:pr-0"
            >
              <p className="tabular font-display text-3xl sm:text-[2.15rem]">
                {item.value}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-snug">
                {item.label}
              </p>
              {item.source ? (
                <p className="text-accent font-mono-label mt-3">
                  {item.source}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
