import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const TINT_DELTA = 6;
const OLD_NAVY = [0x1e, 0x3a, 0x5f] as const;
const OLD_CREAM = [0xf7, 0xf3, 0xea] as const;

const built = existsSync(path.join(root, "out/index.html"));

if (!built) {
  throw new Error("generated-images test needs a production build in out/");
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer: Buffer): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("not a PNG");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const chunks: Buffer[] = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
    } else if (type === "IDAT") {
      chunks.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG depth=${bitDepth} type=${colorType}`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const rgba = new Uint8Array(width * height * 4);
  let i = 0;
  let prev = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[i++] ?? 0;
    const out = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const val = raw[i + x] ?? 0;
      const left = x >= channels ? (out[x - channels] ?? 0) : 0;
      const up = prev[x] ?? 0;
      const upLeft = x >= channels ? (prev[x - channels] ?? 0) : 0;
      let recon = val;
      if (filter === 1) recon = (val + left) & 255;
      else if (filter === 2) recon = (val + up) & 255;
      else if (filter === 3) recon = (val + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) recon = (val + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`bad PNG filter ${filter}`);
      out[x] = recon;
    }
    i += stride;
    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      rgba[dst] = out[src] ?? 0;
      rgba[dst + 1] = out[src + 1] ?? 0;
      rgba[dst + 2] = out[src + 2] ?? 0;
      rgba[dst + 3] = channels === 4 ? (out[src + 3] ?? 255) : 255;
    }
    prev = out;
  }

  return { width, height, data: rgba };
}

function collectPngs(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => {
      const name = path.basename(file);
      return (
        name === "icon.png" ||
        name === "apple-icon.png" ||
        name === "opengraph-image.png"
      );
    })
    .map((file) => path.join(dir, file));
}

function sameRgb(
  r: number,
  g: number,
  b: number,
  target: readonly [number, number, number],
): boolean {
  return r === target[0] && g === target[1] && b === target[2];
}

describe("built icon and OG images stay on palette A", () => {
  const files = collectPngs(path.join(root, "out"));

  it("finds the favicon, apple icon, and OG PNGs in the export", () => {
    expect(files.some((file) => file.endsWith(`${path.sep}icon.png`))).toBe(
      true,
    );
    expect(
      files.some((file) => file.endsWith(`${path.sep}apple-icon.png`)),
    ).toBe(true);
    expect(
      files.some((file) => file.endsWith(`${path.sep}opengraph-image.png`)),
    ).toBe(true);
    const exported = readdirSync(path.join(root, "out"), {
      recursive: true,
      encoding: "utf8",
    }).filter((file) => /(?:^|\/)(avatar\.webp|avatar-og\.png)$/.test(file));
    expect(exported).toEqual([]);
  });

  it("rejects tinted pixels and leftover navy or cream", () => {
    const problems: string[] = [];

    for (const file of files) {
      const png = decodePng(readFileSync(file));
      const rel = path.relative(root, file);
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const i = (y * png.width + x) * 4;
          const r = png.data[i] ?? 0;
          const g = png.data[i + 1] ?? 0;
          const b = png.data[i + 2] ?? 0;
          const tint = Math.max(r, g, b) - Math.min(r, g, b);
          if (tint > TINT_DELTA) {
            problems.push(
              `${rel} tint ${tint} at ${x},${y} rgb(${r},${g},${b})`,
            );
          } else if (
            sameRgb(r, g, b, OLD_NAVY) ||
            sameRgb(r, g, b, OLD_CREAM)
          ) {
            problems.push(`${rel} leftover brand pixel at ${x},${y}`);
          }
          if (problems.length >= 8) break;
        }
        if (problems.length >= 8) break;
      }
      if (problems.length >= 8) break;
    }

    expect(problems).toEqual([]);
  });
});
