"use client";

import { useRef, useState } from "react";

const results = {
  idle: { label: "Copy email", status: "" },
  copied: { label: "Copied", status: "Email address copied" },
  failed: { label: "Couldn't copy", status: "Couldn't copy the email address" },
};

type Result = keyof typeof results;

export function CopyEmail({ email }: { email: string }) {
  const [result, setResult] = useState<Result>("idle");
  const resetTimer = useRef<number>(undefined);

  async function copy() {
    let next: Result = "copied";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      next = "failed";
    }
    window.clearTimeout(resetTimer.current);
    setResult(next);
    resetTimer.current = window.setTimeout(() => setResult("idle"), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="text-accent text-sm font-medium hover:underline"
      >
        {results[result].label}
      </button>
      <span role="status" className="sr-only">
        {results[result].status}
      </span>
    </>
  );
}
