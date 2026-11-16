// Samples each cover's dominant color for the bookshelf view and stores it as
// "color" in content/library.json. Uses the Playwright Chromium the test
// suite already installs (pnpm exec playwright install chromium).
//
//   pnpm library:colors            # books with a cover and no color yet
//   pnpm library:colors --force    # resample every cover
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const root = new URL("../", import.meta.url);
const libraryFile = new URL("content/library.json", root);
const coversDir = new URL("public/library/covers/", root);
const force = process.argv.includes("--force");

const library = JSON.parse(readFileSync(libraryFile, "utf8"));
const targets = library.books.filter(
  (book) => book.cover && (force || !book.color),
);
if (targets.length === 0) {
  console.log("library:colors: every cover already has a color");
  process.exit(0);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const covers = targets.map((book) => ({
    slug: book.slug,
    data: `data:image/jpeg;base64,${readFileSync(new URL(book.cover, coversDir)).toString("base64")}`,
  }));
  // Most common color after rounding each channel to 16 levels, averaged
  // within that bucket. Covers are mostly one background color, which is
  // also what the spine usually is.
  const colors = await page.evaluate(async (items) => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 45;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const out = {};
    for (const { slug, data } of items) {
      const image = new Image();
      image.src = data;
      await image.decode();
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const { data: pixels } = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const buckets = new Map();
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
        const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
        const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        bucket.n += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        buckets.set(key, bucket);
      }
      const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
      const hex = (value) =>
        Math.round(value / top.n)
          .toString(16)
          .padStart(2, "0");
      out[slug] = `#${hex(top.r)}${hex(top.g)}${hex(top.b)}`;
    }
    return out;
  }, covers);
  for (const book of targets) book.color = colors[book.slug];
  writeFileSync(libraryFile, `${JSON.stringify(library, null, 2)}\n`);
  console.log(`library:colors: sampled ${targets.length} covers`);
} finally {
  await browser.close();
}
