import { ArrowDown, Mail } from "lucide-react";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section id="top" className="relative isolate pt-20 pb-6 sm:pt-28 sm:pb-8">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="text-accent font-mono-label flex items-center gap-2.5">
          <span
            className="bg-accent size-1.5 shrink-0 rounded-full"
            aria-hidden="true"
          />
          {site.positioning.status}
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span className="text-muted-foreground">{site.positioning.name}</span>
        </p>

        <h1 className="font-display mt-7 max-w-3xl text-[2.35rem] leading-[1.12] text-balance sm:text-5xl lg:text-[3.35rem]">
          {site.positioning.headline}
        </h1>

        <p className="text-muted-foreground mt-5 max-w-2xl text-sm">
          {site.positioning.currentRole}
          <span aria-hidden="true"> · </span>
          {site.positioning.currentCompany}
          <span aria-hidden="true"> · </span>
          {site.positioning.location}
        </p>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-pretty">
          {site.positioning.valueProp}
        </p>

        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
          {site.positioning.targetingLine}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#work"
            className="bg-accent text-accent-foreground hover:bg-accent-hover inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
          >
            See the work
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <a
            href="#contact"
            className="border-border hover:border-accent/50 hover:text-accent inline-flex items-center justify-center gap-2 rounded-sm border bg-transparent px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Get in touch
            <Mail className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
