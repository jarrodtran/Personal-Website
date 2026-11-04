import { site } from "@/content/site";

export function Hero() {
  return (
    <section
      id="top"
      className="flex flex-col justify-start pt-8 pb-12 sm:pt-16 sm:pb-16"
    >
      <div className="@container mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h1 className="hero-in measure font-display text-[min(1.75rem,15cqi)] leading-[1.15] tracking-tight text-balance sm:text-[min(2.25rem,9cqi)]">
          {site.positioning.headline}
        </h1>
      </div>
    </section>
  );
}
