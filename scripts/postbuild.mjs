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

const ICON_HREFS = [
  "/icon.png",
  "/apple-icon.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

export function patchHtmlContent(original, base = process.env.BASE_PATH) {
  const prefix = normalizeDeployBasePath(base);
  let next = original
    .replaceAll("/opengraph-image?", "/opengraph-image.png?")
    .replaceAll('/opengraph-image"', '/opengraph-image.png"')
    .replaceAll("/icon?", "/icon.png?")
    .replaceAll('/icon"', '/icon.png"')
    .replaceAll("/apple-icon?", "/apple-icon.png?")
    .replaceAll('/apple-icon"', '/apple-icon.png"');
  if (prefix) {
    for (const href of ICON_HREFS) {
      next = next.replaceAll(`href="${href}`, `href="${prefix}${href}`);
      next = next.replaceAll(`"href":"${href}`, `"href":"${prefix}${href}`);
    }
  }
  return next;
}

const ROOT_ASSET_REF = /(?:\b(?:href|src)=|"href":|"src":)"(\/[^"]+)"/g;

export function unprefixedRootAssets(html, base = process.env.BASE_PATH) {
  const prefix = normalizeDeployBasePath(base);
  if (!prefix) return [];
  const found = new Set();
  for (const match of html.matchAll(ROOT_ASSET_REF)) {
    const url = match[1];
    if (url.startsWith("//")) continue;
    if (url === prefix || url.startsWith(`${prefix}/`)) continue;
    const path = url.split(/[?#]/)[0];
    if (!/\.[a-z0-9]+$/i.test(path) && !path.includes("/_next/")) continue;
    found.add(url);
  }
  return [...found];
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
    if (name === "opengraph-image" || name === "icon" || name === "apple-icon") {
      copyFileSync(path, `${path}.png`);
    }
  });

  const bad = [];
  walk(out, (path) => {
    if (!path.endsWith(".html")) return;
    patchHtml(path);
    const html = readFileSync(path, "utf8");
    for (const url of unprefixedRootAssets(html)) {
      bad.push(`${path}: ${url}`);
    }
  });
  if (bad.length) {
    console.error(
      "Built HTML still references a root-relative asset without BASE_PATH:\n" +
        bad.join("\n"),
    );
    process.exit(1);
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  run();
}
