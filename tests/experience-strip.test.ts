import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireOutBuild, startOutServer } from "./browser-layout";

const FIGURES = ["1,000+", "$156M", "293%"] as const;

describe("home experience entry", () => {
  let origin = "";
  let close = async () => {};

  beforeAll(async () => {
    requireOutBuild("experience strip test needs a production build in out/");
    const server = await startOutServer();
    origin = server.origin;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("follows the Experience heading with Tesla and shows each work figure once", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      colorScheme: "light",
    });
    await page.goto(`${origin}/`, { waitUntil: "load" });
    const rendered = await page.evaluate(
      (figures) => {
        const section = document.querySelector("#experience");
        const heading = section?.querySelector("h2");
        const next = heading?.parentElement?.nextElementSibling ?? null;
        const figurePlaces = Object.fromEntries(
          figures.map((figure) => {
            const nodes = [...document.querySelectorAll("p")].filter(
              (node) => (node.textContent ?? "").trim() === figure,
            );
            return [
              figure,
              nodes.map((node) => node.closest("section")?.id ?? ""),
            ];
          }),
        );
        return {
          heading: heading?.textContent?.trim() ?? "",
          nextTag: next?.tagName ?? "",
          firstEntry: next?.querySelector("h3")?.textContent?.trim() ?? "",
          figurePlaces,
        };
      },
      [...FIGURES],
    );
    await browser.close();

    expect(rendered).toEqual({
      heading: "Experience",
      nextTag: "OL",
      firstEntry: "Tesla",
      figurePlaces: {
        "1,000+": ["work"],
        $156M: ["work"],
        "293%": ["work"],
      },
    });
  });
});
