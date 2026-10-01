import { Download, Mail } from "lucide-react";
import { LinkedInIcon } from "@/components/brand-icons";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";

const action =
  "inline-flex grow items-center justify-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors sm:grow-0 sm:px-5";
const primary = `${action} bg-accent text-accent-foreground hover:bg-accent-hover`;
const secondary = `${action} border border-border hover:border-accent/50 hover:text-accent`;

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

        <div className="mt-9 flex flex-wrap gap-2 sm:gap-3">
          <a
            href={withBasePath(site.contact.resumeHref)}
            download={site.contact.resumeFilename}
            className={primary}
          >
            <Download className="size-4 shrink-0" aria-hidden="true" />
            Résumé
          </a>
          <a href={`mailto:${site.contact.email}`} className={secondary}>
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            Email
          </a>
          <a
            href={site.contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className={secondary}
          >
            <LinkedInIcon className="size-4 shrink-0" />
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
