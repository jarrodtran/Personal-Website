import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function About() {
  return (
    <Section id="about">
      <SectionHeading
        eyebrow={site.sections.about.eyebrow}
        title={site.sections.about.title}
      />
      <p className="text-muted-foreground measure text-lg leading-relaxed">
        {site.about.bio.join(" ")}
      </p>
      <p className="text-muted-foreground measure mt-4 text-[0.9375rem] leading-relaxed">
        {site.positioning.location}
        <span aria-hidden="true"> · </span>
        {site.about.education}
      </p>
    </Section>
  );
}
