#!/usr/bin/env node
// Launch, doctor, drive, and clean up a local server for the public
// jarrodtran.com static export. Cleanup deletes the run directory only.
// Proof files under .cursor/skills/verify-site/evidence/ are out of bounds.

import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HOME_TITLE = "Jarrod Tran · Product & strategy · Tesla, Apple, Waymo";
const NOT_FOUND_TITLE = "Page not found · Jarrod Tran";
const FEATURED_PATH = "/work/tesla-energy-ai-product/";
const FEATURED_TITLE = "Tesla Energy: AI product that got used · Jarrod Tran";
const EMPTY_WRITING = "First post coming soon. Subscribe to get it by email.";
const THEME_LABEL = "Toggle color theme";

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

const USAGE = `verify-site commands (run from the jarrodtran-com repo):
  launch
  doctor
  cleanup
  fetch <path> [--path <evidence-file>]
  browser context [--color-scheme light|dark] [--java-script true|false]
      [--viewport WxH] [--reduced-motion reduce|no-preference] [--clipboard]
  browser open <path>
  browser links --within-id <id> | --within-role <role> --within-name <name>
  browser click|text|attr|box|count|wait|snapshot --role <role> [--name <name>]
      [--within-role <role> --within-name <name> | --within-id <id> | --within-heading <name>]
      [--nth <n>] [--attr <name>] [--path <evidence-file>] [--timeout <ms>]
  browser press --key <key>
  browser viewport <WxH>
  browser wait-url <substring> [--timeout <ms>]
  browser wait-idle
  browser storage get <key>
  browser html-class
  browser computed
  browser clipboard
  browser title
  browser url
  browser active
  browser screenshot --path <evidence-file>`;

function scriptPath() {
  return fileURLToPath(import.meta.url);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(path, value) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, path);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function assertRunId(runId) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/.test(runId || "")) {
    throw new Error("run id must be a short token without slashes");
  }
}

function runsRoot() {
  return join(tmpdir(), "verify-site");
}

function runDirectory(runId) {
  assertRunId(runId);
  return join(runsRoot(), runId);
}

function currentPath() {
  return join(runsRoot(), "current");
}

function readCurrent() {
  try {
    return readFileSync(currentPath(), "utf8").trim();
  } catch {
    return "";
  }
}

function newRunId() {
  return `verify-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function cmdline(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`).toString("utf8");
  } catch {
    return "";
  }
}

function childPids(pid) {
  try {
    return readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((value) => Number(value));
  } catch {
    return [];
  }
}

function chromiumChildPid(parentPid) {
  for (const pid of childPids(parentPid)) {
    const command = cmdline(pid);
    if (["chrome", "chromium", "headless_shell"].some((marker) => command.includes(marker))) {
      return pid;
    }
  }
  return null;
}

async function waitDead(pid, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (!alive(pid)) return true;
    await sleep(100);
  }
  return !alive(pid);
}

function findRepo() {
  const starts = [];
  if (process.env.VERIFY_SITE_REPO) starts.push(process.env.VERIFY_SITE_REPO);
  starts.push(process.cwd(), dirname(scriptPath()));
  for (const start of starts) {
    let dir = resolve(start);
    while (true) {
      const pkgPath = join(dir, "package.json");
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
          if (pkg.name === "jarrodtran-com") return dir;
        } catch {
          // Keep walking if a directory contains an unreadable package.json.
        }
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

function requireRepo() {
  const repo = findRepo();
  if (!repo) throw new Error("run this from the jarrodtran-com checkout");
  return repo;
}

function resolveRunId(explicit) {
  if (explicit) {
    assertRunId(explicit);
    return explicit;
  }
  if (process.env.VERIFY_SITE_RUN_ID) {
    assertRunId(process.env.VERIFY_SITE_RUN_ID);
    return process.env.VERIFY_SITE_RUN_ID;
  }
  const current = readCurrent();
  if (!current) {
    throw new Error("no verification run; run launch or set VERIFY_SITE_RUN_ID");
  }
  assertRunId(current);
  return current;
}

function chromiumExecutable() {
  try {
    const executable = chromium.executablePath();
    return existsSync(executable) ? executable : "";
  } catch {
    return "";
  }
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&middot;", "·")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function htmlTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? decodeHtml(match[1]) : "";
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      positionals.push(...argv.slice(index + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        index += 1;
      }
    } else positionals.push(arg);
  }
  return { positionals, flags };
}

function flagString(flags, key) {
  const value = flags[key];
  if (value === undefined) return undefined;
  if (value === true) throw new Error(`missing value for --${key}`);
  return String(value);
}

function flagEnum(flags, key, allowed, fallback) {
  const value = flagString(flags, key);
  if (value === undefined) return fallback;
  if (!allowed.includes(value)) {
    throw new Error(`--${key} must be one of ${allowed.join(", ")}`);
  }
  return value;
}

function flagBool(flags, key, fallback) {
  const value = flags[key];
  if (value === undefined) return fallback;
  if (value === true) throw new Error(`missing value for --${key}`);
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`--${key} must be true or false`);
}

