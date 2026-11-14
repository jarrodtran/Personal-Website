import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Section, SectionHeading } from "@/components/section";
import { resume, webBullet, type ResumeBullet } from "@/content/resume";
import { site, siteUrl } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { btnPrimary, tap } from "@/lib/ui";

const path = "/resume/";
const title = "Résumé";
const description = `Experience and education for ${site.positioning.name}, with a one-page PDF to download.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "profile",
    url: `${siteUrl}${path}`,
    title: `${title} · ${site.positioning.name}`,
    description,
    siteName: site.positioning.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · ${site.positioning.name}`,
    description,
  },
};

const prose =
  "text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty";

/** Consecutive bullets that share a group label render under that label. */
function bulletGroups(bullets: ResumeBullet[]) {
  const groups: { label?: string; items: ResumeBullet[] }[] = [];
  for (const bullet of bullets) {
    const last = groups[groups.length - 1];
    if (last && last.label === bullet.group) last.items.push(bullet);
    else groups.push({ label: bullet.group, items: [bullet] });
  }
  return groups;
}

export default function ResumePage() {
  return (
    <div className="resume">
      <Section id="resume" className="border-t-0">
        <div className="max-w-3xl">
          <h1 className="font-display text-[length:var(--text-h1)] leading-[var(--leading-title)] tracking-tight text-balance">
            {resume.name}
          </h1>
          <p className="text-muted-foreground mt-2 text-[length:var(--text-body)]">
            {resume.headline}
          </p>
          <ul
            role="list"
            className="text-small text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4"
          >
            {resume.contact.map((part) => (
              <li key={part.text}>
                {part.href ? (
                  <a
                    href={part.href}
                    className={`${tap} hover:text-foreground break-all underline-offset-4 hover:underline`}
                  >
                    {part.text}
                  </a>
                ) : (
                  <span className={tap}>{part.text}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="no-print mt-5">
            <a
              href={withBasePath(site.contact.resumeHref)}
              download={site.contact.resumeFilename}
              className={btnPrimary}
            >
              <Download aria-hidden="true" className="size-4" />
              Download PDF
            </a>
          </p>
        </div>
      </Section>

      <Section id="summary">
        <div className="max-w-3xl">
          <SectionHeading title="Summary" />
          {resume.summary.map((paragraph) => (
            <p key={paragraph} className={prose}>
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      {resume.skills?.length ? (
        <Section id="skills">
          <div className="max-w-3xl">
            <SectionHeading title="Skills" />
            <dl className="text-[length:var(--text-body)] leading-[var(--leading-copy)]">
              {resume.skills.map((skill) => (
                <div key={skill.label} className="mt-2 first:mt-0">
                  <dt className="inline font-medium">{skill.label}: </dt>
                  <dd className="inline">{skill.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      ) : null}

      <Section id="experience">
        <div className="max-w-3xl">
          <SectionHeading title="Experience" />
          <div className="space-y-10">
            {resume.roles.map((role) => (
              <article
                key={`${role.company}-${role.dates}`}
                className="resume-role"
              >
                <h3 className="font-display text-[length:var(--text-h3)] leading-[var(--leading-title)] text-balance">
                  {role.heading ?? role.company}
                </h3>
                <p className="text-[length:var(--text-body)] font-medium">
                  {role.title}
                </p>
                <p className="text-muted-foreground text-small mt-1">
                  {role.location} · {role.dates}
                </p>
                {role.note ? (
                  <p className="text-muted-foreground text-small mt-1">
                    {role.note}
                  </p>
                ) : null}
                {role.summary ? (
                  <p className={`${prose} mt-3`}>{role.summary}</p>
                ) : null}
                {bulletGroups(role.bullets.map(webBullet)).map(
                  (group, index) => (
                    <div key={group.label ?? index} className="mt-3">
                      {group.label ? (
                        <p className="font-mono-label text-muted-foreground mb-2">
                          {group.label}
                        </p>
                      ) : null}
                      <ul
                        role="list"
                        className="text-foreground measure list-disc space-y-3 pl-5 text-[length:var(--text-body)] leading-[var(--leading-copy)]"
                      >
                        {group.items.map((bullet) => (
                          <li key={bullet.text}>{bullet.text}</li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section id="education">
        <div className="max-w-3xl">
          <SectionHeading title="Education" />
          {resume.education.map((entry) => (
            <p key={entry.school} className={prose}>
              <span className="font-medium">{entry.school}</span>
              <br />
              {[entry.degree, entry.honors].filter(Boolean).join(", ")}
            </p>
          ))}
        </div>
      </Section>
    </div>
  );
}
