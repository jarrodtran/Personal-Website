import { readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import {
  extractFigures,
  findBannedFraming,
  getProofCopy,
  stripOfficialTitles,
} from "@/content/visitor-copy";

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

function flatResume(): string {
  return resumeText()
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ");
}

/** Site figures not in public/resume.pdf, with Jarrod-confirmed sources. */
const sourcedFigures: Record<string, string> = {
  "293%": "unit growth from 4.3M to 16.9M",
  "540": "burden cost estimates times hours saved",
};

describe("number ledger", () => {
  const resumeFigures = new Set(extractFigures(resumeText()));

  it("reads real figures from the résumé source", () => {
    for (const figure of ["1,000+", "$156M", "$260M", "3.2×"]) {
      expect(resumeFigures).toContain(figure);
    }
  });

  // rule:metric-ledger
  it("only shows figures that appear in the résumé or have a recorded source", () => {
    const untraced = extractFigures(getProofCopy()).filter(
      (figure) => !resumeFigures.has(figure) && !sourcedFigures[figure],
    );
    expect(untraced).toEqual([]);
  });

  it("catches figures the résumé does not support", () => {
    const untraced = extractFigures(
      "56% more throughput. −26% cost. Deployment 2.1×.",
    ).filter((figure) => !resumeFigures.has(figure));
    expect(untraced).toEqual(["56%", "26%", "2.1×"]);
  });

  it("keeps incremental profit and annualized savings in separate sentences", () => {
    const text = flatResume();
    expect(text).toContain("Lead, AI Enablement & Factory Strategy");
    expect(text).toContain(
      "Allocated $23M across 50+ initiatives for $156M in incremental annual profit.",
    );
    expect(text).toContain(
      "A separate program delivered $260M in annualized savings.",
    );
    for (const sentence of text.split(/(?<=\.)\s+/)) {
      expect(sentence.includes("$156M") && sentence.includes("$260M")).toBe(
        false,
      );
      expect(sentence.includes("$23M") && sentence.includes("$260M")).toBe(
        false,
      );
    }
  });

  it("keeps the recorded employers, dates, and education", () => {
    const text = flatResume();
    for (const fact of [
      "Aug 2023 - Present",
      "Rejoined in 2023 after Apple and Waymo.",
      "Strategy & Operations Manager",
      "Oct 2022 - May 2023",
      "Strategic Operations Program Manager",
      "Jun 2021 - Jun 2022",
      "Program Manager, Special Projects",
      "Jun 2018 - Jun 2021",
      "Operations Area Manager",
      "Mar 2017 - Apr 2018",
      "University at Buffalo",
      "B.S. Business Administration, Finance",
      "Cum Laude",
      "RAG troubleshooting",
      "Houston, TX",
    ]) {
      expect(text, fact).toContain(fact);
    }
  });

  it("does not add factory framing or dash characters outside the official title", () => {
    const text = flatResume();
    expect(findBannedFraming(stripOfficialTitles(text))).toEqual([]);
    expect(text).not.toContain("\u2014");
    expect(text).not.toContain("\u2013");
    expect(text).not.toContain("cost-down");
    expect(text).not.toContain("Energy Manufacturing");
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
