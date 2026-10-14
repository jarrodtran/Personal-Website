import { Download, Mail } from "lucide-react";
import { LinkedInIcon } from "@/components/brand-icons";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { btnGhost, btnPrimary } from "@/lib/ui";

export function Hero() {
  return (
    <section id="top" className="px-5 pt-8 pb-10 sm:px-8 sm:pt-16 sm:pb-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-[2.25rem] leading-none tracking-tight sm:text-5xl">
          {site.positioning.name}
        </h1>
        <p className="mt-4 text-lg leading-snug">
          {site.positioning.currentRole}
        </p>
        <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-pretty">
          {site.positioning.headline}
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <a
            href={withBasePath(site.contact.resumeHref)}
            download={site.contact.resumeFilename}
            className={btnPrimary}
          >
            <Download className="size-4 shrink-0" aria-hidden="true" />
            Résumé
          </a>
          <a href={`mailto:${site.contact.email}`} className={btnGhost}>
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            Email
          </a>
          <a
            href={site.contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className={btnGhost}
          >
            <LinkedInIcon className="size-4 shrink-0" />
            LinkedIn
          </a>
        </div>

        <p className="text-muted-foreground mt-6 text-[0.9375rem]">
          {site.positioning.currentCompany}
          <span aria-hidden="true"> · </span>
          {site.positioning.location}
          <span aria-hidden="true"> · </span>
          {site.positioning.status}
        </p>
      </div>
    </section>
  );
}
