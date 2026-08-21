import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const out = "out";

function copyIfPresent(from, to) {
  if (existsSync(join(out, from))) {
    copyFileSync(join(out, from), join(out, to));
  }
}

copyIfPresent("opengraph-image", "opengraph-image.png");
copyIfPresent("icon", "icon.png");

function patchHtml(file) {
  const path = join(out, file);
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  const next = original
    .replaceAll("/opengraph-image?", "/opengraph-image.png?")
    .replaceAll('href="/icon?', 'href="/icon.png?')
    .replaceAll('href="/icon"', 'href="/icon.png"');
  if (next !== original) {
    writeFileSync(path, next);
  }
}

for (const file of readdirSync(out)) {
  if (file.endsWith(".html")) patchHtml(file);
}
