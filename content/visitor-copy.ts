import { site } from "@/content/site";

/** Framing that must not appear in visitor-facing copy. */
export const BANNED_FRAMING_TOKENS = [
  "factory",
  "manufacturing",
  "manufactured",
  "mass production",
  "shop floor",
  "GWh",
  "unit cost",
  "cost per unit",
  "supplier",
  "logistics",
  "battery-cell",
  "Energy Manufacturing",
] as const;

const SKIP_KEYS = new Set([
  "headlineVariants",
  "audiences",
  "outreach",
  "href",
  "src",
  "email",
  "phone",
  "linkedin",
  "github",
  "resumeHref",
  "resumeFilename",
  "calendar",
]);

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => {
      if (SKIP_KEYS.has(key)) {
        return [];
      }
      return collectStrings(nested);
    });
  }
  return [];
}

/** Every visitor-facing string the site content module ships. */
export function getVisitorFacingCopy(): string {
  return collectStrings(site).join("\n");
}

/** Official job titles are facts and may contain “Factory”; narrative copy may not. */
export function officialTitles(): string[] {
  return [
    site.positioning.currentRole,
    ...site.experience.flatMap((employer) =>
      employer.roles.map((role) => role.title),
    ),
  ];
}

export function stripOfficialTitles(text: string): string {
  return officialTitles().reduce(
    (next, title) => next.split(title).join(" "),
    text,
  );
}

/** Every claim-bearing surface: numbers here must trace to the résumé. */
export function getProofCopy(): string {
  const {
    highlights,
    experience,
    selectedWork,
    principles,
    about,
    positioning,
  } = site;
  return collectStrings({
    highlights,
    experience,
    selectedWork,
    principles,
    about,
    positioning,
  }).join("\n");
}

/**
 * Normalized figures (e.g. "$156M", "3.2×", "1,000+", "293%") in a block of
 * text. "0→1" is a phrase, not a figure, and a trailing "x" multiplier is
 * treated as "×" so résumé and site spellings compare equal.
 */
export function extractFigures(text: string): string[] {
  const cleaned = text.replaceAll("0→1", " ").replace(/(\d)x\b/g, "$1×");
  const matches =
    cleaned.match(/\$?\d+(?:[.,]\d+)*(?:[%×+]|[MBK](?![a-z]))?/g) ?? [];
  return [...new Set(matches)];
}

export function findBannedFraming(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_FRAMING_TOKENS.filter((token) =>
    lower.includes(token.toLowerCase()),
  );
}
