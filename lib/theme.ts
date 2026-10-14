/** Hex tokens used by CSS and the contrast contract. */
export const themes = {
  light: {
    background: "#FFFFFF",
    foreground: "#111111",
    muted: "#F5F5F5",
    mutedForeground: "#555555",
    border: "#E5E5E5",
    card: "#FAFAFA",
    accent: "#111111",
    accentHover: "#333333",
    accentForeground: "#FFFFFF",
    ring: "#111111",
  },
  dark: {
    background: "#0A0A0A",
    foreground: "#F2F2F2",
    muted: "#171717",
    mutedForeground: "#A3A3A3",
    border: "#262626",
    card: "#121212",
    accent: "#F2F2F2",
    accentHover: "#D4D4D4",
    accentForeground: "#0A0A0A",
    ring: "#F2F2F2",
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
