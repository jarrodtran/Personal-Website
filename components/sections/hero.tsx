import { site } from "@/content/site";

export function Hero() {
  return (
    <section
      id="top"
      className="flex flex-col justify-start pt-8 pb-12 sm:pt-16 sm:pb-16"
    >
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h1 className="measure font-display text-[1.75rem] leading-[1.15] tracking-tight text-balance sm:text-4xl">
          {site.positioning.headline}
        </h1>
      </div>
    </section>
  );
}
