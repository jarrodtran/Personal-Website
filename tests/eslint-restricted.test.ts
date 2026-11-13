import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { bannedWorkflowOrScriptTextRead } from "../lib/eslint-restricted.mjs";

const linter = new Linter();

const config: Linter.Config = {
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
  rules: {
    "no-restricted-syntax": [
      "error",
      ...bannedWorkflowOrScriptTextRead,
    ] as unknown as Linter.RuleEntry,
  },
};

function lint(code: string): string[] {
  return linter.verify(code, config).map((message) => message.message);
}

describe("no reading .github or scripts as text in tests", () => {
  it("rejects a literal path", () => {
    const messages = lint('import { readFileSync } from "node:fs";\nreadFileSync(".github/workflows/ci.yml", "utf8");');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/Do not read \.github\/ or scripts\/ as text/);
  });

  it("rejects a path built with join", () => {
    const messages = lint(
      'import { join } from "node:path";\nimport { readFileSync } from "node:fs";\nreadFileSync(join(root, ".github", "workflows/ci.yml"), "utf8");',
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/including paths built with join\/resolve/);
  });

  it("rejects a path built with path.resolve and a scripts segment", () => {
    const messages = lint(
      'import { resolve } from "node:path";\nconst source = readFileSync(resolve(root, "scripts", "print.mjs"), "utf8");',
    );
    expect(messages).toHaveLength(1);
  });

  it("rejects an absolute literal under the repo root", () => {
    const messages = lint('readFileSync(resolve(root, "/scripts/check-pr-body.mjs"), "utf8");');
    expect(messages).toHaveLength(1);
  });

  it("rejects a relative workflow path", () => {
    const messages = lint(
      'const ci = readFileSync(path.resolve(__dirname, "../.github/workflows/ci.yml"), "utf8");',
    );
    expect(messages).toHaveLength(1);
  });

  it("leaves site reads alone", () => {
    const messages = lint(
      'readFileSync("out/index.html", "utf8");\nreadFileSync(join(root, "content", "site.ts"), "utf8");',
    );
    expect(messages).toEqual([]);
  });
});
