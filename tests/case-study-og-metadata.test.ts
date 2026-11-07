import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/work/[slug]/page";
import { selectedWorkSlugs, site } from "@/content/site";

const root = path.resolve(__dirname, "..");

describe("case study OpenGraph metadata and arrow rendering", () => {
  it("preserves openGraph.siteName and openGraph.locale on every case study route", async () => {
    for (const slug of selectedWorkSlugs()) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });
      expect(metadata.openGraph).toMatchObject({
        type: "article",
        siteName: site.positioning.name,
        locale: "en_US",
      });
    }
  });

  it("renders the 0→1 arrow in IBM Plex Sans in the case study OG image so it does not collide with 1 in Instrument Serif", () => {
    const source = readFileSync(
      path.join(root, "app/work/[slug]/opengraph-image.tsx"),
      "utf8",
    );
    expect(source).toContain('split("→")');
  });
});
