import { ArrowUpRight } from "lucide-react";
import { CopyEmail } from "@/components/copy-email";
import { Section, SectionHeading } from "@/components/section";
import { ResumeLink } from "@/components/resume-link";
import { site } from "@/content/site";
import { tap, textAction } from "@/lib/ui";

/** "Tesla 2023 to now · Waymo 2022 to 2023 · …", newest start first, from site.experience. */
export function careerPath(): string {
  const stints = site.experience.flatMap(({ company, roles }) =>
    roles.flatMap(({ dates }) => {
      const years = dates.match(/\d{4}/g);
      if (!years) return [];
      const start = years[0];
      const end = /present/i.test(dates) ? "now" : (years[1] ?? start);
      return [{ company, start, end }];
    }),
  );
  stints.sort((a, b) => Number(b.start) - Number(a.start));
  return stints
    .map(({ company, start, end }) =>
      start === end ? `${company} ${start}` : `${company} ${start} to ${end}`,
    )
    .join(" · ");
}

export function About() {
  const { email, linkedin } = site.contact;

  return (
    <Section id="about">
      <span id="approach" className="block scroll-mt-24" />
      <span id="contact" className="block scroll-mt-24" />
      <SectionHeading title={site.sections.about.title} />
      <div className="space-y-4">
        {[...site.about.bio, site.contact.intro].map((paragraph) => (
          <p
            key={paragraph}
            className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]"
          >
            {paragraph}
          </p>
        ))}
        <p
          data-testid="career-path"
          className="text-muted-foreground measure text-small"
        >
          {careerPath()}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <a
          href={`mailto:${email}`}
          className={`${tap} min-w-0 font-medium break-all`}
        >
          {email}
        </a>
        <CopyEmail email={email} />
      </div>
      <div className="flex flex-wrap gap-x-6">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={textAction}
        >
          LinkedIn
          <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
        </a>
        <ResumeLink />
      </div>
    </Section>
  );
}
