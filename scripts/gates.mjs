import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWLIST = ["jarrodtran", "cursor[bot]"];

const GATE_NAMES = ["design", "qa", "review"];
const GATE_LINE =
  /^GATE (design|qa|review) (PASS|FAIL) ([0-9a-fA-F]{40})(?: touches: (none|data|dns|money))?$/;

export function evaluateGates(comments, headSha) {
  const head = String(headSha ?? "").toLowerCase();
  const latest = { design: null, qa: null, review: null };
  const stale = { design: null, qa: null, review: null };

  // Only verdicts for the head commit count. A later comment about an older
  // commit is informational: it must not clear a PASS at the head, nor hide a
  // FAIL at the head. When a gate has no head verdict at all, the newest stale
  // line is still reported so the reviewer can see it was recorded for the
  // wrong commit.
  for (const line of parseLines(comments)) {
    if (line.sha === head) {
      latest[line.gate] = line;
    } else {
      stale[line.gate] = line;
    }
  }

  const rows = GATE_NAMES.map((gate) =>
    describeGate(gate, latest[gate] ?? stale[gate], head),
  );

  return {
    pass: rows.every((row) => row.ok),
    summary: rows.map((row) => row.text).join("\n"),
  };
}

function parseLines(comments) {
  const lines = [];

  (comments ?? []).forEach((comment, index) => {
    if (!isCountable(comment)) {
      return;
    }

    for (const raw of String(comment.body ?? "").split(/\r?\n/)) {
      const match = raw.match(GATE_LINE);
      if (!match) {
        continue;
      }

      lines.push({
        gate: match[1],
        verdict: match[2],
        sha: match[3].toLowerCase(),
        touches: match[4] ?? null,
        created_at: comment.created_at ?? "",
        index,
      });
    }
  });

  lines.sort((a, b) => {
    const time = String(a.created_at).localeCompare(String(b.created_at));
    if (time !== 0) {
      return time;
    }
    return a.index - b.index;
  });

  return lines;
}

function isCountable(comment) {
  const author = String(comment.author ?? "").toLowerCase();
  if (!ALLOWLIST.some((login) => login.toLowerCase() === author)) {
    return false;
  }
  return comment.updated_at === comment.created_at;
}

function describeGate(gate, line, head) {
  if (!line) {
    return { ok: false, text: `${gate} missing` };
  }

  const atHead = line.sha === head;
  const reviewOk = gate !== "review" || line.touches === "none";
  const ok = line.verdict === "PASS" && reviewOk && atHead;

  let text = `${gate} ${line.verdict} ${line.sha}`;
  if (gate === "review" && line.verdict === "PASS" && !reviewOk) {
    text += line.touches
      ? ` touches: ${line.touches}`
      : " missing touches: none";
  } else if (!atHead) {
    text += " stale";
  }

  return { ok, text };
}

async function github(url, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const api = process.env.GITHUB_API_URL || "https://api.github.com";
  const resolved = url.startsWith("http") ? url : `${api}${url}`;
  const response = await fetch(resolved, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "gates.mjs",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${resolved} ${response.status} ${await response.text()}`);
  }
  return response;
}

async function githubJson(url, options = {}) {
  const response = await github(url, options);
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function githubAll(path) {
  const items = [];
  let url = path;
  while (url) {
    const response = await github(url);
    const page = await response.json();
    items.push(...page);
    const next = (response.headers.get("link") ?? "").match(
      /<([^>]+)>;\s*rel="next"/,
    );
    url = next ? next[1] : "";
  }
  return items;
}

function mapComment(comment) {
  return {
    author: comment.user?.login ?? "",
    body: comment.body ?? "",
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };
}

async function postStatus(repo, sha, result) {
  const description = result.summary.replace(/\n/g, "; ").slice(0, 140);
  const runId = process.env.GITHUB_RUN_ID;
  const body = {
    state: result.pass ? "success" : "failure",
    context: "gates",
    description,
  };
  if (runId) {
    body.target_url = `https://github.com/${repo}/actions/runs/${runId}`;
  }
  await githubJson(`/repos/${repo}/statuses/${sha}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const headSha = process.env.HEAD_SHA;
  const prNumber = process.env.PR_NUMBER;
  if (!repo || !headSha || !prNumber) {
    throw new Error("HEAD_SHA, PR_NUMBER, and GITHUB_REPOSITORY are required");
  }

  const comments = (
    await githubAll(`/repos/${repo}/issues/${prNumber}/comments`)
  ).map(mapComment);
  const result = evaluateGates(comments, headSha);

  console.log(result.summary);
  await postStatus(repo, headSha, result);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
