import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

/** Repo-relative file path named in an AGENTS.md Test cell. */
const NAMED_FILE = /(?:tests|scripts)\/[\w./-]+\.(?:ts|tsx|mjs|js)/g;
const UNTESTABLE = /\buntestable\b/i;

type RuleRow = { rule: string; test: string };

function cellsOf(line: string): string[] {
  if (!line.startsWith("|")) return [];
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/** First markdown table whose header is Rule | Test. */
function parseRuleRows(markdown: string): RuleRow[] {
  const lines = markdown.split(/\r?\n/);
  const rows: RuleRow[] = [];
  let seenHeader = false;
  let seenSep = false;

  for (const line of lines) {
    const cells = cellsOf(line);
    if (cells.length === 0) {
      if (seenSep) break;
      seenHeader = false;
      seenSep = false;
      continue;
    }

    if (!seenHeader) {
      const header = cells.map((cell) => cell.toLowerCase());
      if (header[0] === "rule" && header[header.length - 1] === "test") {
        seenHeader = true;
      }
      continue;
    }

    if (!seenSep) {
      if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
        seenSep = true;
      }
      continue;
    }

    rows.push({ rule: cells[0] ?? "", test: cells[cells.length - 1] ?? "" });
  }

  return rows;
}

function rowErrors(row: RuleRow): string[] {
  const named = row.test.match(NAMED_FILE) ?? [];
  const untestable = UNTESTABLE.test(row.test);

  if (!untestable && named.length === 0) {
    return [
      `Rule row has neither a test file path nor an untestable marker: ${row.rule}`,
    ];
  }

  return named
    .filter((rel) => !existsSync(path.join(root, rel)))
    .map((rel) => `Rule row "${row.rule}" names missing path ${rel}`);
}

describe("AGENTS.md rule rows", () => {
  it("names an existing test file or marks the row untestable", () => {
    const markdown = readFileSync(path.join(root, "AGENTS.md"), "utf8");
    const rows = parseRuleRows(markdown);
    expect(
      rows.length,
      "expected a Rule | Test table in AGENTS.md",
    ).toBeGreaterThan(0);

    const errors = rows.flatMap(rowErrors);
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
  });
});
