import { describe, expect, it } from "vitest";
import { resume } from "@/content/resume";
import {
  buildResumePdf,
  documentBlocks,
  normalizeText,
  render,
  toPdfResume,
} from "../scripts/build-resume-pdf.mjs";

const sample = {
  ...resume,
  skills: [
    {
      label: "AI enablement",
      items: ["RAG assistants", "adoption reporting", "use-case ranking"],
    },
    {
      label: "Strategy",
      items: ["ROI modeling", "portfolio funding", "program management"],
    },
  ],
  // The shipped page is full, so the sample drops one role to leave room.
  roles: resume.roles
    .filter((role) => role.title !== "Program Manager, Special Projects")
    .map((role, index) =>
      index === 0
        ? {
            ...role,
            bullets: role.bullets.map((bullet, i) => ({
              ...bullet,
              group: i < 3 ? "AI enablement" : "Strategy and investment",
            })),
          }
        : role,
    ),
};

const kindsOf = (blocks: { kind: string }[]) => blocks.map((b) => b.kind);

describe("résumé PDF builder", () => {
  it("normalizes typographic marks for WinAnsi", () => {
    expect(normalizeText("Tesla’s 3.2× “scale”")).toBe('Tesla\'s 3.2x "scale"');
  });

  it("prints no Amazon bullets but keeps them in the data", () => {
    const amazon = resume.roles.find((role) => role.company === "Amazon");
    expect(amazon?.bullets.length).toBeGreaterThan(0);
    const printed = toPdfResume(resume).roles.find(
      (role: { company: string }) => role.company === "Amazon",
    );
    expect(printed?.bullets).toEqual([]);
  });

  it("renders the shared data on one page", () => {
    const { bottom } = render(documentBlocks(toPdfResume(resume)));
    expect(bottom).toBeGreaterThanOrEqual(34);
  });

  it("renders no Skills row, and prints the Tesla group labels", () => {
    const kinds = kindsOf(documentBlocks(toPdfResume(resume)));
    expect(kinds).not.toContain("skills");
    expect(kinds.filter((kind) => kind === "group")).toHaveLength(2);
  });

  it("renders skills and group labels and still fits one page", () => {
    const blocks = documentBlocks(toPdfResume(sample));
    const kinds = kindsOf(blocks);
    expect(kinds).toContain("skills");
    expect(kinds.filter((kind) => kind === "group")).toHaveLength(2);
    expect(kinds.indexOf("skills")).toBeLessThan(kinds.indexOf("job"));
    const { bottom, stream } = render(blocks);
    expect(bottom).toBeGreaterThanOrEqual(34);
    expect(stream).toContain("(Skills)");
    expect(stream).toContain("(AI enablement)");
    expect(stream).toContain("(Strategy and investment)");
    const pdf = buildResumePdf(toPdfResume(sample));
    expect(pdf.toString("latin1")).toContain("/Count 1");
  });

  it("throws when content overflows the sheet", () => {
    const long = {
      ...resume,
      summary: Array.from({ length: 12 }, () => resume.summary[0]),
    };
    expect(() => render(documentBlocks(toPdfResume(long)))).toThrow(
      /overflows/,
    );
  });
});
