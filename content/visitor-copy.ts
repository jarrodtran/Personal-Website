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
  "formEndpoint",
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
    ...site.roles.map((role) => role.title),
  ];
}

export function stripOfficialTitles(text: string): string {
  return officialTitles().reduce(
    (next, title) => next.split(title).join(" "),
    text,
  );
}

export function findBannedFraming(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_FRAMING_TOKENS.filter((token) =>
    lower.includes(token.toLowerCase()),
  );
}
