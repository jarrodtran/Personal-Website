import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyEmail } from "@/components/copy-email";

describe("CopyEmail accessibility and lifecycle", () => {
  it("renders a polite atomic live region and cleans up the reset timer on unmount", () => {
    const html = renderToStaticMarkup(
      <CopyEmail email="jarrodtran@outlook.com" />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');

    const source = readFileSync(
      path.resolve(__dirname, "../components/copy-email.tsx"),
      "utf8",
    );
    expect(source).toContain("useEffect");
    expect(source).toMatch(/useEffect\(\(\)\s*=>\s*\(\)\s*=>\s*window\.clearTimeout/);
  });
});
