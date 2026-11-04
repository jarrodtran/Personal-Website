import { inflateSync } from "node:zlib";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright-core";

const types = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const VIEWPORTS = {
  320: [320, 844],
  390: [390, 844],
  768: [768, 800],
  1280: [1280, 800],
};

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function readPngRgba(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (
    buffer
      .subarray(0, 8)
      .compare(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) !== 0
  ) {
    throw new Error("not a PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(
      `unsupported PNG bitDepth=${bitDepth} colorType=${colorType}`,
    );
  }
  const inflated = inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const rawPixels = Buffer.alloc(stride * height);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const row = inflated.subarray(src, src + stride);
    src += stride;
    const dest = y * stride;
    const prev = y === 0 ? null : rawPixels.subarray(dest - stride, dest);
    for (let i = 0; i < stride; i += 1) {
      const raw = row[i];
      const left = i >= bpp ? rawPixels[dest + i - bpp] : 0;
      const up = prev ? prev[i] : 0;
      const upLeft = prev && i >= bpp ? prev[i - bpp] : 0;
      let value = raw;
      switch (filter) {
        case 0:
          break;
        case 1:
          value = (raw + left) & 255;
          break;
        case 2:
          value = (raw + up) & 255;
          break;
        case 3:
          value = (raw + Math.floor((left + up) / 2)) & 255;
          break;
        case 4:
          value = (raw + paeth(left, up, upLeft)) & 255;
          break;
        default:
          throw new Error(`unsupported PNG filter ${filter}`);
      }
      rawPixels[dest + i] = value;
    }
  }
  if (colorType === 6) {
    return { width, height, pixels: rawPixels };
  }
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 0, o = 0; i < rawPixels.length; i += 3, o += 4) {
    pixels[o] = rawPixels[i];
    pixels[o + 1] = rawPixels[i + 1];
    pixels[o + 2] = rawPixels[i + 2];
    pixels[o + 3] = 255;
  }
  return { width, height, pixels };
}

export function countDifferingPixels(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return {
      differing: a.width * a.height,
      widthA: a.width,
      heightA: a.height,
      widthB: b.width,
      heightB: b.height,
    };
  }
  let differing = 0;
  for (let i = 0; i < a.pixels.length; i += 4) {
    if (
      a.pixels[i] !== b.pixels[i] ||
      a.pixels[i + 1] !== b.pixels[i + 1] ||
      a.pixels[i + 2] !== b.pixels[i + 2] ||
      a.pixels[i + 3] !== b.pixels[i + 3]
    ) {
      differing += 1;
    }
  }
  return {
    differing,
    widthA: a.width,
    heightA: a.height,
    widthB: b.width,
    heightB: b.height,
  };
}

async function serveOut() {
  if (!existsSync(join(process.cwd(), "out/index.html"))) {
    throw new Error("highlights screenshots need a production build in out/");
  }
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    const path = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const file = join("out", normalize(decodeURIComponent(path)));
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        "content-type": types[extname(file)] ?? "",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("test server did not bind");
  }
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function captureHighlights(outdir, textPercent, widths) {
  const { origin, close } = await serveOut();
  await mkdir(outdir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const width of widths) {
      const [w, height] = VIEWPORTS[width];
      const page = await browser.newPage({
        viewport: { width: w, height },
        colorScheme: "light",
      });
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      if (textPercent === 200) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
      }
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            const done = () => requestAnimationFrame(() => resolve());
            if (document.fonts.status === "loaded") {
              done();
              return;
            }
            document.fonts.ready.then(done).catch(done);
          }),
      );
      await page.waitForTimeout(300);
      const root = page.locator('[aria-label="Impact highlights"]');
      const dest = join(outdir, `${width}.png`);
      await root.screenshot({ path: dest, type: "png" });
      await page.close();
      console.log(`wrote ${dest}`);
    }
  } finally {
    await browser.close();
    await close();
  }
}

async function diffDirs(left, right, widths) {
  const counts = {};
  for (const width of widths) {
    const a = readPngRgba(await readFile(join(left, `${width}.png`)));
    const b = readPngRgba(await readFile(join(right, `${width}.png`)));
    const result = countDifferingPixels(a, b);
    counts[width] = result.differing;
    console.log(
      `${width}: ${result.differing} differing pixels (${result.widthA}x${result.heightA} vs ${result.widthB}x${result.heightB})`,
    );
  }
  return counts;
}

const args = process.argv.slice(2);
const command = args[0];

if (import.meta.url === `file://${process.argv[1]}`) {
  if (command === "capture") {
    const outdir = args[1];
    const textPercent = Number(args[2] ?? 100);
    const widths = (
      args[3] ? args[3].split(",") : ["320", "390", "768", "1280"]
    ).map(Number);
    await captureHighlights(outdir, textPercent, widths);
  } else if (command === "diff") {
    const left = args[1];
    const right = args[2];
    const widths = (
      args[3] ? args[3].split(",") : ["320", "390", "768", "1280"]
    ).map(Number);
    const counts = await diffDirs(left, right, widths);
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    await writeFile(
      join(right, "pixel-diff.json"),
      `${JSON.stringify({ counts, total }, null, 2)}\n`,
    );
    if (total !== 0) {
      process.exitCode = 1;
    }
  } else {
    console.error(
      "usage: node scripts/highlights-screenshots.mjs capture <dir> [100|200] [320,390,768,1280]",
    );
    console.error(
      "       node scripts/highlights-screenshots.mjs diff <left> <right> [320,390,768,1280]",
    );
    process.exit(1);
  }
}
