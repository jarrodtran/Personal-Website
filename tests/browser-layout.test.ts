import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatLayoutFailure,
  listTopLevelPageRoutes,
  withoutBasePath,
} from "./browser-layout";

const dirs: string[] = [];

function fakeOut(entries: Record<string, string | null>): string {
  const root = mkdtempSync(join(tmpdir(), "layout-out-"));
  dirs.push(root);
  for (const [relative, body] of Object.entries(entries)) {
    const full = join(root, relative);
    mkdirSync(join(full, ".."), { recursive: true });
    if (body === null) {
      mkdirSync(full, { recursive: true });
      continue;
    }
    writeFileSync(full, body);
  }
  return root;
}

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("listTopLevelPageRoutes", () => {
  it("derives routes from top-level html and index directories, not a hard list", () => {
    const outDir = fakeOut({
      "index.html": "<html></html>",
      "404.html": "<html></html>",
      "work/index.html": "<html></html>",
      "writing/index.html": "<html></html>",
      "work/nested/index.html": "<html></html>",
      "_next/static/chunk.js": "chunk",
      "_not-found/index.html": "<html></html>",
      "robots.txt": "User-agent: *",
    });

    expect(listTopLevelPageRoutes(outDir)).toEqual([
      "/",
      "/404.html",
      "/work/",
      "/writing/",
    ]);
  });

  it("omits directories that have no index.html", () => {
    const outDir = fakeOut({
      "index.html": "<html></html>",
      empty: null,
    });
    mkdirSync(join(outDir, "empty"), { recursive: true });

    expect(listTopLevelPageRoutes(outDir)).toEqual(["/"]);
  });
});

describe("withoutBasePath", () => {
  it("strips a prefixed BASE_PATH and leaves other paths alone", () => {
    expect(withoutBasePath("/Personal-Website", "/Personal-Website")).toBe("/");
    expect(
      withoutBasePath("/Personal-Website/work/", "/Personal-Website"),
    ).toBe("/work/");
    expect(withoutBasePath("/work/", "")).toBe("/work/");
  });
});

describe("formatLayoutFailure", () => {
  it("names the route, viewport, text size, theme, and violation", () => {
    expect(
      formatLayoutFailure("/", 390, 200, "dark", {
        kind: "tap-target",
        name: "tiny tap",
        detail: "12.0x10.0 < 44x44",
      }),
    ).toBe("/ 390 200% dark: tiny tap tap-target 12.0x10.0 < 44x44");
  });
});
