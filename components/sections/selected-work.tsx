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
        {site.selectedWork.map(({ slug, title, preview }) => (
          <li key={slug}>
            <a
              href={withBasePath(`/work/${slug}/`)}
              className={`${tap} w-full gap-3 py-3`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium underline underline-offset-4">
                  {title}
                </span>
                <span className="text-muted-foreground text-small mt-1 block">
                  {preview}
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