function flagPresent(flags, key) {
  const value = flags[key];
  if (value === undefined) return false;
  if (value === true || value === "true") return true;
  if (value === "false") return false;
  throw new Error(`--${key} does not take the value ${value}`);
}

function timeoutMs(flags, fallback) {
  if (flags.timeout === undefined) return fallback;
  const value = flagString(flags, "timeout");
  if (!/^\d+$/.test(value)) throw new Error("--timeout must be a non-negative integer");
  return Number(value);
}

function parseViewport(spec) {
  const match = /^(\d+)x(\d+)$/.exec(spec || "");
  if (!match) throw new Error("viewport must look like 1280x800");
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 200 || height < 200) throw new Error("viewport must be at least 200x200");
  return { width, height };
}

function evidencePath(repo, runDir, raw, runId) {
  if (!raw || raw === true) throw new Error("missing --path");
  const evidenceRoot = resolve(repo, ".cursor/skills/verify-site/evidence");
  const expanded = String(raw).replaceAll("{run}", runId);
  const absolute = resolve(repo, expanded);
  const runRoot = resolve(runDir);
  if (absolute === evidenceRoot || !absolute.startsWith(`${evidenceRoot}${sep}`)) {
    throw new Error(`--path must be a file under ${evidenceRoot}`);
  }
  if (absolute === runRoot || absolute.startsWith(`${runRoot}${sep}`)) {
    throw new Error("refusing to write proof into the run directory");
  }
  return absolute;
}

function safeJoin(root, relative) {
  const file = resolve(root, relative);
  const base = resolve(root);
  if (file !== base && !file.startsWith(`${base}${sep}`)) return null;
  return file;
}

function resolveOutFile(outDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { error: 400 };
  }
  if (decoded.includes("\0")) return { error: 400 };
  const relative = decoded.replace(/^\/+/, "");
  if (relative === "" || relative.endsWith("/")) {
    const index = safeJoin(outDir, `${relative}index.html`);
    if (!index) return { error: 400 };
    return existsSync(index) ? { file: index } : { error: 404 };
  }
  const direct = safeJoin(outDir, relative);
  if (!direct) return { error: 400 };
  if (existsSync(direct) && statSync(direct).isDirectory()) {
    const index = safeJoin(outDir, `${relative}/index.html`);
    if (index && existsSync(index)) return { file: index };
    return { error: 404 };
  }
  if (existsSync(direct) && statSync(direct).isFile()) return { file: direct };
  return { error: 404 };
}

function readInsideOut(outDir, file) {
  const root = realpathSync(outDir);
  const real = realpathSync(file);
  if (real !== root && !real.startsWith(`${root}${sep}`)) return null;
  return readFileSync(real);
}

function sendMissing(response, outDir, runId, status) {
  const headers = {
    "cache-control": "no-store",
    "x-verify-site-run": runId,
  };
  if (status === 404) {
    const file = join(outDir, "404.html");
    if (existsSync(file)) {
      response.writeHead(404, {
        ...headers,
        "content-type": "text/html; charset=utf-8",
      });
      response.end(readFileSync(file));
      return;
    }
  }
  response.writeHead(status, {
    ...headers,
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(status === 404 ? "not found" : "bad request");
}

async function probe(origin, path) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  const body = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, body };
}

function runIsLive(runId) {
  try {
    assertRunId(runId);
  } catch {
    return false;
  }
  const state = readJson(join(runDirectory(runId), "state.json"));
  return Boolean(
    state && alive(state.pid) && cmdline(state.pid).includes("verify-site.mjs"),
  );
}

async function terminateRecorded(pid, markers) {
  if (!pid || !alive(pid)) return;
  const command = cmdline(pid);
  if (!markers.some((marker) => command.includes(marker))) {
    throw new Error(
      `refusing to signal pid ${pid}; its command line is not one this skill started`,
    );
  }
  process.kill(pid, "SIGTERM");
  if (!(await waitDead(pid, 3000)) && alive(pid)) {
    process.kill(pid, "SIGKILL");
    await waitDead(pid, 1000);
  }
}

async function stopRun(runId) {
  assertRunId(runId);
  const runDir = runDirectory(runId);
  const state = readJson(join(runDir, "state.json"));
  const browserInfo = readJson(join(runDir, "browser.json"));
  const repo = state?.repoRoot || findRepo();
  if (repo) {
    const evidence = resolve(repo, ".cursor/skills/verify-site/evidence");
    const resolvedRun = resolve(runDir);
    if (
      resolvedRun === evidence ||
      resolvedRun.startsWith(`${evidence}${sep}`)
    ) {
      throw new Error("refusing to delete the evidence directory");
    }
  }
  await terminateRecorded(browserInfo?.pid, ["verify-site.mjs"]);
  await terminateRecorded(browserInfo?.browserPid, [
    "chrome",
    "chromium",
    "headless_shell",
  ]);
  await terminateRecorded(state?.pid, ["verify-site.mjs"]);
  if (
    (state?.pid && alive(state.pid)) ||
    (browserInfo?.pid && alive(browserInfo.pid)) ||
    (browserInfo?.browserPid && alive(browserInfo.browserPid))
  ) {
    throw new Error("a recorded process is still alive; left the run directory in place");
  }
  rmSync(runDir, { recursive: true, force: true });
  try {
    if (readCurrent() === runId) unlinkSync(currentPath());
  } catch {
    // The pointer was already removed.
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      // The build already exited.
    }
  }
}

