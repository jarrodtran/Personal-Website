import { ArrowDown, Download, Mail } from "lucide-react";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-16 pb-10 sm:pt-24 sm:pb-16"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="hero-blob bg-accent/30"
          style={{ width: 420, height: 420, top: -80, left: "12%" }}
        />
        <div
          className="hero-blob bg-accent/20"
          style={{
            width: 360,
            height: 360,
            top: 40,
            right: "8%",
            animationDelay: "-6s",
          }}
        />
        <div className="hero-grid absolute inset-0" />
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="border-border bg-card/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm shadow-[var(--shadow-card)] backdrop-blur">
          <span className="relative flex size-2">
            <span className="bg-accent absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-accent relative inline-flex size-2 rounded-full" />
          </span>
          {site.positioning.status}
        </div>

        <h1 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
          {site.positioning.headline}
        </h1>

        <p className="text-muted-foreground mt-4 max-w-2xl text-sm">
          {site.positioning.currentRole}
          <span aria-hidden="true"> · </span>
          {site.positioning.location}
        </p>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
          {site.positioning.valueProp}
        </p>

        <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
          {site.positioning.targetingLine}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="#experience"
            className="bg-accent text-accent-foreground inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-card)] transition-opacity hover:opacity-90"
          >
            View Experience
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <a
            href="#contact"
            className="border-border bg-card hover:border-accent/40 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-card)] transition-colors"
          >
            Contact Me
            <Mail className="size-4" aria-hidden="true" />
          </a>
          <a
            href={site.contact.resumeHref}
            download
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Download Resume
            <Download className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
