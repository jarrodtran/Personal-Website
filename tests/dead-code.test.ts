import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as writing from "@/lib/writing";

const root = path.resolve(__dirname, "..");

describe("dead code stays deleted", () => {
  it("exposes one loader for the Writing feed and no unused host helper", () => {
    expect(writing).toHaveProperty("loadWriting");
    expect(writing).not.toHaveProperty("fetchSubstackPosts");
    expect(writing).not.toHaveProperty("isSubstackUrl");
  });

  it("does not ship CSS tokens nothing reads", () => {
    const css = readFileSync(path.join(root, "app/globals.css"), "utf8");
    expect(css).not.toContain("--shadow-card");
  });
});
