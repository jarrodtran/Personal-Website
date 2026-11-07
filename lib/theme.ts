import { hexRgb, palette, type PaletteMode } from "./palette";

function toTheme<M extends PaletteMode>(mode: M) {
  const p = palette[mode];
  return {
    background: p.bg,
    foreground: p.fg,
    muted: p.muted,
    mutedForeground: p.mutedForeground,
    border: p.border,
    card: p.card,
    accent: p.accent,
    accentHover: p.accentHover,
    accentForeground: p.accentForeground,
    ring: p.accent,
  } as const;
}

/** Hex tokens used by CSS and the contrast contract. */
export const themes = {
  light: toTheme("light"),
  dark: toTheme("dark"),
} as const;

export type ThemeName = keyof typeof themes;

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const [hi, lo] = first > second ? [first, second] : [second, first];
  return (hi + 0.05) / (lo + 0.05);
}
