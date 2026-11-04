import { describe, expect, it } from "vitest";
import * as ui from "@/lib/ui";

describe("ui class recipes", () => {
  it("exports only the four recipes components import", () => {
    // tapCenter and btn are the composition primitives behind these; nothing
    // outside this module imports them, so they stay private.
    expect(Object.keys(ui).sort()).toEqual([
      "btnGhost",
      "btnPrimary",
      "tap",
      "textAction",
    ]);
  });

  it("keeps the tap target floor in every recipe", () => {
    for (const recipe of [ui.tap, ui.btnPrimary, ui.btnGhost, ui.textAction]) {
      expect(recipe).toContain("min-h-11");
    }
  });
});
