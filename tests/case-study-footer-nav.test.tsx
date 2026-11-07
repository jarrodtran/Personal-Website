import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaseStudyBody } from "@/components/sections/case-study";
import { nextSelectedWork, site } from "@/content/site";

const entities: Record<string, string> = {
  "&amp;": "&",
  "&#x27;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
};

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|#x27|quot|lt|gt);/g, (entity) => entities[entity])
    .replace(/\s+/g, " ")
    .trim();
}

describe("case study footer next link", () => {
  it("places Next: {title} in the article footer after My role and Back to selected work", () => {
    for (const item of site.selectedWork) {
      const html = renderToStaticMarkup(<CaseStudyBody item={item} />);
      const text = textOf(html);
      const next = nextSelectedWork(item.slug);
      expect(next).toBeDefined();

      const lastRoleBullet =
        item.caseStudy.role[item.caseStudy.role.length - 1];
      const nextAt = text.indexOf(`Next: ${next!.title}`);
      expect(nextAt).toBeGreaterThan(text.lastIndexOf(lastRoleBullet));
      expect(nextAt).toBeGreaterThan(text.lastIndexOf("Back to selected work"));
    }
  });
});
