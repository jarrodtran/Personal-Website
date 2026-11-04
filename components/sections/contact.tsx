import { ArrowUpRight } from "lucide-react";
import { CopyEmail } from "@/components/copy-email";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { tap, textAction } from "@/lib/ui";

export function Contact() {
  const { email, linkedin, resumeHref, resumeFilename, calendar } =
    site.contact;

  return (
    <Section id="contact" className="bg-muted/50">
      <div className="grid items-start gap-x-14 lg:grid-cols-2">
        <SectionHeading title={site.sections.contact.title}>
          <p className="text-muted-foreground measure mt-4 text-lg leading-relaxed text-pretty">
            {site.contact.intro}
          </p>
        </SectionHeading>
        <ul className="border-border divide-border divide-y border-y">
          <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <a
              href={`mailto:${email}`}
              className={`${tap} min-w-0 font-medium break-all`}
            >
              {email}
            </a>
            <CopyEmail email={email} />
          </li>
          <li className="py-3">
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={`${tap} min-w-0 gap-1 font-medium break-all`}
            >
              {linkedin.replace(/^https?:\/\/(?:www\.)?|\/$/g, "")}
              <ArrowUpRight
                className="size-[16px] shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
          <li className="py-3">
            <a
              href={`mailto:${email}?subject=Speaking%20invitation`}
              className={textAction}
            >
              Invite me to speak
            </a>
          </li>
          <li className="py-3">
            <a
              href={withBasePath(resumeHref)}
              download={resumeFilename}
              className={textAction}
            >
              Résumé
            </a>
          </li>
          {calendar ? (
            <li className="py-3">
              <a
                href={calendar}
                target="_blank"
                rel="noopener noreferrer"
                className={textAction}
              >
                Book a call
                <ArrowUpRight
                  className="size-[16px] shrink-0"
                  aria-hidden="true"
                />
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </Section>
  );
}
