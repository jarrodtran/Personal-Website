import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

const COLOR_FILES = ["app/icon.tsx", "lib/og.ts"] as const;
const HEX_OR_RGB =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\brgba?\s*\(/;

const CSS_TO_PALETTE = [
  ["background", "bg"],
  ["foreground", "fg"],
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

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function lightDarkPairs(
  css: string,
): Map<string, { light: string; dark: string }> {
  const pairs = new Map<string, { light: string; dark: string }>();
  const pattern =
    /--([a-z0-9-]+):\s*light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g;
  for (const match of css.matchAll(pattern)) {
    pairs.set(match[1], {
      light: match[2].toLowerCase(),
      dark: match[3].toLowerCase(),
    });
  }
  return pairs;
}

describe("shared palette lock", () => {
  // rule:shared-palette
  it("imports icon and OG colors from the palette module with no color literals", () => {
    for (const file of COLOR_FILES) {
      const source = readSiteFile(file);
      expect(source, file).toMatch(/from ["']@\/lib\/palette["']/);
      expect(source.match(HEX_OR_RGB) ?? [], file).toEqual([]);
    }
  });

  it("keeps globals.css palette tokens in lockstep with the palette module", async () => {
    const { palette } = await import("@/lib/palette");
    const pairs = lightDarkPairs(readSiteFile("app/globals.css"));

    for (const [cssName, paletteKey] of CSS_TO_PALETTE) {
      const pair = pairs.get(cssName);
      expect(pair?.light, `light ${cssName}`).toBe(
        palette.light[paletteKey].toLowerCase(),
      );
      expect(pair?.dark, `dark ${cssName}`).toBe(
        palette.dark[paletteKey].toLowerCase(),
      );
    }
  });

  it("paints both themes from light-dark() and leaves class overrides as color-scheme", () => {
    const css = readSiteFile("app/globals.css");
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(css).toMatch(/color-scheme:\s*light dark/);
    expect(css).toMatch(/\.light\s*\{\s*color-scheme:\s*light;\s*\}/);
    expect(css).toMatch(/\.dark\s*\{\s*color-scheme:\s*dark;\s*\}/);
  });

  it("maps icon and OG colors to the same pixels as before the extract", async () => {
    const { iconColors, ogColors } = await import("@/lib/palette");
    expect(iconColors.bg.toLowerCase()).toBe("#111111");
    expect(iconColors.fg.toLowerCase()).toBe("#ffffff");
    expect(ogColors.bg.toLowerCase()).toBe("#0a0a0a");
    expect(ogColors.fg.toLowerCase()).toBe("#f2f2f2");
    expect(ogColors.accent.toLowerCase()).toBe("#f2f2f2");
    expect(ogColors.muted).toBe("rgba(242,242,242,0.72)");
  });
});
