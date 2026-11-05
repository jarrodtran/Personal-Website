import { describe, expect, it } from "vitest";
import { evaluateGates } from "../scripts/gates.mjs";

const HEAD = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OLD = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

type Comment = {
  author: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function comment(
  body: string,
  extras: Partial<Omit<Comment, "body">> = {},
): Comment {
  const created_at = extras.created_at ?? "2026-11-05T00:00:00Z";
  return {
    author: extras.author ?? "jarrodtran",
    body,
    created_at,
    updated_at: extras.updated_at ?? created_at,
  };
}

function gateLine(
  gate: "design" | "qa" | "review",
  verdict: "PASS" | "FAIL",
  sha: string,
  extra = "",
) {
  return extra
    ? `GATE ${gate} ${verdict} ${sha} ${extra}`
    : `GATE ${gate} ${verdict} ${sha}`;
}

function twoPasses(sha: string): Comment[] {
  return [
    comment(gateLine("design", "PASS", sha)),
    comment(gateLine("qa", "PASS", sha), {
      created_at: "2026-11-05T00:00:01Z",
    }),
  ];
}

function threePasses(sha: string): Comment[] {
  return [
    ...twoPasses(sha),
    comment(`${gateLine("review", "PASS", sha)} touches: none`, {
      created_at: "2026-11-05T00:00:02Z",
    }),
  ];
}

describe("evaluateGates", () => {
  it("2 of 3 passes is red and lists the missing review", () => {
    const result = evaluateGates(twoPasses(HEAD), HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain(`design PASS ${HEAD}`);
    expect(result.summary).toContain(`qa PASS ${HEAD}`);
    expect(result.summary).toContain("review missing");
  });

  it("3 passes is green", () => {
    const result = evaluateGates(threePasses(HEAD), HEAD, [], {});

    expect(result.pass).toBe(true);
    expect(result.summary).toContain(`design PASS ${HEAD}`);
    expect(result.summary).toContain(`qa PASS ${HEAD}`);
    expect(result.summary).toContain(`review PASS ${HEAD}`);
  });

  it("FAIL after PASS is red", () => {
    const comments = [
      ...threePasses(HEAD),
      comment(gateLine("design", "FAIL", HEAD), {
        created_at: "2026-11-05T00:00:03Z",
      }),
    ];

    const result = evaluateGates(comments, HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain(`design FAIL ${HEAD}`);
  });

  it("a short sha is ignored", () => {
    const comments = [
      comment("GATE design PASS abcdef0123456789abcdef"),
      comment(gateLine("qa", "PASS", HEAD), {
        created_at: "2026-11-05T00:00:01Z",
      }),
      comment(`${gateLine("review", "PASS", HEAD)} touches: none`, {
        created_at: "2026-11-05T00:00:02Z",
      }),
    ];

    const result = evaluateGates(comments, HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain("design missing");
  });

  it("a non-allowlisted author is ignored", () => {
    const comments = threePasses(HEAD).map((entry) => ({
      ...entry,
      author: "outsider",
    }));

    const result = evaluateGates(comments, HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain("design missing");
    expect(result.summary).toContain("qa missing");
    expect(result.summary).toContain("review missing");
  });

  it("an edited comment is ignored", () => {
    const comments = threePasses(HEAD).map((entry) => ({
      ...entry,
      updated_at: "2026-11-05T00:00:10Z",
    }));

    const result = evaluateGates(comments, HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain("design missing");
    expect(result.summary).toContain("qa missing");
    expect(result.summary).toContain("review missing");
  });

  it("touches: dns is red", () => {
    const comments = [
      ...twoPasses(HEAD),
      comment(`${gateLine("review", "PASS", HEAD)} touches: dns`, {
        created_at: "2026-11-05T00:00:02Z",
      }),
    ];

    const result = evaluateGates(comments, HEAD, [], {});

    expect(result.pass).toBe(false);
    expect(result.summary).toContain(`review PASS ${HEAD}`);
    expect(result.summary).toMatch(/touches: dns|missing touches: none/);
  });

  it("carry-forward after a main-only merge is green", () => {
    const result = evaluateGates(threePasses(OLD), HEAD, [OLD], {
      [OLD]: { fetchable: true, samePatchId: true },
    });

    expect(result.pass).toBe(true);
    expect(result.summary).toContain(`design PASS ${OLD}`);
    expect(result.summary).toContain(`qa PASS ${OLD}`);
    expect(result.summary).toContain(`review PASS ${OLD}`);
  });

  it("an own-file change is red", () => {
    const result = evaluateGates(threePasses(OLD), HEAD, [OLD], {
      [OLD]: { fetchable: true, samePatchId: false },
    });

    expect(result.pass).toBe(false);
    expect(result.summary).toMatch(/stale|missing/);
  });

  it("an unfetchable old head is red", () => {
    const result = evaluateGates(threePasses(OLD), HEAD, [OLD], {
      [OLD]: { fetchable: false, samePatchId: true },
    });

    expect(result.pass).toBe(false);
    expect(result.summary).toMatch(/unfetchable|missing|stale/);
  });
});
