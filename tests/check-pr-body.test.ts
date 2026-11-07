import { describe, expect, it } from "vitest";
import { checkPrBody } from "../scripts/check-pr-body.mjs";

const HEAD_SHA = "78597ac6167e053591da38e12322dce4b71c4c65";

describe("checkPrBody", () => {
  it("the full head SHA passes", () => {
    expect(checkPrBody(`Head SHA: ${HEAD_SHA}`, HEAD_SHA)).toEqual([]);
  });

  it("a 7-character head prefix passes", () => {
    expect(checkPrBody("Head SHA: 78597ac", HEAD_SHA)).toEqual([]);
  });

  it("a stale SHA fails", () => {
    const errors = checkPrBody(
      "Head SHA: 0000000000000000000000000000000000000000",
      HEAD_SHA,
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it("a body with no marker line passes", () => {
    expect(
      checkPrBody(
        "This body mentions abcdef1234567 but has no Head SHA marker.",
        HEAD_SHA,
      ),
    ).toEqual([]);
  });

  it("an empty body passes", () => {
    expect(checkPrBody("", HEAD_SHA)).toEqual([]);
    expect(checkPrBody(null, HEAD_SHA)).toEqual([]);
  });

  it("a 3-character prefix fails", () => {
    const errors = checkPrBody("Head SHA: 785", HEAD_SHA);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("a bold stale SHA fails", () => {
    const errors = checkPrBody("**Head SHA:** `0000000`", HEAD_SHA);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("lowercase label with a stale SHA fails", () => {
    const errors = checkPrBody("head sha: 0000000", HEAD_SHA);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("the PR template line passes", () => {
    expect(checkPrBody("Keep `Head SHA:` current.", HEAD_SHA)).toEqual([]);
  });

  it("ignores a stale SHA above a current description that passes", () => {
    const body = [
      "Head SHA: 0000000000000000000000000000000000000000",
      "<!-- CURSOR_AGENT_PR_BODY_BEGIN -->",
      `Head SHA: ${HEAD_SHA}`,
      "<!-- CURSOR_AGENT_PR_BODY_END -->",
    ].join("\n");
    expect(checkPrBody(body, HEAD_SHA)).toEqual([]);
  });

  it("a stale SHA inside the current description still fails", () => {
    const body = [
      `Head SHA: ${HEAD_SHA}`,
      "<!-- CURSOR_AGENT_PR_BODY_BEGIN -->",
      "Head SHA: 0000000000000000000000000000000000000000",
      "<!-- CURSOR_AGENT_PR_BODY_END -->",
    ].join("\n");
    expect(checkPrBody(body, HEAD_SHA).length).toBeGreaterThan(0);
  });

  it("an empty current description does not hide a stale SHA", () => {
    const body = [
      "Head SHA: 0000000000000000000000000000000000000000",
      "<!-- CURSOR_AGENT_PR_BODY_BEGIN -->",
      "No head line here.",
      "<!-- CURSOR_AGENT_PR_BODY_END -->",
    ].join("\n");
    expect(checkPrBody(body, HEAD_SHA).length).toBeGreaterThan(0);
  });
});
