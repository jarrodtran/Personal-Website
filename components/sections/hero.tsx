import { site } from "@/content/site";

export function Hero() {
  return (
    <section
      id="top"
      className="flex flex-col justify-start py-[var(--spacing-section)]"
    >
      <div className="@container mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h1 className="measure font-display text-[length:var(--text-h1)] leading-[1.15] tracking-tight text-balance">
          {site.positioning.name}
        </h1>
      </div>
    </section>
  );
}
