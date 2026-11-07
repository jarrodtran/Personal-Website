import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HEAD_SHA_LINE = /head sha:[*_`\s]*([0-9a-z]+)\b/i;
const AGENT_BODY_BEGIN = "<!-- CURSOR_AGENT_PR_BODY_BEGIN -->";
const AGENT_BODY_END = "<!-- CURSOR_AGENT_PR_BODY_END -->";

function currentDescription(body) {
  const text = String(body);
  const start = text.lastIndexOf(AGENT_BODY_BEGIN);
  if (start === -1) {
    return text;
  }
  const from = start + AGENT_BODY_BEGIN.length;
  const end = text.indexOf(AGENT_BODY_END, from);
  return end === -1 ? text.slice(from) : text.slice(from, end);
}

function scanHeadSha(text, headSha) {
  const expected = String(headSha ?? "").toLowerCase();
  const errors = [];
  let accepted = 0;

  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(HEAD_SHA_LINE);
    if (!match) {
      continue;
    }

    const value = match[1];
    if (!/^[0-9a-f]+$/i.test(value)) {
      continue;
    }

    const normalized = value.toLowerCase();
    if (normalized.length < 7 || !expected.startsWith(normalized)) {
      errors.push(`Head SHA: ${value} is not a current prefix of the PR head`);
    } else {
      accepted += 1;
    }
  }

  return { errors, accepted };
}

export function checkPrBody(body, headSha) {
  if (body == null || body === "") {
    return [];
  }

  const full = String(body);
  const scoped = currentDescription(full);
  // A later edit keeps the previous description above the marker. When the
  // marked section has a current Head SHA and no stale one, that section is
  // the description to grade.
  if (scoped !== full) {
    const current = scanHeadSha(scoped, headSha);
    if (current.errors.length === 0 && current.accepted > 0) {
      return [];
    }
  }

  return scanHeadSha(full, headSha).errors;
}

function main() {
  const errors = checkPrBody(process.env.PR_BODY, process.env.HEAD_SHA);
  for (const error of errors) {
    console.error(error);
  }
  if (errors.length > 0) {
    process.exit(1);
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}
