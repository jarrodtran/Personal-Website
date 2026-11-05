import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { HowIWork } from "@/components/sections/how-i-work";

describe("home prose section surfaces", () => {
  it("renders Experience, Approach, and Contact without unpadded bg-muted/50 box fills inside the 40rem prose column", () => {
    for (const [id, markup] of [
      ["experience", renderToStaticMarkup(<Experience />)],
      ["approach", renderToStaticMarkup(<HowIWork />)],
      ["contact", renderToStaticMarkup(<Contact />)],
    ] as const) {
      expect(markup, `#${id} section exists`).toContain(`id="${id}"`);
      expect(
        markup,
        `#${id} should not paint an unpadded bg-muted/50 box inside the prose column`,
      ).not.toContain("bg-muted/50");
    }
  });
});
