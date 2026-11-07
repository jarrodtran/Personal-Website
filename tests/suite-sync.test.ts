import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const scripts = pkg.scripts ?? {};
const ci = readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");

/** Paths `pnpm test` ships with --exclude, e.g. tests/tap-targets.test.ts. */
const DEFAULT_EXCLUDED = [
  ...new Set(
    scripts.test
      ?.match(/--exclude\s+(\S+)/g)
      ?.map((fragment) => fragment.replace(/^--exclude\s+/, "")) ?? [],
  ),
];

/** test:* scripts that run named test files, e.g. pnpm test:images. */
const EXPLICIT_SCRIPTS = Object.entries(scripts).filter(
  ([name, script]) => name.startsWith("test:") && script.includes("vitest run"),
);

/** Every *.test.ts(x) under tests/, always repo-relative (tests/...). */
function suiteFiles(): string[] {
  return readdirSync(path.join(root, "tests"), {
    encoding: "utf8",
    recursive: true,
  })
    .filter((file) => /\.test\.tsx?$/.test(file))
    .map((file) => (file.startsWith("tests/") ? file : `tests/${file}`))
    .sort();
}

describe("test suite sync", () => {
  it("keeps every tests/*.test file reachable from pnpm test or a test:* script", () => {
    const orphaned: string[] = [];
    for (const file of suiteFiles()) {
      const inDefault = !DEFAULT_EXCLUDED.includes(file);
      const inScript = EXPLICIT_SCRIPTS.some(([, script]) =>
        script.includes(file),
      );
      if (!inDefault && !inScript) orphaned.push(file);
    }
    expect(orphaned, "suites with no runner").toEqual([]);
  });

  it("names a real test file in every exclude", () => {
    for (const file of DEFAULT_EXCLUDED) {
      expect(existsSync(path.join(root, file)), `missing ${file}`).toBe(true);
    }
  });

  it("runs every explicit test:* suite as a CI step", () => {
    for (const [name, script] of EXPLICIT_SCRIPTS) {
      for (const candidate of script.match(/tests\/[\w./-]+\.\w+/g) ?? []) {
        expect(
          existsSync(path.join(root, candidate)),
          `${name}: missing ${candidate}`,
        ).toBe(true);
      }
      expect(ci, `${name} missing from ci.yml`).toContain(`pnpm ${name}\n`);
    }
  });
});
