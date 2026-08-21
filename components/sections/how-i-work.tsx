import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function HowIWork() {
  return (
    <Section id="approach" className="bg-muted/60">
      <SectionHeading
        eyebrow={site.sections.approach.eyebrow}
        title={site.sections.approach.title}
        description={site.sections.approach.description}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {site.principles.map((principle, index) => (
          <Reveal key={principle.title} delay={index * 0.06}>
            <article className="border-border bg-card h-full rounded-2xl border p-6 shadow-[var(--shadow-card)]">
              <p className="text-accent text-xs font-medium tracking-[0.16em] uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">
                {principle.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {principle.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
