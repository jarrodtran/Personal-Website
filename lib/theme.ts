import { palette } from "./palette";

/** Hex tokens used by CSS and the contrast contract. */
export const themes = {
  light: {
    background: palette.light.bg,
    foreground: palette.light.fg,
    muted: palette.light.muted,
    mutedForeground: palette.light.mutedForeground,
    border: palette.light.border,
    card: palette.light.card,
    accent: palette.light.accent,
    accentHover: palette.light.accentHover,
    accentForeground: palette.light.accentForeground,
    ring: palette.light.accent,
  },
  dark: {
    background: palette.dark.bg,
    foreground: palette.dark.fg,
    muted: palette.dark.muted,
    mutedForeground: palette.dark.mutedForeground,
    border: palette.dark.border,
    card: palette.dark.card,
    accent: palette.dark.accent,
    accentHover: palette.dark.accentHover,
    accentForeground: palette.dark.accentForeground,
    ring: palette.dark.accent,
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
