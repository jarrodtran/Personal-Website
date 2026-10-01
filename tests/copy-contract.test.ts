import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "@/content/site";
import {
  BANNED_FRAMING_TOKENS,
  findBannedFraming,
  getVisitorFacingCopy,
  stripOfficialTitles,
} from "@/content/visitor-copy";

const root = path.resolve(__dirname, "..");

function readSiteFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("visitor-facing copy contract", () => {
  const copy = getVisitorFacingCopy();

  it("imports the shipped content module, not a duplicate fixture", () => {
    expect(copy).toContain(site.positioning.headline);
    expect(copy).toContain(site.positioning.valueProp);
    expect(copy).toContain(site.positioning.targetingLine);
    expect(copy).toContain(site.about.bio[0]);
    expect(copy).toContain(site.about.lookingForIntro);
    expect(copy).toContain(site.sections.experience.description);
    expect(copy).toContain(site.sections.work.description);
    expect(copy).toContain(site.sections.approach.description);
    expect(copy).toContain(site.sections.capabilities.description);
    expect(copy).toContain("1,000+");
    expect(copy).toContain("$1.6M");
    expect(copy.includes("$156M") || copy.includes("$260M")).toBe(true);
    expect(site.experience[0].roles[0].title.toLowerCase()).toContain(
      "ai enablement",
    );
  });

  it("states corporate operator / product & strategy positioning, AI product, leadership, impact, and the four audiences", () => {
    const lower = copy.toLowerCase();
    expect(
      lower.includes("corporate operator") ||
        lower.includes("product & strategy"),
    ).toBe(true);
    expect(lower).toContain("ai product");
    expect(lower).toContain("cross-functional leadership");
    expect(
      lower.includes("structured problem-solving") ||
        lower.includes("organizational impact"),
    ).toBe(true);
    expect(lower).toContain("growth-stage tech");
    expect(lower).toContain("consulting");
    expect(lower).toContain("early-stage startup");
    expect(lower).toContain("vc-adjacent");
  });

  it("does not use em dashes as a prose tic", () => {
    expect(copy).not.toContain("—");
  });

  it("does not use factory, manufacturing, or heavy operational framing", () => {
    expect(BANNED_FRAMING_TOKENS).toEqual(
      expect.arrayContaining(["unit cost", "cost per unit"]),
    );
    expect(findBannedFraming(stripOfficialTitles(copy))).toEqual([]);

    const outcomes = site.selectedWork.map((item) => item.outcome).join("\n");
    expect(findBannedFraming(outcomes)).toEqual([]);
  });

  it("uses one official title everywhere", () => {
    const title = site.positioning.currentRole;
    expect(title).toBe("Lead, AI Enablement & Factory Strategy");
    expect(site.experience[0].roles[0].title).toBe(title);
    expect(site.about.bio.join(" ")).toContain(title);

    const sources = [
      "content/site.ts",
      "app/layout.tsx",
      "components/sections/hero.tsx",
      "scripts/build-resume.py",
    ].map(readSiteFile);
    for (const source of sources) {
      expect(source).not.toMatch(/Manager, AI/);
    }
    expect(readSiteFile("app/layout.tsx")).toContain(
      "jobTitle: site.positioning.currentRole",
    );
    expect(readSiteFile("components/sections/hero.tsx")).toContain(
      "site.positioning.currentRole",
    );
  });

  it("keeps the document title short enough for a browser tab or search result", () => {
    const title = site.positioning.documentTitle;
    expect(title.startsWith(site.positioning.name)).toBe(true);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(readSiteFile("app/layout.tsx")).toContain(
      "default: site.positioning.documentTitle",
    );
  });

  it("numbers section eyebrows in page order from site.sections only", () => {
    const order = [
      "experience",
      "work",
      "about",
      "approach",
      "capabilities",
      "contact",
    ] as const;
    order.forEach((key, index) => {
      expect(site.sections[key].eyebrow).toMatch(
        new RegExp(`^0${index + 1} / `),
      );
    });

    const sectionFiles = [
      "about",
      "capabilities",
      "contact",
      "experience",
      "how-i-work",
      "selected-work",
    ].map((name) => readSiteFile(`components/sections/${name}.tsx`));
    for (const source of sectionFiles) {
      expect(source).not.toMatch(/eyebrow="/);
    }
  });

  it("does not ship third-party photos on case studies", () => {
    for (const item of site.selectedWork) {
      expect(item).not.toHaveProperty("image");
      expect(item.panel.value.length).toBeGreaterThan(0);
    }
    expect(existsSync(path.join(root, "public/images"))).toBe(false);
    expect(
      existsSync(
        path.join(root, site.about.photo.src.replace(/^\//, "public/")),
      ),
    ).toBe(true);
  });

  it("ships one shared headline, value prop, and about story — not four public narratives", () => {
    expect(site.positioning.headline.length).toBeGreaterThan(0);
    expect(site.positioning.valueProp.length).toBeGreaterThan(0);
    expect(site.about.bio.length).toBeGreaterThan(0);

    const variants = Object.values(site.positioning.headlineVariants);
    expect(variants).toHaveLength(4);
    for (const variant of variants) {
      expect(copy).not.toContain(variant);
    }

    const hero = readSiteFile("components/sections/hero.tsx");
    expect(hero).toContain("site.positioning.headline");
    expect(hero).not.toContain("headlineVariants");
    expect(hero).not.toContain("site.outreach");

    const page = readSiteFile("app/page.tsx");
    expect(page).not.toContain("headlineVariants");
    expect(page).not.toContain("site.outreach");
    expect(page).not.toMatch(/audience/i);
  });

  it("keeps paste-ready outreach off the public page while sharing the same narrative", () => {
    const { linkedin, email, intro } = site.outreach;
    expect(linkedin.length).toBeGreaterThan(0);
    expect(email.length).toBeGreaterThan(0);
    expect(intro.length).toBeGreaterThan(0);

    const outreach = `${linkedin}\n${email}\n${intro}`.toLowerCase();
    expect(
      outreach.includes("corporate operator") ||
        outreach.includes("product & strategy"),
    ).toBe(true);
    expect(outreach).toContain("ai product");

    expect(copy).not.toContain(linkedin);
    expect(copy).not.toContain(email);
    expect(copy).not.toContain(intro);

    const hero = readSiteFile("components/sections/hero.tsx");
    const page = readSiteFile("app/page.tsx");
    expect(hero).not.toContain(linkedin);
    expect(hero).not.toContain(email);
    expect(hero).not.toContain(intro);
    expect(page).not.toContain(linkedin);
    expect(page).not.toContain(email);
    expect(page).not.toContain(intro);
  });

  it("keeps revealed sections readable instead of hiding them at opacity 0", () => {
    const reveal = readSiteFile("components/reveal.tsx");
    expect(reveal).toContain("whileInView");
    expect(reveal).not.toMatch(/opacity:\s*0/);
  });

  it("renders section headings from the same content module", () => {
    const files = [
      ["components/sections/hero.tsx", "site.positioning.headline"],
      ["components/sections/about.tsx", "site.about.lookingForIntro"],
      ["components/sections/about.tsx", "site.sections.about"],
      ["components/sections/experience.tsx", "site.sections.experience"],
      ["components/sections/selected-work.tsx", "site.sections.work"],
      ["components/sections/how-i-work.tsx", "site.sections.approach"],
      ["components/sections/capabilities.tsx", "site.sections.capabilities"],
      ["components/sections/contact.tsx", "site.sections.contact"],
    ] as const;

    for (const [file, token] of files) {
      expect(readSiteFile(file)).toContain(token);
    }
  });

  it("ships a real PDF at the resume download path", () => {
    const pdf = readFileSync(path.join(root, "public/resume.pdf"));
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(20_000);
    expect(pdf.toString("latin1")).toContain("/Count 1");
  });
});
