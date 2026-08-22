import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

function WorkMeta({ label, children }: { label: string; children: string }) {
  return (
    <div className="border-border grid grid-cols-[6.5rem_1fr] gap-4 border-t py-3 first:border-t-0 first:pt-0">
      <p className="text-muted-foreground font-mono-label pt-0.5">{label}</p>
      <p className="text-muted-foreground text-sm leading-relaxed">
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

      <div className="grid gap-8 sm:grid-cols-2">
        {site.selectedWork.map((item, index) => {
          const featured = index === 0;
          return (
            <Reveal
              key={item.title}
              delay={index * 0.05}
              className={featured ? "sm:col-span-2" : undefined}
            >
              <article
                className={cn(
                  "border-border bg-card overflow-hidden border",
                  featured && "sm:grid sm:grid-cols-2 sm:items-stretch",
                )}
              >
                {item.image ? (
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    width={1200}
                    height={800}
                    className={cn(
                      "aspect-[3/2] w-full object-cover contrast-[1.04] saturate-[0.82]",
                      featured && "sm:aspect-auto sm:h-full sm:min-h-[22rem]",
                    )}
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-display text-2xl tracking-tight">
                    {item.title}
                  </h3>
                  <div className="mt-5">
                    <WorkMeta label="Problem">{item.problem}</WorkMeta>
                    <WorkMeta label="What I did">{item.contribution}</WorkMeta>
                    <WorkMeta label="Outcome">{item.outcome}</WorkMeta>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-muted-foreground font-mono-label"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {item.link ? (
                      <a
                        href={item.link.href}
                        className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.link.label}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
