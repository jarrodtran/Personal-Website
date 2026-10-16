import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, themes } from "@/lib/theme";

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function hasToken(block: string, name: string, hex: string): boolean {
  const pattern = new RegExp(
    `--${name}:\\s*${hex.replace("#", "#").toLowerCase()}`,
    "i",
  );
  return pattern.test(block);
}

describe("theme contrast", () => {
  it("keeps CSS tokens aligned with the contrast ledger", () => {
    const root = css.slice(css.indexOf("\n:root"), css.indexOf("\n.dark"));
    const dark = css.slice(css.indexOf("\n.dark"), css.indexOf("\n@media"));

    expect(hasToken(root, "background", themes.light.background)).toBe(true);
    expect(hasToken(root, "foreground", themes.light.foreground)).toBe(true);
    expect(hasToken(root, "muted", themes.light.muted)).toBe(true);
    expect(
      hasToken(root, "muted-foreground", themes.light.mutedForeground),
    ).toBe(true);
    expect(hasToken(root, "border", themes.light.border)).toBe(true);
    expect(hasToken(root, "card", themes.light.card)).toBe(true);
    expect(hasToken(root, "accent", themes.light.accent)).toBe(true);
    expect(hasToken(root, "accent-hover", themes.light.accentHover)).toBe(true);
    expect(
      hasToken(root, "accent-foreground", themes.light.accentForeground),
    ).toBe(true);

    expect(hasToken(dark, "background", themes.dark.background)).toBe(true);
    expect(hasToken(dark, "foreground", themes.dark.foreground)).toBe(true);
    expect(hasToken(dark, "muted", themes.dark.muted)).toBe(true);
    expect(
      hasToken(dark, "muted-foreground", themes.dark.mutedForeground),
    ).toBe(true);
    expect(hasToken(dark, "border", themes.dark.border)).toBe(true);
    expect(hasToken(dark, "card", themes.dark.card)).toBe(true);
    expect(hasToken(dark, "accent", themes.dark.accent)).toBe(true);
    expect(hasToken(dark, "accent-hover", themes.dark.accentHover)).toBe(true);
    expect(
      hasToken(dark, "accent-foreground", themes.dark.accentForeground),
    ).toBe(true);
  });

  it("meets WCAG AA for body text and large text in both themes", () => {
    for (const theme of Object.values(themes)) {
      expect(
        contrastRatio(theme.foreground, theme.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.mutedForeground, theme.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.accent, theme.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.accentForeground, theme.accent),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.foreground, theme.background),
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("underlines body-text links at 1px with a 3px offset", () => {
    expect(css).toMatch(/main p a/);
    expect(css).toMatch(/text-decoration-thickness:\s*1px/);
    expect(css).toMatch(/text-underline-offset:\s*3px/);
  });

  it("draws the theme toggle border in the muted color", () => {
    const toggle = readFileSync(
      path.resolve(__dirname, "../components/theme-toggle.tsx"),
      "utf8",
    );
    expect(toggle).toContain("border-muted-foreground");
    expect(toggle).not.toContain("border-border");
  });
});
