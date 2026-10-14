import { MetricText } from "@/components/metric-text";
import { Section, SectionHeading } from "@/components/section";
import { Highlights } from "@/components/sections/highlights";
import { site } from "@/content/site";

export function Experience() {
  return (
    <Section id="experience" className="bg-muted/50">
      <SectionHeading
        eyebrow={site.sections.experience.eyebrow}
        title={site.sections.experience.title}
        description={site.sections.experience.description}
      />
      <Highlights />

      <ol className="space-y-12">
        {site.experience.map((employer) => (
          <li
            key={employer.company}
            className="reveal border-border border-t pt-8"
          >
            <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
              {employer.company}
            </h3>
            {employer.note ? (
              <p className="text-muted-foreground mt-1 text-[0.9375rem]">
                {employer.note}
              </p>
            ) : null}
            <div className="mt-6 space-y-10">
              {employer.roles.map((role) => (
                <div key={role.dates}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h4 className="text-accent text-[0.9375rem] font-medium">
                      {role.title}
                    </h4>
                    <p className="text-muted-foreground font-mono-label">
                      {role.dates}
                    </p>
                  </div>
                  {role.summary ? (
                    <p className="text-muted-foreground measure mt-3 text-lg leading-relaxed">
                      {role.summary}
                    </p>
                  ) : null}
                  <ul className="measure mt-5 space-y-3">
                    {role.bullets.map((bullet) => (
                      <li
                        key={bullet.text}
                        className="text-muted-foreground text-lg leading-relaxed"
                      >
                        <MetricText text={bullet.text} metric={bullet.metric} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
