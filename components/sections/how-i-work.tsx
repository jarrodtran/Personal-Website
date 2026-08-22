import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function HowIWork() {
  return (
    <Section id="approach" className="bg-muted/50">
      <SectionHeading
        eyebrow={site.sections.approach.eyebrow}
        title={site.sections.approach.title}
        description={site.sections.approach.description}
      />

      <ol>
        {site.principles.map((principle, index) => (
          <Reveal key={principle.title} delay={index * 0.04}>
            <li className="border-border grid gap-3 border-t py-8 sm:grid-cols-[5rem_minmax(0,11rem)_1fr] sm:gap-8">
              <p className="text-accent font-mono-label pt-1">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display text-2xl tracking-tight">
                {principle.title}
              </h3>
              <p className="text-muted-foreground max-w-xl text-sm leading-relaxed sm:pt-1">
                {principle.description}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
