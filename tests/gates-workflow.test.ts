import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateGates } from "../scripts/gates.mjs";

const root = path.resolve(__dirname, "..");
const HEAD = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("gates workflow", () => {
  it("checks out the PR base ref separately from the head ref", () => {
    const yml = readFileSync(
      path.join(root, ".github/workflows/gates.yml"),
      "utf8",
    );
    expect(yml).toMatch(
      /ref:\s*\$\{\{\s*steps\.pr\.outputs\.base\s*\}\}[\s\S]*path:\s*base/,
    );
    expect(yml).toMatch(
      /ref:\s*\$\{\{\s*steps\.pr\.outputs\.head\s*\}\}[\s\S]*path:\s*head/,
    );
    expect(yml).toMatch(/if \[ -f base\/scripts\/gates\.mjs \]/);
    expect(yml).toMatch(/SCRIPT=base\/scripts\/gates\.mjs/);
  });

  it("a tampered always-pass evaluator on the head cannot match base-script grading", () => {
    const tampered = () => ({ pass: true, summary: "tampered pass" });
    const base = evaluateGates([], HEAD);

    expect(tampered().pass).toBe(true);
    expect(base.pass).toBe(false);
    expect(base.summary).toContain("design missing");
  });
});
