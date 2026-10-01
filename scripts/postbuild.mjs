import {
  copyFileSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

const out = "out";

function walk(dir, visit) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, visit);
    else visit(path);
  }
}

walk(out, (path) => {
  const name = basename(path);
  if (name === "opengraph-image" || name === "icon") {
    copyFileSync(path, `${path}.png`);
  }
});

function patchHtml(path) {
  const original = readFileSync(path, "utf8");
  const next = original
    .replaceAll("/opengraph-image?", "/opengraph-image.png?")
    .replaceAll('/opengraph-image"', '/opengraph-image.png"')
    .replaceAll("/icon?", "/icon.png?")
    .replaceAll('/icon"', '/icon.png"');
  if (next !== original) writeFileSync(path, next);
}

walk(out, (path) => {
  if (path.endsWith(".html")) patchHtml(path);
});
