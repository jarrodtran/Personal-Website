import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HEAD_SHA_LINE = /head sha:[*_`\s]*([0-9a-z]+)\b/i;
const AGENT_BODY_BEGIN = "<!-- CURSOR_AGENT_PR_BODY_BEGIN -->";

export function checkPrBody(body, headSha) {
  if (body == null || body === "") {
    return [];
  }

  const expected = String(headSha ?? "").toLowerCase();
  const errors = [];
  const maintained = maintainedBody(String(body));

  for (const line of maintained.split(/\r?\n/)) {
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
    }
  }

  return errors;
}

function maintainedBody(body) {
  const markerAt = body.indexOf(AGENT_BODY_BEGIN);
  if (markerAt === -1) {
    return body;
  }
  return body.slice(markerAt + AGENT_BODY_BEGIN.length);
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
