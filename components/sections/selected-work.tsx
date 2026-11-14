import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";

/**
 * One link per row, figure first. The numeral column is fixed from sm and the
 * numeral stays inside it (min of the figure token and 30cqi of its own box),
 * so "$156M" and "1,000+" never overflow at 320 or at 200% text. Below sm the
 * numeral sits above the title.
 */
export function SelectedWork() {
  return (
    <Section id="work">
      <span id="experience" className="absolute scroll-mt-24" />
      <SectionHeading title={site.sections.work.title} />
      <ul role="list" className="border-border divide-border divide-y border-t">
        {site.selectedWork.map(({ slug, title, preview, panel }) => (
          <li key={slug}>
            <a
              href={withBasePath(`/work/${slug}/`)}
              className="grid min-h-11 w-full grid-cols-1 gap-x-6 gap-y-2 py-5 sm:grid-cols-[10rem_minmax(0,1fr)]"
            >
              <span className="@container min-w-0">
                <span className="tabular font-display block text-[length:min(var(--text-figure),30cqi)] leading-[var(--leading-figure)] tracking-tight">
                  {panel.value}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block font-medium underline underline-offset-4">
                  {title}
                </span>
                <span className="text-foreground text-small mt-1 block">
                  {preview}
                </span>
                <span className="text-muted-foreground text-small mt-2 block">
                  {panel.label}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
