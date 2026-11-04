import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/footer";
import { site } from "@/content/site";

describe("footer and site content restraint", () => {
  it("renders Footer with copyright and location from site.positioning without hardcoded employer taglines", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain(site.positioning.name);
    expect(html).toContain(site.positioning.location);
    expect(html).not.toContain("Tesla");
    expect(html).not.toContain("Apple");
    expect(html).not.toContain("Waymo");
  });

  it("drops unused talks, currentCompany, and phone fields from site content", () => {
    expect(site).not.toHaveProperty("talks");
    expect(site.positioning).not.toHaveProperty("currentCompany");
    expect(site.contact).not.toHaveProperty("phone");

    const source = readFileSync(
      path.resolve(__dirname, "../content/site.ts"),
      "utf8",
    );
    expect(source).not.toContain("currentCompany");
    expect(source).not.toContain("talks:");
    expect(source).not.toContain("phone:");
  });
});
