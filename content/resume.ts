import data from "./resume.json";

/**
 * Typed view of content/resume.json, the one source for the résumé. The PDF
 * builder (scripts/build-resume-pdf.mjs) reads the same file, so edit the JSON
 * and run `node scripts/build-resume-pdf.mjs`.
 */
export interface ResumeBullet {
  text: string;
  metric?: string;
  /** Web wording when the PDF text cannot be shown on the site (banned-phrase rule). */
  webText?: string;
  /** Optional sub-label printed before this bullet's group. */
  group?: string;
}

export interface ResumeRole {
  /** Employer key. Roles with the same company group under one employer. */
  company: string;
  /** Name printed in the PDF role heading when it differs from `company`. */
  heading?: string;
  title: string;
  dates: string;
  location: string;
  note?: string;
  summary?: string;
  bullets: ResumeBullet[];
  /** PDF prints only the heading and dates. The web page prints everything. */
  pdfTitleOnly?: boolean;
}

export interface ResumeData {
  name: string;
  headline: string;
  contact: { text: string; href?: string }[];
  summary: string[];
  /** Optional compact skills lines, rendered after Summary when present. */
  skills?: { label: string; items: string[] }[];
  /** Newest first, as printed on the PDF. */
  roles: ResumeRole[];
  education: { school: string; degree: string; honors?: string }[];
}

export const resume = data as ResumeData;

/** The bullet as shown on the web: `webText` stands in for `text` when set. */
export function webBullet({ webText, ...bullet }: ResumeBullet): ResumeBullet {
  return webText ? { ...bullet, text: webText } : bullet;
}

/** Employers in order of first appearance, each holding its roles. */
export function resumeExperience() {
  const employers: {
    company: string;
    note?: string;
    roles: {
      title: string;
      dates: string;
      location: string;
      summary?: string;
      bullets: ResumeBullet[];
    }[];
  }[] = [];
  for (const role of resume.roles) {
    const { company, note } = role;
    let employer = employers.find((item) => item.company === company);
    if (!employer) {
      employer = { company, roles: [] };
      employers.push(employer);
    }
    if (note) employer.note = note;
    employer.roles.push({
      title: role.title,
      dates: role.dates,
      location: role.location,
      ...(role.summary ? { summary: role.summary } : {}),
      bullets: role.bullets.map(webBullet),
    });
  }
  return employers;
}
