import Image from "next/image";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function About() {
  return (
    <Section id="about">
      <div className="grid items-start gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <SectionHeading
            eyebrow={site.sections.about.eyebrow}
            title={site.sections.about.title}
          />
          <div className="text-muted-foreground space-y-4 text-base leading-relaxed">
            {site.about.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <div className="reveal border-border mt-10 border-t pt-8">
            <p className="text-accent font-mono-label">
              What I&apos;m looking for next
            </p>
            <p className="text-foreground mt-3 text-sm leading-relaxed">
              {site.about.lookingForIntro}
            </p>
            <ul className="mt-5 space-y-3">
              {site.about.lookingFor.map((item) => (
                <li
                  key={item}
                  className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
                >
                  <span className="bg-accent mt-2 size-1 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="reveal lg:sticky lg:top-28">
          <div className="border-border max-w-sm overflow-hidden border lg:max-w-none">
            <Image
              src={site.about.photo.src}
              alt={site.about.photo.alt}
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover saturate-[0.9]"
            />
          </div>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {site.positioning.location}
            <span aria-hidden="true"> · </span>
            {site.about.education}
          </p>
          <ul className="border-border mt-8 space-y-0 border-t">
            {site.about.strengths.map((strength) => (
              <li
                key={strength}
                className="border-border py-3.5 text-sm leading-relaxed not-last:border-b"
              >
                {strength}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
