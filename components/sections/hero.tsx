import { site } from "@/content/site";

export function Hero() {
  return (
    <section
      id="top"
      className="flex scroll-mt-24 flex-col justify-start py-[var(--spacing-section)]"
    >
      <div className="@container mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h1 className="measure font-display text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance">
          {site.positioning.name}
        </h1>
        <p className="text-muted-foreground measure text-body mt-4 leading-[var(--leading-copy)]">
          {site.positioning.intro}
        </p>
      </div>
    </section>
  );
}
