import { site, siteUrl } from "@/content/site";

export function buildLlmsTxt(): string {
  const {
    positioning,
    substack,
    about,
    selectedWork,
    experience,
    principles,
    contact,
  } = site;

  const lines: string[] = [
    `# ${positioning.name}`,
    "",
    `> ${positioning.valueProp}`,
    "",
    `${positioning.headline} Based in ${positioning.location}.`,
    "",
    `## ${site.sections.about.title}`,
    "",
    ...about.bio,
    "",
    `Education: ${about.education}`,
    "",
    `## ${site.sections.work.title}`,
    "",
    ...selectedWork.map(
      (item) =>
        `- [${item.title}](${siteUrl}/work/${item.slug}/): ${item.panel.value} (${item.panel.label}). ${item.problem} ${item.outcome}`,
    ),
    "",
    `## ${site.sections.experience.title}`,
    "",
    ...experience.flatMap((employer) => [
      `### ${employer.company}`,
      ...(employer.note ? [employer.note] : []),
      ...employer.roles.flatMap((role) => [
        "",
        `#### ${role.title} (${role.dates})`,
        ...(role.summary ? [role.summary] : []),
        ...role.bullets.map((bullet) => `- ${bullet.text}`),
      ]),
      "",
    ]),
    `## ${site.sections.approach.title}`,
    "",
    ...principles.map(
      (principle, index) =>
        `${index + 1}. **${principle.title}**: ${principle.description}`,
    ),
    "",
    "## Writing",
    "",
    `- [${substack.name}](${substack.url})`,
    "",
    "## Contact",
    "",
    contact.intro,
    "",
    `- Email: [mailto:${contact.email}](mailto:${contact.email})`,
    `- LinkedIn: [${contact.linkedin}](${contact.linkedin})`,
    `- Résumé: [${siteUrl}${contact.resumeHref}](${siteUrl}${contact.resumeHref})`,
    ...(contact.calendar
      ? [`- Calendar: [${contact.calendar}](${contact.calendar})`]
      : []),
    "",
  ];

  return lines.join("\n");
}
