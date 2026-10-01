/**
 * Budget is for JS loaded by the home page (/). Case-study routes are
 * separate HTML entry points; keep this gate on / so recruiter landings
 * stay lean. Raise gzipBudget only with an intentional comment.
 */
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
function outPath(src) {
  const next = src.indexOf("/_next/");
  if (next !== -1) return `out${src.slice(next)}`;
  const prefix = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
  const path =
    prefix && src.startsWith(prefix) ? src.slice(prefix.length) : src;
  return `out${path}`;
}

for (const src of sources) {
  const body = readFileSync(outPath(src));
  raw += body.length;
  gzip += gzipSync(body, { level: 9 }).length;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(`JS on /: ${sources.size} files, ${kb(raw)} raw, ${kb(gzip)} gzip`);
console.log(
  `HTML /: ${kb(html.length)} raw, ${kb(gzipSync(html, { level: 9 }).length)} gzip`,
);
if (gzip > gzipBudget) {
  console.error(`JS on / is over the ${kb(gzipBudget)} gzip budget`);
  process.exit(1);
}
