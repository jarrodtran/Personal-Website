import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function About() {
  return (
    <Section id="about">
      <SectionHeading title={site.sections.about.title} />
      <p className="text-muted-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
        {site.about.bio.join(" ")}
      </p>
      <p className="text-muted-foreground measure mt-4 text-small">
        {site.positioning.location}
        <span aria-hidden="true"> · </span>
        {site.about.education}
      </p>
    </Section>
  );
}
