import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HowIWork } from "@/components/sections/how-i-work";
import { site } from "@/content/site";

const html = renderToStaticMarkup(<HowIWork />);
const text = html
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x27;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, " ")
  .trim();

describe("how I work", () => {
  it("lists every principle without an ordinal in front of it", () => {
    for (const principle of site.principles) {
      expect(text).toContain(principle.title);
    }
    expect(text).not.toMatch(/\b0[1-5]\b/);
  });

  it("is an unordered list, since the principles are not a sequence", () => {
    expect(html).toContain("<ul");
    expect(html).not.toContain("<ol");
  });
});
