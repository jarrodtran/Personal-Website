import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function SelectedWork() {
  return (
    <Section id="work">
      <SectionHeading title={site.sections.work.title} />

      <ol>
        {site.selectedWork.map((item) => (
          <li key={item.slug}>
            <article
              data-work-entry
              className="reveal border-border group has-[a:focus-visible]:outline-ring relative flex min-w-0 flex-col border-t py-8 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2"
            >
              <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
                <Link
                  href={`/work/${item.slug}/`}
                  className="underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  {item.title}
                </Link>
              </h3>

              <div
                data-work-metric
                className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1"
              >
                <p
                  data-work-figure
                  className="tabular font-display text-[2.25rem] leading-none sm:text-[3rem]"
                >
                  {item.panel.value}
                </p>
                <p
                  data-work-label
                  className="text-muted-foreground max-w-md text-[0.9375rem] leading-snug text-pretty"
                >
                  {item.panel.label}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {item.problem}
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {item.contribution}
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {item.outcome}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
