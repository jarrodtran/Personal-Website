import {
  copyFileSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const out = "out";

export function normalizeDeployBasePath(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

export function patchHtmlContent(original, base = process.env.BASE_PATH) {
  const prefix = normalizeDeployBasePath(base);
  let next = original
    .replaceAll("/opengraph-image?", "/opengraph-image.png?")
    .replaceAll('/opengraph-image"', '/opengraph-image.png"')
    .replaceAll("/icon?", "/icon.png?")
    .replaceAll('/icon"', '/icon.png"');
  if (prefix) {
    next = next.replaceAll('href="/icon.png', `href="${prefix}/icon.png`);
  }
  return next;
}

function walk(dir, visit) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, visit);
    else visit(path);
  }
}

function patchHtml(path) {
  const original = readFileSync(path, "utf8");
  const next = patchHtmlContent(original);
  if (next !== original) writeFileSync(path, next);
}

function run() {
  walk(out, (path) => {
    const name = basename(path);
    if (name === "opengraph-image" || name === "icon") {
      copyFileSync(path, `${path}.png`);
    }
  });

  walk(out, (path) => {
    if (path.endsWith(".html")) patchHtml(path);
  });
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  run();
}
