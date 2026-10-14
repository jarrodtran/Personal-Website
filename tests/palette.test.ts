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
  ["card", "card"],
  ["accent", "accent"],
  ["accent-hover", "accentHover"],
  ["accent-foreground", "accentForeground"],
] as const;

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function cssBlock(css: string, start: string, end: string): string {
  return css.slice(css.indexOf(start), css.indexOf(end));
}

function cssToken(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  return match?.[1]?.toLowerCase();
}

describe("shared palette lock", () => {
  it("imports icon and OG colors from the palette module with no color literals", () => {
    for (const file of COLOR_FILES) {
      const source = readSiteFile(file);
      expect(source, file).toMatch(/from ["']@\/lib\/palette["']/);
      expect(source.match(HEX_OR_RGB) ?? [], file).toEqual([]);
    }
  });

  it("keeps globals.css palette tokens in lockstep with the palette module", async () => {
    const { palette } = await import("@/lib/palette");
    const css = readSiteFile("app/globals.css");
    const rootBlock = cssBlock(css, "\n:root", "\n.dark");
    const darkBlock = cssBlock(css, "\n.dark", "\n@theme");

    for (const [cssName, paletteKey] of CSS_TO_PALETTE) {
      expect(cssToken(rootBlock, cssName), `light ${cssName}`).toBe(
        palette.light[paletteKey].toLowerCase(),
      );
      expect(cssToken(darkBlock, cssName), `dark ${cssName}`).toBe(
        palette.dark[paletteKey].toLowerCase(),
      );
    }
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
