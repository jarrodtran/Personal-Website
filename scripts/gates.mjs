import { execFileSync, execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWLIST = ["jarrodtran"];

const GATE_NAMES = ["design", "qa", "review"];
const GATE_LINE =
  /^GATE (design|qa|review) (PASS|FAIL) ([0-9a-fA-F]{40})(?: touches: (none|data|dns|money))?$/;

export function evaluateGates(
  comments,
  headSha,
  priorHeads = [],
  diffEquality = {},
) {
  const head = String(headSha ?? "").toLowerCase();
  const prior = new Set(
    (priorHeads ?? []).map((sha) => String(sha).toLowerCase()),
  );
  const latest = { design: null, qa: null, review: null };

  for (const line of parseLines(comments)) {
    latest[line.gate] = line;
  }

  const rows = GATE_NAMES.map((gate) =>
    describeGate(gate, latest[gate], head, prior, diffEquality),
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

function describeGate(gate, line, head, prior, diffEquality) {
  if (!line) {
    return { ok: false, text: `${gate} missing` };
  }

  const applies = shaApplies(line.sha, head, prior, diffEquality);
  const reviewOk = gate !== "review" || line.touches === "none";
  const ok = line.verdict === "PASS" && reviewOk && applies.ok;

  let text = `${gate} ${line.verdict} ${line.sha}`;
  if (gate === "review" && line.verdict === "PASS" && !reviewOk) {
    text += line.touches
      ? ` touches: ${line.touches}`
      : " missing touches: none";
  } else if (!applies.ok && applies.reason) {
    text += ` ${applies.reason}`;
  }

  return { ok, text };
}

function shaApplies(sha, head, prior, diffEquality) {
  if (sha === head) {
    return { ok: true };
  }
  if (!prior.has(sha)) {
    return { ok: false, reason: "stale" };
  }

  const info = equalityInfo(sha, diffEquality);

  if (info.fetchable === false) {
    return { ok: false, reason: "unfetchable" };
  }
  if (!info.fetchable || !info.samePatchId) {
    return { ok: false, reason: info.fetchable ? "stale" : "unfetchable" };
  }
  return { ok: true };
}

function equalityInfo(sha, diffEquality) {
  if (diffEquality[sha]) {
    return diffEquality[sha];
  }
  const key = Object.keys(diffEquality).find(
    (candidate) => candidate.toLowerCase() === sha,
  );
  return key ? diffEquality[key] : {};
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    ...options,
  }).trim();
}

function haveCommit(sha) {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function ensureCommit(sha) {
  if (haveCommit(sha)) {
    return true;
  }
  try {
    execFileSync("git", ["fetch", "--no-tags", "origin", sha], {
      stdio: "ignore",
    });
  } catch {
    return false;
  }
  return haveCommit(sha);
}

function patchId(sha, baseRef) {
  const mergeBase = git(["merge-base", `origin/${baseRef}`, sha]);
  const diff = execFileSync("git", ["diff", mergeBase, sha], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return execSync("git patch-id --stable", {
    input: diff,
    encoding: "utf8",
  })
    .trim()
    .split(/\s+/)[0];
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

function collectShas(comments, headSha, commitShas) {
  const shas = new Set(
    commitShas.map((sha) => String(sha).toLowerCase()).filter(Boolean),
  );
  for (const line of parseLines(comments)) {
    shas.add(line.sha);
  }
  shas.delete(String(headSha).toLowerCase());
  return [...shas];
}

function diffEqualityFor(headSha, priorHeads, baseRef) {
  const headFetchable = ensureCommit(headSha);
  let headPatch = "";
  if (headFetchable) {
    try {
      headPatch = patchId(headSha, baseRef);
    } catch {
      headPatch = "";
    }
  }

  const info = {};
  for (const sha of priorHeads) {
    const fetchable = ensureCommit(sha);
    let samePatchId = false;
    if (fetchable && headFetchable && headPatch) {
      try {
        samePatchId = patchId(sha, baseRef) === headPatch;
      } catch {
        samePatchId = false;
      }
    }
    info[sha] = { fetchable, samePatchId };
  }
  return info;
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
  const baseRef = process.env.BASE_REF;
  const prNumber = process.env.PR_NUMBER;
  if (!repo || !headSha || !baseRef || !prNumber) {
    throw new Error(
      "HEAD_SHA, BASE_REF, PR_NUMBER, and GITHUB_REPOSITORY are required",
    );
  }

  execFileSync("git", ["fetch", "origin", baseRef], { stdio: "inherit" });

  const comments = (
    await githubAll(`/repos/${repo}/issues/${prNumber}/comments`)
  ).map(mapComment);
  const commitShas = (
    await githubAll(`/repos/${repo}/pulls/${prNumber}/commits`)
  ).map((commit) => commit.sha);
  const priorHeads = collectShas(comments, headSha, commitShas);
  const diffEquality = diffEqualityFor(headSha, priorHeads, baseRef);
  const result = evaluateGates(comments, headSha, priorHeads, diffEquality);

  console.log(result.summary);
  await postStatus(repo, headSha, result);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
