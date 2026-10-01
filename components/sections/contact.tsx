import { CopyEmail } from "@/components/copy-email";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

const link = "text-foreground hover:text-accent font-medium transition-colors";

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 px-5 py-4 sm:grid-cols-[6.5rem_1fr] sm:items-baseline sm:gap-4 sm:px-6">
      <dt className="text-muted-foreground font-mono-label">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
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
          description={site.positioning.targetingLine}
        />
        <dl className="border-border bg-card divide-border divide-y rounded-sm border">
          <ContactRow label="Email">
            <a href={`mailto:${email}`} className={link}>
              {email}
            </a>
            <CopyEmail email={email} />
          </ContactRow>
          <ContactRow label="LinkedIn">
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className={link}
            >
              {linkedin.replace(/^https?:\/\/(?:www\.)?|\/$/g, "")}
            </a>
          </ContactRow>
          <ContactRow label="Résumé">
            <a href={resumeHref} download={resumeFilename} className={link}>
              Download résumé (PDF)
            </a>
          </ContactRow>
          {calendar ? (
            <ContactRow label="Calendar">
              <a
                href={calendar}
                target="_blank"
                rel="noreferrer"
                className={link}
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
