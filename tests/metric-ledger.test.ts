import { readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { extractFigures, getProofCopy } from "@/content/visitor-copy";

const root = path.resolve(__dirname, "..");

/** Visible résumé text from the committed public/resume.pdf content stream. */
function resumeText(): string {
  const pdf = readFileSync(path.join(root, "public/resume.pdf"));
  const marker = Buffer.from("stream\n");
  const start = pdf.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const streamStart = start + marker.length;
  const end = pdf.indexOf(Buffer.from("endstream"), streamStart);
  expect(end).toBeGreaterThan(streamStart);
  let blob = pdf.subarray(streamStart, end);
  if (blob.at(-1) === 0x0a) blob = blob.subarray(0, -1);
  const operators = inflateSync(blob).toString("latin1");
  const literals = operators.match(/\((?:\\.|[^\\)])*\)\s*Tj/g) ?? [];
  return literals
    .map((chunk) =>
      chunk
        .replace(/\)\s*Tj$/, "")
        .slice(1)
        .replace(/\\([\\()])/g, "$1"),
    )
    .join("\n");
}

describe("number ledger", () => {
  const resumeFigures = new Set(extractFigures(resumeText()));

  it("reads real figures from the résumé source", () => {
    for (const figure of ["1,000+", "$156M", "$260M", "3.2×"]) {
      expect(resumeFigures).toContain(figure);
    }
  });

  it("only shows figures that appear in the résumé", () => {
    const untraced = extractFigures(getProofCopy()).filter(
      (figure) => !resumeFigures.has(figure),
    );
    expect(untraced).toEqual(["540", "293%"]);
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
