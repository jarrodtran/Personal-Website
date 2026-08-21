import { MetricText } from "@/components/metric-text";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function Experience() {
  return (
    <Section id="experience" className="bg-muted/60">
      <SectionHeading
        eyebrow={site.sections.experience.eyebrow}
        title={site.sections.experience.title}
        description={site.sections.experience.description}
      />

      <ol className="border-border relative space-y-10 border-l pl-8 sm:pl-10">
        {site.roles.map((role, index) => (
          <Reveal key={`${role.company}-${role.dates}`} delay={index * 0.05}>
            <li className="relative">
              <span className="bg-accent ring-muted absolute top-1.5 -left-[37px] size-2.5 rounded-full ring-4 sm:-left-[45px]" />
              <div className="border-border bg-card rounded-2xl border p-6 shadow-[var(--shadow-card)] sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {role.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{role.dates}</p>
                </div>
                <p className="text-accent mt-1 text-sm font-medium">
                  {role.company}
                </p>
                {role.summary ? (
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {role.summary}
                  </p>
                ) : null}
                {role.bullets.length > 0 ? (
                  <ul className="mt-5 space-y-3">
                    {role.bullets.map((bullet) => (
                      <li
                        key={bullet.text}
                        className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
                      >
                        <span className="bg-foreground/30 mt-2 size-1 shrink-0 rounded-full" />
                        <span>
                          <MetricText
                            text={bullet.text}
                            metric={bullet.metric}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
