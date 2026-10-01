import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const gzipBudget = 150 * 1024;

const html = readFileSync("out/index.html");
const sources = new Set(
  [...html.toString().matchAll(/<script\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => !/\bnoModule\b/i.test(tag))
    .map((tag) => tag.match(/\bsrc="([^"]+)"/)?.[1])
    .filter(Boolean),
);

let raw = 0;
let gzip = 0;
for (const src of sources) {
  const body = readFileSync(`out${src}`);
  raw += body.length;
  gzip += gzipSync(body, { level: 9 }).length;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(
  `JS on /: ${sources.size} files, ${kb(raw)} raw, ${kb(gzip)} gzip`,
);
console.log(
  `HTML /: ${kb(html.length)} raw, ${kb(gzipSync(html, { level: 9 }).length)} gzip`,
);
if (gzip > gzipBudget) {
  console.error(`JS on / is over the ${kb(gzipBudget)} gzip budget`);
  process.exit(1);
}
