import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";

let mockedPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

import { Nav, sectionHash } from "@/components/nav";

function renderNav(pathname: string) {
  mockedPathname = pathname;
  return renderToStaticMarkup(
    <Nav
      name={site.positioning.name}
      items={site.nav}
      resumeHref={site.contact.resumeHref}
      resumeFilename={site.contact.resumeFilename}
    />,
  );
}

function linkAttributes(html: string, label: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(
    ([, , inner]) => inner.trim() === label,
  )?.[1];
}

describe("Nav active route and control states", () => {
  it("marks Work as the current nav item with an underline when viewing a case study route", () => {
    const html = renderNav(`/work/${site.selectedWork[0].slug}/`);
    const workLink = linkAttributes(html, "Work");

    expect(workLink).toBeDefined();
    expect(workLink).toContain('aria-current="location"');
    expect(workLink).toContain("underline");
    expect(workLink).toContain("underline-offset-8");
  });

  it("does not mark any section link as current on the home route before scrolling", () => {
    expect(renderNav("/")).not.toContain('aria-current="location"');
  });

  it("clears the current section while the hero is still fully in view", () => {
    expect(sectionHash("writing", 1)).toBe("");
    expect(sectionHash("writing", 0)).toBe("");
    expect(sectionHash("writing", -1)).toBe("#writing");
    expect(sectionHash("top", -40)).toBe("");
  });

  it("gives the mobile menu toggle a hover border transition", () => {
    const menuButton = renderNav("/").match(
      /<button\b[^>]*aria-controls="mobile-nav"[^>]*>/,
    )?.[0];
    expect(menuButton).toBeDefined();
    expect(menuButton).toContain("hover:border-foreground/40");
    expect(menuButton).toContain("transition-colors");
  });
});
