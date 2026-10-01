import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { extractFigures, getProofCopy } from "@/content/visitor-copy";

const root = path.resolve(__dirname, "..");

/** Visible résumé text: string literals inside build()'s story in scripts/build-resume.py, which writes public/resume.pdf. */
function resumeText(): string {
  const source = readFileSync(
    path.join(root, "scripts/build-resume.py"),
    "utf8",
  );
  const start = source.indexOf("story = [");
  const end = source.indexOf("doc.build(story)");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const literals = source.slice(start, end).match(/"[^"\n]*"/g) ?? [];
  return literals
    .map((literal) => literal.slice(1, -1).replaceAll("&amp;", "&"))
    .join("\n");
}

describe("number ledger", () => {
  const resumeFigures = new Set(extractFigures(resumeText()));

  it("reads real figures from the résumé source", () => {
    for (const figure of ["1,000+", "$156M", "$260M", "293%", "3.2×"]) {
      expect(resumeFigures).toContain(figure);
    }
  });

  it("only shows figures that appear in the résumé", () => {
    const untraced = extractFigures(getProofCopy()).filter(
      (figure) => !resumeFigures.has(figure),
    );
    expect(untraced).toEqual([]);
  });

  it("catches figures the résumé does not support", () => {
    const untraced = extractFigures(
      "56% more throughput. −26% cost. Deployment 2.1×.",
    ).filter((figure) => !resumeFigures.has(figure));
    expect(untraced).toEqual(["56%", "26%", "2.1×"]);
  });

  it("highlights each metric bullet's figure inside its own text", () => {
    for (const employer of site.experience) {
      for (const role of employer.roles) {
        for (const bullet of role.bullets) {
          if (bullet.metric) expect(bullet.text).toContain(bullet.metric);
        }
      }
    }
  });
});
