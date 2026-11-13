import { Section, SectionHeading } from "@/components/section";
import { ResumeLink } from "@/components/resume-link";
import { site } from "@/content/site";

export function About() {
  return (
    <Section id="about">
      <span id="approach" className="block scroll-mt-24" />
      <SectionHeading title={site.sections.about.title} />
      <p className="text-muted-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
        {site.about.bio.join(" ")}
      </p>
      <div className="mt-2">
        <ResumeLink />
      </div>
    </Section>
  );
}
