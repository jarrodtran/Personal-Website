import Image from "next/image";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";

export function About() {
  return (
    <Section id="about">
      <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <SectionHeading
            eyebrow={site.sections.about.eyebrow}
            title={site.sections.about.title}
          />
          <p className="text-muted-foreground measure text-[1.0625rem] leading-relaxed">
            {site.about.bio.join(" ")}
          </p>
        </div>

        <div className="reveal lg:sticky lg:top-28">
          <div className="border-border max-w-sm overflow-hidden border lg:max-w-none">
            <Image
              src={withBasePath(site.about.photo.src)}
              alt={site.about.photo.alt}
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <p className="text-muted-foreground mt-4 text-[0.9375rem] leading-relaxed">
            {site.positioning.location}
            <span aria-hidden="true"> · </span>
            {site.about.education}
          </p>
        </div>
      </div>
    </Section>
  );
}
