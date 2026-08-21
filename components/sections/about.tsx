import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function About() {
  return (
    <Section id="about">
      <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <SectionHeading
            eyebrow="Profile"
            title={`About ${site.positioning.name.split(" ")[0]}`}
          />
          <div className="text-muted-foreground space-y-4 text-base leading-relaxed">
            {site.about.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <Reveal delay={0.08}>
            <div className="border-border bg-card mt-8 rounded-2xl border p-6 shadow-[var(--shadow-card)]">
              <p className="text-accent text-xs font-medium tracking-[0.16em] uppercase">
                What I&apos;m looking for next
              </p>
              <p className="text-foreground mt-3 text-sm leading-relaxed">
                {site.about.lookingForIntro}
              </p>
              <ul className="mt-4 space-y-2">
                {site.about.lookingFor.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex gap-2 text-sm leading-relaxed"
                  >
                    <span className="bg-accent mt-2 size-1 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="lg:sticky lg:top-28">
            <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]">
              <Image
                src={site.about.photo.src}
                alt={site.about.photo.alt}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
                priority
              />
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              {site.positioning.location}
              <span aria-hidden="true"> · </span>
              {site.about.education}
            </p>
            <ul className="mt-6 space-y-3">
              {site.about.strengths.map((strength) => (
                <li
                  key={strength}
                  className="border-border bg-card rounded-xl border px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow-card)]"
                >
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
