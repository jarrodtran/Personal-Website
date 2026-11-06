import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/sections/hero";

const root = path.resolve(__dirname, "..");

describe("top anchor scroll margin and skip-to-content link", () => {
  it("gives Hero (#top) scroll-mt-24 so jumping to #top does not tuck the h1 under the sticky header at 390px", () => {
    const html = renderToStaticMarkup(<Hero />);
    expect(html).toMatch(/<section\b[^>]*\bid="top"[^>]*\bscroll-mt-24\b/);
  });

  it("pins the Skip to content link with focus:fixed and gives #content scroll-mt-24 and tabIndex={-1}", () => {
    const layout = readFileSync(path.join(root, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/href="#content"[\s\S]*?\bfocus:fixed\b/);
    expect(layout).toMatch(/href="#content"[\s\S]*?\bfocus:border\b/);
    expect(layout).not.toMatch(/href="#content"[\s\S]*?\bfocus:absolute\b/);
    expect(layout).toMatch(
      /<main\b[^>]*\bid="content"[^>]*\bscroll-mt-24\b[^>]*\btabIndex=\{-1\}|<main\b[^>]*\btabIndex=\{-1\}[^>]*\bscroll-mt-24\b/,
    );
  });
});
