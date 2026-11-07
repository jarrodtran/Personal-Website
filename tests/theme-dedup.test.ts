import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hexRgb, palette } from "@/lib/palette";
import { relativeLuminance, themes } from "@/lib/theme";

describe("palette and theme single source of truth", () => {
  it("exports hexRgb from lib/palette.ts and reuses it in lib/theme.ts without duplicating bit-shifts", () => {
    expect(typeof hexRgb).toBe("function");
    expect(hexRgb("#112233")).toEqual([0x11, 0x22, 0x33]);

    const themeSource = readFileSync(
      path.resolve(__dirname, "../lib/theme.ts"),
      "utf8",
    );
    expect(themeSource).toContain("hexRgb");
    expect(themeSource).not.toContain("Number.parseInt");
    expect((themeSource.match(/accentForeground:/g) ?? [])).toHaveLength(1);
  });

  it("derives light and dark themes identically from palette tokens", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(themes[mode]).toEqual({
        background: palette[mode].bg,
        foreground: palette[mode].fg,
        muted: palette[mode].muted,
        mutedForeground: palette[mode].mutedForeground,
        border: palette[mode].border,
        card: palette[mode].card,
        accent: palette[mode].accent,
        accentHover: palette[mode].accentHover,
        accentForeground: palette[mode].accentForeground,
        ring: palette[mode].accent,
      });
    }
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });
});
