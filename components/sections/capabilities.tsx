import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function Capabilities() {
  return (
    <Section id="capabilities">
      <SectionHeading
        eyebrow={site.sections.capabilities.eyebrow}
        title={site.sections.capabilities.title}
        description={site.sections.capabilities.description}
      />

      <div className="grid gap-8 sm:grid-cols-2">
        {site.capabilities.map((group, index) => (
          <Reveal key={group.group} delay={index * 0.05}>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                {group.group}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="border-border bg-card text-muted-foreground rounded-full border px-3 py-1.5 text-sm shadow-[var(--shadow-card)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
