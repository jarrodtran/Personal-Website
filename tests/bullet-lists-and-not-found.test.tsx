import { existsSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import { CaseStudyBody } from "@/components/sections/case-study";
import { Experience } from "@/components/sections/experience";
import { site } from "@/content/site";

describe("bullet list markers and 404 typography", () => {
  it("renders hanging disc markers on Experience and Case Study bullet lists", () => {
    const expHtml = renderToStaticMarkup(<Experience />);
    const expLists = [...expHtml.matchAll(/<ul class="([^"]*)"/g)].map(
      ([, cls]) => cls,
    );
    expect(expLists.length).toBeGreaterThan(0);
    for (const cls of expLists) {
      expect(cls).toContain("list-disc");
      expect(cls).toContain("pl-5");
    }

    const caseHtml = renderToStaticMarkup(
      <CaseStudyBody item={site.selectedWork[0]} />,
    );
    const caseLists = [...caseHtml.matchAll(/<ul class="([^"]*)"/g)].map(
      ([, cls]) => cls,
    );
    expect(caseLists).toHaveLength(3);
    for (const cls of caseLists) {
      expect(cls).toContain("list-disc");
      expect(cls).toContain("pl-5");
    }
  });

  it("uses 18px body text and responsive display heading scale on the 404 page and removes unused brand-icons", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toMatch(
      /<h1 class="[^"]*\bfont-display\b[^"]*\bleading-tight\b[^"]*\bsm:text-5xl\b/,
    );
    expect(html).toMatch(
      /<p class="[^"]*\bmeasure\b[^"]*\btext-lg\b[^"]*\bleading-relaxed\b/,
    );
    expect(
      existsSync(path.resolve(__dirname, "../components/brand-icons.tsx")),
    ).toBe(false);
  });
});