async function buildExport(repo) {
  if (process.env.BASE_PATH) {
    console.log(
      `verify-site: ignoring BASE_PATH=${process.env.BASE_PATH}; building the production export with an empty BASE_PATH`,
    );
  }
  if (process.env.WRITING_FEED_PATH) {
    console.log(
      "verify-site: ignoring WRITING_FEED_PATH so the export fetches the live Substack feed",
    );
  }
  const env = { ...process.env };
  env.BASE_PATH = "";
  env.NEXT_PUBLIC_BASE_PATH = "";
  env.NEXT_TELEMETRY_DISABLED = "1";
  delete env.WRITING_FEED_PATH;
  const child = spawn("pnpm", ["build"], {
    cwd: repo,
    env,
    stdio: "inherit",
    detached: true,
  });
  const code = await new Promise((resolveExit, rejectExit) => {
    const timer = setTimeout(() => {
      signalGroup(child.pid, "SIGTERM");
      rejectExit(new Error("pnpm build timed out after 240s"));
    }, 240000);
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectExit(error);
    });
    child.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolveExit(exitCode);
    });
  });
  if (code !== 0) {
    throw new Error(
      `pnpm build exited ${code}. If Next reports a lock, another next dev or next build is using this checkout. Do not kill it by process name.`,
    );
  }
}

