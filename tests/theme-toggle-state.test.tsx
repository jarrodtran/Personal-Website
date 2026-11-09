import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

const { theme } = vi.hoisted(() => ({
  theme: { resolvedTheme: "light" as string | undefined },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolvedTheme, setTheme: () => {} }),
}));

function render(): string {
  return renderToStaticMarkup(<ThemeToggle />);
}

describe("theme toggle state", () => {
  beforeEach(() => {
    theme.resolvedTheme = "light";
  });

  it("announces the theme it is currently in", () => {
    theme.resolvedTheme = "dark";
    expect(render()).toContain('aria-pressed="true"');
    theme.resolvedTheme = "light";
    expect(render()).toContain('aria-pressed="false"');
  });

  it("does not claim dark from resolvedTheme alone before it resolves (SSR)", () => {
    theme.resolvedTheme = undefined;
    expect(render()).toContain('aria-pressed="false"');
  });

  it("keeps the label the tap-target and a11y checks select on", () => {
    expect(
      render().match(/aria-label="Toggle color theme"/g) ?? [],
    ).toHaveLength(1);
  });

  it("keeps both icons out of the accessibility tree", () => {
    expect(render().match(/aria-hidden="true"/g) ?? []).toHaveLength(2);
  });
});
