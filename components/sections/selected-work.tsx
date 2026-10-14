import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { tap, textAction } from "@/lib/ui";

function WorkMeta({ label, children }: { label: string; children: string }) {
  return (
    <div className="border-border grid gap-1 border-t py-3 first:border-t-0 first:pt-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <p className="text-accent font-mono-label pt-0.5">{label}</p>
      <p className="text-muted-foreground text-[1.0625rem] leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function SelectedWork() {
  return (
    <Section id="work">
      <SectionHeading
        eyebrow={site.sections.work.eyebrow}
        title={site.sections.work.title}
        description={site.sections.work.description}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {site.selectedWork.map((item, index) => {
          const featured = index === 0;
          const caseHref = `/work/${item.slug}/`;
          return (
            <article
              key={item.slug}
              className={cn(
                "reveal border-border bg-card flex min-w-0 flex-col overflow-hidden border",
                featured &&
                  "sm:col-span-2 sm:grid sm:grid-cols-2 sm:items-stretch",
              )}
            >
              <div
                className={cn(
                  "border-border bg-muted flex aspect-[3/2] w-full min-w-0 flex-col justify-between border-b p-5 sm:p-7",
                  featured &&
                    "sm:aspect-auto sm:h-full sm:min-h-[20rem] sm:border-r sm:border-b-0",
                )}
              >
                <p className="text-accent font-mono-label">
                  {item.panel.kicker}
                </p>
                <div>
                  <p className="tabular font-display text-5xl sm:text-6xl">
                    {item.panel.value}
                  </p>
                  <p className="text-muted-foreground mt-3 max-w-xs text-[0.9375rem] leading-snug">
                    {item.panel.label}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-7">
                <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
                  {item.title}
                </h3>
                <div className="mt-5">
                  <WorkMeta label="Problem">{item.problem}</WorkMeta>
                  <WorkMeta label="What I did">{item.contribution}</WorkMeta>
                  <WorkMeta label="Outcome">{item.outcome}</WorkMeta>
                </div>
                <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-muted-foreground font-mono-label"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <Link href={caseHref} className={textAction}>
                      Read the case study
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                    {item.link ? (
                      <a
                        href={item.link.href}
                        className={cn(tap, "text-[0.9375rem] font-medium")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.link.label}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