async function startServer({ repo, runId, runDir, indexSha256, nextVersion }) {
  const logPath = join(runDir, "server.log");
  const fd = openSync(logPath, "a");
  const env = {
    ...process.env,
    VERIFY_SITE_RUN_ID: runId,
    VERIFY_SITE_REPO: repo,
    VERIFY_SITE_INDEX_SHA256: indexSha256,
    VERIFY_SITE_NEXT_VERSION: nextVersion,
  };
  const child = spawn(process.execPath, [scriptPath(), "serve"], {
    cwd: repo,
    env,
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  closeSync(fd);
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const state = readJson(join(runDir, "state.json"));
    if (state && alive(state.pid)) return state;
    await sleep(100);
  }
  throw new Error(`server did not listen; see ${logPath}`);
}

async function launch() {
  const repo = requireRepo();
  const requested = process.env.VERIFY_SITE_RUN_ID || "";
  if (requested) assertRunId(requested);
  if (!requested) {
    const current = readCurrent();
    if (current && runIsLive(current)) {
      throw new Error(
        `verify-site run ${current} is already running. Run cleanup, or set VERIFY_SITE_RUN_ID to start another server after that launch has printed ready.`,
      );
    }
  }
  const runId = requested || newRunId();
  if (runIsLive(runId)) throw new Error(`run ${runId} is already running`);
  if (!chromiumExecutable()) {
    throw new Error(
      "Playwright Chromium is missing. From the repo root run: pnpm exec playwright install chromium. If it fails on a missing shared library, run: pnpm exec playwright install --with-deps chromium",
    );
  }
  if (!existsSync(join(repo, "node_modules/next"))) {
    throw new Error(
      "Dependencies are missing. From the repo root run: pnpm install --frozen-lockfile",
    );
  }
  const runDir = runDirectory(runId);
  mkdirSync(runDir, { recursive: true, mode: 0o700 });
  try {
    await buildExport(repo);
    const indexPath = join(repo, "out/index.html");
    if (!existsSync(indexPath)) throw new Error("pnpm build did not write out/index.html");
    const html = readFileSync(indexPath, "utf8");
    if (!html.includes(THEME_LABEL) || !html.includes("Jarrod Tran")) {
      throw new Error("out/index.html is not the public home page");
    }
    if (html.includes("/Personal-Website/_next")) {
      throw new Error(
        "out/index.html contains /Personal-Website. Verification builds with an empty BASE_PATH.",
      );
    }
    const indexSha256 = sha256(readFileSync(indexPath));
    const nextVersion = JSON.parse(
      readFileSync(join(repo, "node_modules/next/package.json"), "utf8"),
    ).version;
    await startServer({ repo, runId, runDir, indexSha256, nextVersion });
    const doctor = await runDoctor(repo, runId);
    process.stdout.write(`${doctor.lines.join("\n")}\n`);
    if (!doctor.ok) throw new Error("doctor failed after launch");
    const state = readJson(join(runDir, "state.json"));
    mkdirSync(runsRoot(), { recursive: true, mode: 0o700 });
    writeFileSync(currentPath(), `${runId}\n`);
    console.log(`verify-site: ready ${state.origin} run=${runId}`);
  } catch (error) {
    try {
      await stopRun(runId);
    } catch (cleanupError) {
      console.error(
        `verify-site: cleanup after failure: ${cleanupError instanceof Error ? cleanupError.message : cleanupError}`,
      );
    }
    throw error;
  }
}

async function serve() {
  const repo = requireRepo();
  const runId = process.env.VERIFY_SITE_RUN_ID || "";
  assertRunId(runId);
  const runDir = runDirectory(runId);
  const outDir = join(repo, "out");
  const indexPath = join(outDir, "index.html");
  const actual = sha256(readFileSync(indexPath));
  const expected = process.env.VERIFY_SITE_INDEX_SHA256;
  if (expected && actual !== expected) {
    console.error("out/index.html changed before listen");
    process.exit(1);
  }
  const port = process.env.VERIFY_SITE_PORT ? Number(process.env.VERIFY_SITE_PORT) : 0;
  if (
    process.env.VERIFY_SITE_PORT &&
    (!Number.isInteger(port) || port < 0 || port > 65535)
  ) {
    console.error("VERIFY_SITE_PORT is not a TCP port");
    process.exit(1);
  }
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const found = resolveOutFile(outDir, url.pathname);
      if (found.error) {
        sendMissing(response, outDir, runId, found.error);
        return;
      }
      const body = readInsideOut(outDir, found.file);
      if (!body) {
        sendMissing(response, outDir, runId, 404);
        return;
      }
      const type = TYPES[extname(found.file)] || "application/octet-stream";
      response.writeHead(200, {
        "content-type": type,
        "cache-control": "no-store",
        "x-verify-site-run": runId,
      });
      response.end(body);
    } catch (error) {
      console.error(error);
      if (!response.headersSent) {
        response.writeHead(500, {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-verify-site-run": runId,
        });
      }
      response.end("verify-site server error");
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, "127.0.0.1", () => resolveListen());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    console.error("server did not bind a TCP port");
    process.exit(1);
  }
  const state = {
    runId,
    repoRoot: repo,
    pid: process.pid,
    port: address.port,
    origin: `http://127.0.0.1:${address.port}`,
    outDir,
    indexSha256: actual,
    nextVersion: process.env.VERIFY_SITE_NEXT_VERSION || "",
  };
  writeJson(join(runDir, "state.json"), state);
  console.log(`verify-site: listening ${state.origin} run=${runId}`);
  const stop = () => {
    if (typeof server.closeAllConnections === "function") server.closeAllConnections();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

function checkText(label, response, status, needle, lines, failures) {
  const html = response.body.toString("utf8");
  const title = htmlTitle(html);
  const ok = response.status === status && html.includes(needle);
  lines.push(`${label}: ${response.status} ${ok ? "yes" : "no"} title=${title}`);
  if (response.status !== status) failures.push(`${label} status ${response.status}`);
  if (!html.includes(needle)) failures.push(`${label} body is missing ${JSON.stringify(needle)}`);
  return { html, title };
}

async function runDoctor(repo, runId) {
  const lines = [];
  const failures = [];
  const runDir = runDirectory(runId);
  const state = readJson(join(runDir, "state.json"));
  if (!state) {
    return { ok: false, lines: ["doctor: fail", "no state file; run launch first"] };
  }
  lines.push(`run: ${state.runId}`);
  lines.push(`origin: ${state.origin}`);
  lines.push(`runDir: ${runDir}`);
  lines.push(`serverPid: ${state.pid}`);
  const serverAlive = alive(state.pid);
  lines.push(`serverAlive: ${serverAlive ? "yes" : "no"}`);
  if (!serverAlive) failures.push("server pid is not running");
  else if (!cmdline(state.pid).includes("verify-site.mjs")) {
    failures.push("server pid is not verify-site.mjs");
  }
  let nextVersion = "";
  try {
    nextVersion = JSON.parse(
      readFileSync(join(repo, "node_modules/next/package.json"), "utf8"),
    ).version;
  } catch {
    failures.push("node_modules/next/package.json is unreadable");
  }
  lines.push(`next: ${nextVersion}`);
  if (state.nextVersion && nextVersion && state.nextVersion !== nextVersion) {
    failures.push("installed next version changed after launch");
  }
  const indexPath = join(repo, "out/index.html");
  const indexBytes = existsSync(indexPath) ? readFileSync(indexPath) : null;
  const indexHash = indexBytes ? sha256(indexBytes) : "";
  lines.push(`indexSha256: ${indexHash}`);
  if (!indexBytes) failures.push("out/index.html is missing");
  if (indexHash !== state.indexSha256) failures.push("out/index.html changed after launch");

  let home;
  try {
    home = await probe(state.origin, "/");
  } catch (error) {
    failures.push(`home request failed: ${error instanceof Error ? error.message : error}`);
  }
  if (home) {
    const owned = home.headers.get("x-verify-site-run") === state.runId;
    lines.push(`portOwnedByRun: ${owned ? "yes" : "no"}`);
    if (!owned) failures.push("response is not from this run");
    const servedHash = sha256(home.body);
    const matches = servedHash === state.indexSha256;
    lines.push(`servedIndexMatchesOut: ${matches ? "yes" : "no"}`);
    if (!matches) failures.push("served home does not match the launched export");
    const html = home.body.toString("utf8");
    const title = htmlTitle(html);
    lines.push(`title: ${title}`);
    if (home.status !== 200) failures.push(`home status ${home.status}`);
    if (title !== HOME_TITLE) failures.push(`home title was ${JSON.stringify(title)}`);
    if (!html.includes(`aria-label="${THEME_LABEL}"`)) {
      failures.push("home is missing the theme toggle");
    }
    const prefixed = html.includes("/Personal-Website/_next");
    lines.push(`basePathPrefix: ${prefixed ? "present" : "absent"}`);
    if (prefixed) failures.push("export contains the CI base path prefix");
    if (html.includes(EMPTY_WRITING)) lines.push("writing: empty");
    else if (html.includes("Subscribe on Substack")) lines.push("writing: posts");
    else lines.push("writing: unknown");
    if (!state.origin.startsWith("http://127.0.0.1:")) {
      failures.push("origin is not http://127.0.0.1");
    }
  }

  const pages = [
    [FEATURED_PATH, 200, FEATURED_TITLE, "caseStudy"],
    ["/no-such-page/", 404, NOT_FOUND_TITLE, "notFound"],
    ["/writing/", 200, "url=/#writing", "legacyWriting"],
    ["/work/", 200, "url=/#work", "legacyWork"],
  ];
  for (const [path, status, needle, label] of pages) {
    try {
      const response = await probe(state.origin, path);
      checkText(label, response, status, needle, lines, failures);
    } catch (error) {
      lines.push(`${label}: error`);
      failures.push(
        `${label} request failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  try {
    const pdf = await probe(state.origin, "/resume.pdf");
    const signature = pdf.body.subarray(0, 5).toString("latin1");
    const type = pdf.headers.get("content-type") || "";
    const ok =
      pdf.status === 200 && signature === "%PDF-" && type.includes("application/pdf");
    lines.push(`resumePdf: ${ok ? "yes" : "no"}`);
    if (!ok) failures.push(`resume.pdf status ${pdf.status} type ${type} signature ${signature}`);
  } catch (error) {
    lines.push("resumePdf: error");
    failures.push(`resume.pdf request failed: ${error instanceof Error ? error.message : error}`);
  }

  const executable = chromiumExecutable();
  lines.push(`chromium: ${executable || "missing"}`);
  lines.push(`chromiumPresent: ${executable ? "yes" : "no"}`);
  if (!executable) {
    failures.push(
      "Playwright Chromium is missing. Run: pnpm exec playwright install chromium",
    );
  }
  lines.push(failures.length === 0 ? "doctor: ok" : "doctor: fail");
  for (const failure of failures) lines.push(`fail: ${failure}`);
  return { ok: failures.length === 0, lines };
}

async function cleanup() {
  const runId = process.env.VERIFY_SITE_RUN_ID || readCurrent();
  if (!runId) {
    console.log("verify-site: nothing to clean");
    return;
  }
  assertRunId(runId);
  if (!existsSync(runDirectory(runId)) && readCurrent() !== runId) {
    console.log("verify-site: nothing to clean");
    return;
  }
  await stopRun(runId);
  console.log(`verify-site: cleaned ${runId}`);
}

async function fetchPath(path, flags) {
  if (!path.startsWith("/")) throw new Error("fetch path must start with /");
  const repo = requireRepo();
  const runId = resolveRunId();
  const runDir = runDirectory(runId);
  const state = readJson(join(runDir, "state.json"));
  if (!state?.origin) throw new Error("no state file; run launch first");
  const response = await probe(state.origin, path);
  console.log(`status: ${response.status}`);
  console.log(`content-type: ${response.headers.get("content-type") || ""}`);
  console.log(`x-verify-site-run: ${response.headers.get("x-verify-site-run") || ""}`);
  if (flags.path) {
    const file = evidencePath(repo, runDir, flags.path, runId);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, response.body);
    console.log(`body: ${file}`);
    return;
  }
  process.stdout.write(response.body);
  if (response.body.length === 0 || response.body[response.body.length - 1] !== 10) {
    process.stdout.write("\n");
  }
}

function defaultContext() {
  return {
    colorScheme: "light",
    javaScript: true,
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
    clipboard: false,
  };
}

function contextFromFlags(flags) {
  return {
    colorScheme: flagEnum(flags, "color-scheme", ["light", "dark"], "light"),
    javaScript: flagBool(flags, "java-script", true),
    viewport: parseViewport(flagString(flags, "viewport") || "1280x800"),
    reducedMotion: flagEnum(
      flags,
      "reduced-motion",
      ["reduce", "no-preference"],
      "reduce",
    ),
    clipboard: flagPresent(flags, "clipboard"),
  };
}

function describeTarget(flags) {
  const name = flags.name && flags.name !== true ? ` "${flags.name}"` : "";
  const nth = flags.nth !== undefined ? ` nth=${flags.nth}` : "";
  const within = flags["within-role"]
    ? ` within ${flags["within-role"]} "${flags["within-name"]}"`
    : "";
  const id = flags["within-id"] ? ` within #${flags["within-id"]}` : "";
  const heading = flags["within-heading"]
    ? ` within heading "${flags["within-heading"]}"`
    : "";
  return `${flags.role || "page"}${name}${within}${id}${heading}${nth}`;
}

function locate(session, flags) {
  let scope = session.page;
  const scopes = ["within-role", "within-id", "within-heading"].filter(
    (key) => flags[key] !== undefined,
  );
  if (scopes.length > 1) {
    throw new Error("use only one of --within-role, --within-id, or --within-heading");
  }
  if (flags["within-role"] !== undefined || flags["within-name"] !== undefined) {
    const role = flagString(flags, "within-role");
    const name = flagString(flags, "within-name");
    if (!role || !name) {
      throw new Error("--within-role and --within-name are required together");
    }
    scope = scope.getByRole(role, { name, exact: true });
  }
  if (flags["within-id"] !== undefined) {
    const id = flagString(flags, "within-id");
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id || "")) {
      throw new Error("--within-id must be a simple id token");
    }
    scope = scope.locator(`#${id}`);
  }
  if (flags["within-heading"] !== undefined) {
    const heading = flagString(flags, "within-heading");
    scope = scope
      .getByRole("heading", { name: heading, exact: true })
      .locator("xpath=ancestor::section[1]");
  }
  const role = flagString(flags, "role");
  if (!role) throw new Error("missing --role");
  const name = flags.name === undefined ? undefined : flagString(flags, "name");
  let locator =
    name === undefined
      ? scope.getByRole(role)
      : scope.getByRole(role, { name, exact: true });
  if (flags.nth !== undefined) {
    const nth = flagString(flags, "nth");
    if (!/^\d+$/.test(nth)) throw new Error("--nth must be a non-negative integer");
    locator = locator.nth(Number(nth));
  }
  return locator;
}

async function expectOne(session, flags) {
  const locator = locate(session, flags);
  if (flags.nth === undefined) {
    const count = await locator.count();
    if (count !== 1) {
      throw new Error(`expected 1 match for ${describeTarget(flags)}, found ${count}`);
    }
  }
  return locator;
}

async function browserDaemon() {
  const runId = process.env.VERIFY_SITE_RUN_ID || "";
  assertRunId(runId);
  const repo = requireRepo();
  const runDir = runDirectory(runId);
  const state = readJson(join(runDir, "state.json"));
  if (!state?.origin) {
    console.error("no server state; run launch first");
    process.exit(1);
  }
  const session = { browser: null, context: null, page: null };
  session.browser = await chromium.launch({ headless: true });
  // Playwright's Browser object in this version has no process() method.
  // The Chrome pid is the daemon's child, which cleanup still has to signal.
  const browserPid = chromiumChildPid(process.pid);
  const socketPath = join(runDir, "browser.sock");
  if (existsSync(socketPath)) unlinkSync(socketPath);

  async function applyContext(options) {
    if (session.context) await session.context.close();
    session.context = await session.browser.newContext({
      colorScheme: options.colorScheme,
      javaScriptEnabled: options.javaScript,
      viewport: options.viewport,
      reducedMotion: options.reducedMotion,
      permissions: options.clipboard ? ["clipboard-read", "clipboard-write"] : [],
      baseURL: state.origin,
    });
    session.page = await session.context.newPage();
    session.page.setDefaultTimeout(15000);
    return `context: colorScheme=${options.colorScheme} javaScript=${options.javaScript} viewport=${options.viewport.width}x${options.viewport.height} reducedMotion=${options.reducedMotion} clipboard=${options.clipboard}`;
  }

  async function ensurePage() {
    if (!session.page) await applyContext(defaultContext());
  }

  async function dispatch(message) {
    const { command, positionals = [], flags = {} } = message;
    if (command === "context") return applyContext(contextFromFlags(flags));
    await ensurePage();
    if (command === "open") {
      const path = positionals[0];
      if (!path || !path.startsWith("/") || path.startsWith("//")) {
        throw new Error("open path must start with a single / on the verification origin");
      }
      const response = await session.page.goto(path, {
        waitUntil: "load",
        timeout: 30000,
      });
      return `status: ${response ? response.status() : 0}\nurl: ${session.page.url()}`;
    }
    if (command === "click") {
      const locator = await expectOne(session, flags);
      await locator.click();
      return `clicked ${describeTarget(flags)}\nurl: ${session.page.url()}`;
    }
    if (command === "press") {
      const key = flagString(flags, "key");
      if (!key) throw new Error("missing --key");
      await session.page.keyboard.press(key);
      return `pressed ${key}\nurl: ${session.page.url()}`;
    }
    if (command === "text") {
      const locator = await expectOne(session, flags);
      const text = await locator.evaluate((element) => element.textContent ?? "");
      const trimmed = text.replace(/\s+/g, " ").trim();
      return trimmed.length === 0 ? "(empty)" : trimmed;
    }
    if (command === "links") {
      let scope = session.page;
      if (flags["within-id"] !== undefined && flags["within-role"] !== undefined) {
        throw new Error("browser links accepts either --within-id or --within-role");
      }
      if (flags["within-id"] !== undefined) {
        const id = flagString(flags, "within-id");
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id || "")) {
          throw new Error("--within-id must be a simple id token");
        }
        scope = session.page.locator(`#${id}`);
      } else if (flags["within-role"] !== undefined) {
        const role = flagString(flags, "within-role");
        const name = flagString(flags, "within-name");
        if (!role || name === undefined) {
          throw new Error("browser links --within-role also needs --within-name");
        }
        scope = session.page.getByRole(role, { name, exact: true });
      } else {
        throw new Error("browser links requires --within-id or --within-role");
      }
      const links = scope.getByRole("link");
      const count = await links.count();
      const lines = [];
      for (let index = 0; index < count; index += 1) {
        const link = links.nth(index);
        const href = (await link.getAttribute("href")) ?? "";
        const name = (
          await link.evaluate((element) => element.textContent ?? "")
        )
          .replace(/\s+/g, " ")
          .trim();
        lines.push(`${href}\t${name}`);
      }
      return lines.join("\n");
    }
    if (command === "attr") {
      const attr = flagString(flags, "attr");
      if (!attr) throw new Error("missing --attr");
      const locator = await expectOne(session, flags);
      const value = await locator.getAttribute(attr);
      return value === null ? "null" : value;
    }
    if (command === "count") {
      return String(await locate(session, flags).count());
    }
    if (command === "box") {
      const locator = await expectOne(session, flags);
      const box = await locator.boundingBox();
      if (!box) throw new Error(`no box for ${describeTarget(flags)}`);
      return `x: ${box.x}\ny: ${box.y}\nwidth: ${box.width}\nheight: ${box.height}`;
    }
    if (command === "wait") {
      const locator = locate(session, flags);
      await locator.waitFor({ state: "visible", timeout: timeoutMs(flags, 10000) });
      if (flags.nth === undefined) {
        const count = await locator.count();
        if (count !== 1) {
          throw new Error(`expected 1 match for ${describeTarget(flags)}, found ${count}`);
        }
      }
      return `visible ${describeTarget(flags)}`;
    }
    if (command === "wait-url") {
      const needle = positionals[0];
      if (!needle) throw new Error("wait-url requires a URL substring");
      await session.page.waitForURL((url) => url.toString().includes(needle), {
        timeout: timeoutMs(flags, 10000),
      });
      return session.page.url();
    }
    if (command === "wait-idle") {
      let timer;
      try {
        await Promise.race([
          session.page.evaluate(
            () =>
              new Promise((resolveIdle) => {
                const finish = () => resolveIdle(undefined);
                if (typeof requestIdleCallback === "function") {
                  requestIdleCallback(() => finish());
                } else setTimeout(finish, 0);
              }),
          ),
          new Promise((_, rejectIdle) => {
            timer = setTimeout(() => rejectIdle(new Error("wait-idle timed out")), 5000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
      return "idle";
    }
    if (command === "viewport") {
      const viewport = parseViewport(positionals[0]);
      await session.page.setViewportSize(viewport);
      return `viewport: ${viewport.width}x${viewport.height}`;
    }
    if (command === "storage") {
      if (positionals[0] !== "get" || !positionals[1]) {
        throw new Error("only `browser storage get <key>` is available");
      }
      const value = await session.page.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        positionals[1],
      );
      return value === null ? "null" : value;
    }
    if (command === "html-class") {
      return session.page.evaluate(() => document.documentElement.className);
    }
    if (command === "computed") {
      const value = await session.page.evaluate(() => {
        const body = getComputedStyle(document.body);
        return {
          background: body.backgroundColor,
          color: body.color,
          overflow: body.overflow,
          htmlClass: document.documentElement.className,
        };
      });
      return `background: ${value.background}\ncolor: ${value.color}\noverflow: ${value.overflow}\nhtmlClass: ${value.htmlClass}`;
    }
    if (command === "clipboard") {
      return session.page.evaluate(() => navigator.clipboard.readText());
    }
    if (command === "title") return session.page.title();
    if (command === "url") return session.page.url();
    if (command === "active") {
      const value = await session.page.evaluate(() => {
        const element = document.activeElement;
        if (!element) return { tag: "none", ariaLabel: "", text: "" };
        return {
          tag: element.tagName.toLowerCase(),
          ariaLabel: element.getAttribute("aria-label") ?? "",
          text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
        };
      });
      return `tag: ${value.tag}\nariaLabel: ${value.ariaLabel}\ntext: ${value.text}`;
    }
    if (command === "snapshot") {
      const target = flags.role
        ? await expectOne(session, flags)
        : session.page.locator("body");
      const yaml = await target.ariaSnapshot();
      const file = evidencePath(repo, runDir, flags.path, runId);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, yaml.endsWith("\n") ? yaml : `${yaml}\n`);
      return file;
    }
    if (command === "screenshot") {
      const file = evidencePath(repo, runDir, flags.path, runId);
      mkdirSync(dirname(file), { recursive: true });
      await session.page.screenshot({ path: file, fullPage: false });
      return file;
    }
    throw new Error(`unknown browser command ${command}`);
  }

  let chain = Promise.resolve();
  const server = net.createServer((socket) => {
    let buffer = "";
    socket.on("error", () => {
      // The client may disconnect after reading the response line.
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        chain = chain.then(async () => {
          try {
            const result = await dispatch(JSON.parse(line));
            socket.write(`${JSON.stringify({ ok: true, result })}\n`);
          } catch (error) {
            socket.write(
              `${JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              })}\n`,
            );
          }
        });
        newline = buffer.indexOf("\n");
      }
    });
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(socketPath, () => resolveListen());
  });
  writeJson(join(runDir, "browser.json"), {
    pid: process.pid,
    browserPid,
    socketPath,
    runId,
  });
  console.log(`verify-site: browser daemon pid=${process.pid} socket=${socketPath}`);

  let shuttingDown = false;
  const shutdown = async (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      if (session.context) await session.context.close();
    } catch {
      // The browser may already be gone.
    }
    try {
      if (session.browser) await session.browser.close();
    } catch {
      // The browser may already be gone.
    }
    await new Promise((resolveClose) => server.close(() => resolveClose()));
    try {
      unlinkSync(socketPath);
    } catch {
      // The socket was already removed.
    }
    process.exit(code);
  };
  process.on("SIGTERM", () => {
    void shutdown(0);
  });
  process.on("SIGINT", () => {
    void shutdown(0);
  });
}

function socketRequest(socketPath, message) {
  return new Promise((resolveResult, rejectResult) => {
    const socket = net.createConnection(socketPath);
    let buffer = "";
    const timer = setTimeout(() => {
      socket.destroy();
      rejectResult(new Error("browser command timed out after 60s"));
    }, 60000);
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      clearTimeout(timer);
      socket.end();
      try {
        const parsed = JSON.parse(buffer.slice(0, newline));
        if (!parsed.ok) rejectResult(new Error(parsed.error || "browser command failed"));
        else resolveResult(parsed.result ?? "");
      } catch (error) {
        rejectResult(error);
      }
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      rejectResult(error);
    });
    socket.write(`${JSON.stringify(message)}\n`);
  });
}

