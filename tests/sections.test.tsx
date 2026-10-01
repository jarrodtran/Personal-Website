import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Experience } from "@/components/sections/experience";

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

function headings(html: string, tag: string): string[] {
  return [
    ...html.matchAll(new RegExp(`<${tag}\\b[^>]*>(.*?)</${tag}>`, "g")),
  ].map(([, inner]) => textOf(inner));
}

describe("experience", () => {
  const html = renderToStaticMarkup(<Experience />);

  it("lists each employer once, most recent first", () => {
    expect(headings(html, "h3")).toEqual(["Tesla", "Waymo", "Apple"]);
  });

  it("keeps both Tesla stints under one entry and says when Jarrod returned", () => {
    const tesla = html.slice(html.indexOf(">Tesla<"), html.indexOf(">Waymo<"));
    expect(headings(tesla, "h4")).toEqual([
      "Lead, AI Enablement & Factory Strategy",
      "Program Manager, Special Projects",
    ]);
    expect(textOf(tesla)).toContain("Rejoined in 2023 after Apple and Waymo.");
    expect(textOf(tesla)).toContain("Aug 2023 – Present");
    expect(textOf(tesla)).toContain("Jun 2018 – Jun 2021");
  });
});
