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

      <div className="border-border border-t">
        {site.capabilities.map((group) => (
          <div
            key={group.group}
            className="reveal border-border grid gap-3 border-b py-6 sm:grid-cols-[14rem_1fr] sm:gap-10"
          >
            <h3 className="text-sm font-medium tracking-tight">
              {group.group}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {group.items.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
