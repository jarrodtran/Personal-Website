/** Hex tokens used by CSS and the contrast contract. */
export const themes = {
  light: {
    background: "#F3EFE6",
    foreground: "#1B1914",
    muted: "#E8E3D8",
    mutedForeground: "#4E4940",
    border: "#C9C2B4",
    card: "#F8F5EE",
    accent: "#1E3A5F",
    accentHover: "#162C48",
    accentForeground: "#F7F3EA",
    ring: "#1E3A5F",
  },
  dark: {
    background: "#12151C",
    foreground: "#EDE9E0",
    muted: "#1C212B",
    mutedForeground: "#B4AFA4",
    border: "#3A4150",
    card: "#191E28",
    accent: "#9BB6D4",
    accentHover: "#B4C9E0",
    accentForeground: "#10141B",
    ring: "#9BB6D4",
  },
} as const;

export type ThemeName = keyof typeof themes;

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const [hi, lo] = first > second ? [first, second] : [second, first];
  return (hi + 0.05) / (lo + 0.05);
}
