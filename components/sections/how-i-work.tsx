import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function HowIWork() {
  return (
    <Section id="approach" className="bg-muted/50">
      <SectionHeading title={site.sections.approach.title} />

      <ul>
        {site.principles.map((principle) => (
          <li
            key={principle.title}
            className="reveal border-border grid gap-2 border-t py-7 sm:grid-cols-[minmax(0,min(15rem,40%))_minmax(0,1fr)] sm:items-baseline sm:gap-x-8"
          >
            <h3 className="font-display text-[1.5rem] leading-tight tracking-tight text-balance">
              {principle.title}
            </h3>
            <p className="text-muted-foreground measure">
              {principle.description}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
