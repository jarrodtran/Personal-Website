import { CopyEmail } from "@/components/copy-email";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { tap, textAction } from "@/lib/ui";

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[6.5rem_1fr] sm:items-center sm:gap-4 sm:px-6">
      <dt className="text-muted-foreground font-mono-label">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-x-4">
        {children}
      </dd>
    </div>
  );
}

export function Contact() {
  const { email, linkedin, resumeHref, resumeFilename, calendar } =
    site.contact;

  return (
    <Section id="contact" className="bg-muted/50">
      <div className="grid items-start gap-x-14 lg:grid-cols-2">
        <SectionHeading
          eyebrow={site.sections.contact.eyebrow}
          title={site.sections.contact.title}
          description={site.sections.contact.description}
        />
        <dl className="border-border bg-card divide-border divide-y border">
          <ContactRow label="Email">
            <a
              href={`mailto:${email}`}
              className={`${tap} min-w-0 font-medium break-all`}
            >
              {email}
            </a>
            <CopyEmail email={email} />
          </ContactRow>
          <ContactRow label="LinkedIn">
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className={`${tap} min-w-0 font-medium break-all`}
            >
              {linkedin.replace(/^https?:\/\/(?:www\.)?|\/$/g, "")}
            </a>
          </ContactRow>
          <ContactRow label="Speaking">
            <a
              href={`mailto:${email}?subject=Speaking%20invitation`}
              className={textAction}
            >
              Invite me to speak
            </a>
          </ContactRow>
          <ContactRow label="Résumé">
            <a
              href={withBasePath(resumeHref)}
              download={resumeFilename}
              className={`${tap} text-muted-foreground text-[0.9375rem]`}
            >
              Résumé
            </a>
          </ContactRow>
          {calendar ? (
            <ContactRow label="Calendar">
              <a
                href={calendar}
                target="_blank"
                rel="noreferrer"
                className={textAction}
              >
                Book a call
              </a>
            </ContactRow>
          ) : null}
        </dl>
      </div>
    </Section>
  );
}