async function ensureDaemon(runId) {
  const runDir = runDirectory(runId);
  const infoPath = join(runDir, "browser.json");
  const existing = readJson(infoPath);
  if (existing && alive(existing.pid) && existsSync(existing.socketPath)) return existing;
  const state = readJson(join(runDir, "state.json"));
  if (!state || !alive(state.pid)) {
    throw new Error("verification server is not running; run launch first");
  }
  const logPath = join(runDir, "browser.log");
  const fd = openSync(logPath, "a");
  const child = spawn(process.execPath, [scriptPath(), "browser-daemon"], {
    cwd: state.repoRoot,
    env: {
      ...process.env,
      VERIFY_SITE_RUN_ID: runId,
      VERIFY_SITE_REPO: state.repoRoot,
    },
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  child.unref();
  closeSync(fd);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !exited) {
    const info = readJson(infoPath);
    if (info && alive(info.pid) && existsSync(info.socketPath)) return info;
    await sleep(100);
  }
  let tail = "";
  try {
    tail = readFileSync(logPath, "utf8").trim().slice(-2000);
  } catch {
    tail = "";
  }
  throw new Error(
    `browser daemon did not start; see ${logPath}${tail ? `\n${tail}` : ""}`,
  );
}

async function browserCommand(runId, sub, positionals, flags) {
  const info = await ensureDaemon(runId);
  const result = await socketRequest(info.socketPath, {
    command: sub,
    positionals,
    flags,
  });
  if (result) process.stdout.write(result.endsWith("\n") ? result : `${result}\n`);
}

async function main() {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    return;
  }
  if (command === "launch") return launch();
  if (command === "doctor") {
    const doctor = await runDoctor(requireRepo(), resolveRunId());
    process.stdout.write(`${doctor.lines.join("\n")}\n`);
    if (!doctor.ok) process.exitCode = 1;
    return;
  }
  if (command === "cleanup") return cleanup();
  if (command === "fetch") {
    const parsed = parseArgs(rest);
    if (!parsed.positionals[0]) throw new Error("fetch requires a path");
    return fetchPath(parsed.positionals[0], parsed.flags);
  }
  if (command === "serve") return serve();
  if (command === "browser-daemon") return browserDaemon();
  if (command === "browser") {
    const sub = rest[0];
    if (!sub) throw new Error("browser requires a subcommand");
    const parsed = parseArgs(rest.slice(1));
    return browserCommand(resolveRunId(), sub, parsed.positionals, parsed.flags);
  }
  throw new Error(`unknown command ${command}`);
}

main().catch((error) => {
  console.error(`verify-site: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
