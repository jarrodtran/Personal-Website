import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function SelectedWork() {
  return (
    <Section id="work">
      <SectionHeading
        eyebrow={site.sections.work.eyebrow}
        title={site.sections.work.title}
        description={site.sections.work.description}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {site.selectedWork.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.06}>
            <article className="border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]">
              {item.image ? (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={1200}
                  height={675}
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  <span className="text-foreground font-medium">Problem. </span>
                  {item.problem}
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  <span className="text-foreground font-medium">
                    Contribution.{" "}
                  </span>
                  {item.contribution}
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  <span className="text-foreground font-medium">Outcome. </span>
                  {item.outcome}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border-border bg-muted text-muted-foreground rounded-full border px-2.5 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.link ? (
                  <a
                    href={item.link.href}
                    className="text-accent mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.link.label}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
