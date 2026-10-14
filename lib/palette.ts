/** Palette A: the single hex source for CSS, the favicon, and OG images. */
export const palette = {
  light: {
    bg: "#ffffff",
    fg: "#111111",
    muted: "#f5f5f5",
    mutedForeground: "#555555",
    border: "#e5e5e5",
    card: "#fafafa",
    accent: "#111111",
    accentHover: "#333333",
    accentForeground: "#ffffff",
  },
  dark: {
    bg: "#0a0a0a",
    fg: "#f2f2f2",
    muted: "#171717",
    mutedForeground: "#a3a3a3",
    border: "#262626",
    card: "#121212",
    accent: "#f2f2f2",
    accentHover: "#d4d4d4",
    accentForeground: "#0a0a0a",
  },
} as const;

export type PaletteMode = keyof typeof palette;

function hexRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Favicon: light accent mark (#111111) with accent-foreground text. */
export const iconColors = {
  bg: palette.light.fg,
  fg: palette.light.accentForeground,
} as const;

/** OG images use the dark theme, with muted copy at 72% of foreground. */
export const ogColors = {
  bg: palette.dark.bg,
  fg: palette.dark.fg,
  accent: palette.dark.accent,
  muted: withAlpha(palette.dark.fg, 0.72),
} as const;
