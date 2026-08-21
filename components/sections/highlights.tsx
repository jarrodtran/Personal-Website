import { site } from "@/content/site";

export function Highlights() {
  return (
    <section aria-label="Impact highlights" className="pb-8 sm:pb-12">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="border-border bg-card grid grid-cols-2 overflow-hidden rounded-2xl border shadow-[var(--shadow-card)] sm:grid-cols-4">
          {site.highlights.map((item) => (
            <div
              key={item.label}
              className="border-border px-5 py-6 not-last:border-b sm:border-b-0 sm:px-6 sm:py-7 sm:not-last:border-r"
            >
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.value}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-snug">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
