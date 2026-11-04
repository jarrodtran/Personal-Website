import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Contact } from "@/components/sections/contact";

describe("contact restraint and section simplicity", () => {
  it("renders Contact as a hairline list without redundant secondary dt labels or boxed card chrome", () => {
    const html = renderToStaticMarkup(<Contact />);

    expect(html).toContain("<ul");
    expect(html).not.toContain("<dl");
    expect(html).not.toContain("<dt");
    expect(html).not.toContain("bg-card");

    for (const redundantLabel of [
      ">Email<",
      ">LinkedIn<",
      ">Speaking<",
      ">Calendar<",
    ]) {
      expect(html).not.toContain(redundantLabel);
    }

    // "Résumé" appears once as the download link text, not twice as label + link.
    expect(html.match(/Résumé/g) ?? []).toHaveLength(1);
  });

  it("keeps Section on a single contained path without an unused contained prop", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../components/section.tsx"),
      "utf8",
    );
    expect(source).not.toContain("contained");
  });
});
