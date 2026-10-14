import { site } from "@/content/site";

export function Hero() {
  return (
    <section id="top" className="pt-8 pb-10 sm:pt-16 sm:pb-14">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <h1 className="font-display text-[2.25rem] leading-[1.1] tracking-tight sm:text-5xl">
          {site.positioning.name}
        </h1>
        <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-pretty">
          {site.positioning.headline}
        </p>
        <p className="mt-8 text-[1.125rem] leading-relaxed">Subscribe</p>
        <p className="text-muted-foreground mt-1 text-[1.125rem] leading-relaxed">
          Coming soon
        </p>
      </div>
    </section>
  );
}
