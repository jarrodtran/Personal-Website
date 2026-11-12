import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, themes } from "@/lib/theme";

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function tokenPair(
  source: string,
  name: string,
): { light: string; dark: string } | undefined {
  const match = source.match(
    new RegExp(
      `--${name}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{6})\\s*,\\s*(#[0-9a-fA-F]{6})\\s*\\)`,
      "i",
    ),
  );
  if (!match?.[1] || !match[2]) return undefined;
  return { light: match[1].toLowerCase(), dark: match[2].toLowerCase() };
}

const LEDGER = [
  ["background", "background"],
  ["foreground", "foreground"],
  ["muted", "muted"],
  ["muted-foreground", "mutedForeground"],
  ["border", "border"],
  ["border-control", "borderControl"],
  ["surface", "surface"],
  ["card", "card"],
  ["accent", "accent"],
  ["accent-hover", "accentHover"],
  ["accent-foreground", "accentForeground"],
] as const;

describe("theme contrast", () => {
  it("keeps CSS tokens aligned with the contrast ledger", () => {
    for (const [cssName, themeKey] of LEDGER) {
      const pair = tokenPair(css, cssName);
      expect(pair?.light, `light ${cssName}`).toBe(
        themes.light[themeKey].toLowerCase(),
      );
      expect(pair?.dark, `dark ${cssName}`).toBe(
        themes.dark[themeKey].toLowerCase(),
      );
    }
  });

  // rule:contrast-aa
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

  it("keeps --border-control at least 3:1 in both themes", () => {
    const border = tokenPair(css, "border-control");
    const background = tokenPair(css, "background");
    const card = tokenPair(css, "card");
    if (!border || !background || !card) {
      throw new Error("missing border-control, background, or card token");
    }
    for (const mode of ["light", "dark"] as const) {
      expect(
        contrastRatio(border[mode], background[mode]),
        `${mode} control on background`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(border[mode], card[mode]),
        `${mode} control on card`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(themes[mode].borderControl, themes[mode].background),
        `${mode} ledger on background`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(themes[mode].borderControl, themes[mode].card),
        `${mode} ledger on card`,
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
