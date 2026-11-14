import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { ResumeLink } from "@/components/resume-link";
import { site } from "@/content/site";
import { textAction } from "@/lib/ui";

export function About() {
  return (
    <Section id="about">
      <span id="approach" className="block scroll-mt-24" />
      <SectionHeading title={site.sections.about.title} />
      <div className="space-y-4">
        {site.about.bio.map((paragraph) => (
          <p
            key={paragraph}
            className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]"
          >
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6">
        <ResumeLink />
        <a
          href={site.contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={textAction}
        >
          LinkedIn
          <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
        </a>
      </div>
    </Section>
  );
}
