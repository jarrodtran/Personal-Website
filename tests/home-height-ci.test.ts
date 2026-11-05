import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("home height CI", () => {
  it("runs the existing writing-first height file after the production build", () => {
    const pkg = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["test:height"]).toMatch(/home-writing-first\.test\.ts/);
    expect(pkg.scripts["test:tap"] ?? "").not.toMatch(
      /home-writing-first\.test\.ts/,
    );

    const ci = read(".github/workflows/ci.yml");
    expect(ci).toMatch(
      /pnpm test:writing-output\n\s+- run: pnpm test:height/,
    );

    const deploy = read(".github/workflows/deploy.yml");
    expect(deploy).toContain("pnpm test:height");
  });

  it("keeps the Product Lead 700px cap in the existing height file", () => {
    const height = read("tests/home-writing-first.test.ts");
    expect(height).toContain("// rule:home-height");
    expect(height).toMatch(/PRODUCT_LEAD_TALLER_CAP_PX = 700/);
    expect(height).toContain(
      "keeps home shorter than main at 320 and 390 with 100% text",
    );
    expect(height).toContain(
      "allows home at most 700px taller than main at 640px and up with 100% text",
    );
    expect(height).toContain(
      "keeps home shorter than main at every width with 200% text",
    );
  });
});
