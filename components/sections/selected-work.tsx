import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { tap } from "@/lib/ui";
import { withBasePath } from "@/lib/base-path";

export function SelectedWork() {
  return (
    <Section id="work">
      <span id="experience" className="block scroll-mt-24" />
      <SectionHeading title={site.sections.work.title} />
      <ul role="list" className="border-border divide-border divide-y border-y">
        {site.selectedWork.map(({ slug, title, preview, panel }) => (
          <li key={slug}>
            <a
              href={withBasePath(`/work/${slug}/`)}
              className={`${tap} w-full gap-3 py-3`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-6">
                <span className="min-w-0 sm:flex-1">
                  <span className="block font-medium underline underline-offset-4">
                    {title}
                  </span>
                  <span className="text-muted-foreground text-small mt-1 block">
                    {preview}
                  </span>
                </span>
                <span className="block min-w-0 sm:w-52 sm:shrink-0">
                  <span className="font-display block text-[length:var(--text-h2)] leading-[var(--leading-title)]">
                    {panel.value}
                  </span>
                  <span className="text-muted-foreground text-small block">
                    {panel.label}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className="size-[16px] shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
