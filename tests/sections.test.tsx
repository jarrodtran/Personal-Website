import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { site } from "@/content/site";

const entities: Record<string, string> = {
  "&amp;": "&",
  "&#x27;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
};

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|#x27|quot|lt|gt);/g, (entity) => entities[entity])
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(attributes: string, name: string): string | undefined {
  return attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function links(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(
    ([, attributes, inner]) => ({
      href: attribute(attributes, "href"),
      text: textOf(inner),
      download: attribute(attributes, "download"),
      target: attribute(attributes, "target"),
    }),
  );
}

function headings(html: string, tag: string): string[] {
  return [
    ...html.matchAll(new RegExp(`<${tag}\\b[^>]*>(.*?)</${tag}>`, "g")),
  ].map(([, inner]) => textOf(inner));
}

describe("hero", () => {
  const html = renderToStaticMarkup(<Hero />);

  it("shows the headline and the one-line role, nothing more", () => {
    const { status, name, headline, currentRole, currentCompany, location } =
      site.positioning;
    expect(textOf(html)).toBe(
      `${status} / ${name} ${headline} ${currentRole} · ${currentCompany} · ${location} Résumé Email LinkedIn`,
    );
  });

  it("offers exactly three actions: résumé, email, LinkedIn", () => {
    expect(links(html)).toEqual([
      {
        href: "/resume.pdf",
        text: "Résumé",
        download: "Jarrod-Tran-Resume.pdf",
      },
      { href: "mailto:jarrodtran@outlook.com", text: "Email" },
      {
        href: "https://www.linkedin.com/in/jarrodtran/",
        text: "LinkedIn",
        target: "_blank",
      },
    ]);
  });
});

describe("experience", () => {
  const html = renderToStaticMarkup(<Experience />);

  it("lists each employer once, most recent first", () => {
    expect(headings(html, "h3")).toEqual(["Tesla", "Waymo", "Apple"]);
  });

  it("keeps both Tesla stints under one entry and says when Jarrod returned", () => {
    const tesla = html.slice(html.indexOf(">Tesla<"), html.indexOf(">Waymo<"));
    expect(headings(tesla, "h4")).toEqual([
      "Lead, AI Enablement & Factory Strategy",
      "Program Manager, Special Projects",
    ]);
    expect(textOf(tesla)).toContain("Rejoined in 2023 after Apple and Waymo.");
    expect(textOf(tesla)).toContain("Aug 2023 – Present");
    expect(textOf(tesla)).toContain("Jun 2018 – Jun 2021");
  });
});

describe("contact", () => {
  const html = renderToStaticMarkup(<Contact />);

  it("names all four audiences Jarrod is talking to", () => {
    const text = textOf(html);
    for (const audience of [
      "growth-stage tech",
      "consulting",
      "early-stage startups",
      "VC-adjacent operator seats",
    ]) {
      expect(text).toContain(audience);
    }
  });

  it("offers email with a copy button, LinkedIn, and the résumé, and no form", () => {
    expect(links(html)).toEqual([
      { href: "mailto:jarrodtran@outlook.com", text: "jarrodtran@outlook.com" },
      {
        href: "https://www.linkedin.com/in/jarrodtran/",
        text: "linkedin.com/in/jarrodtran",
        target: "_blank",
      },
      {
        href: "/resume.pdf",
        text: "Download résumé (PDF)",
        download: "Jarrod-Tran-Resume.pdf",
      },
    ]);
    expect(html).toMatch(/<button\b[^>]*>Copy email<\/button>/);
    expect(html).not.toMatch(/<(form|input|textarea)\b/);
  });

  it("adds a calendar link only when one is configured", () => {
    site.contact.calendar = "https://example.com/book";
    try {
      expect(links(renderToStaticMarkup(<Contact />))).toContainEqual({
        href: "https://example.com/book",
        text: "Book a call",
        target: "_blank",
      });
    } finally {
      delete site.contact.calendar;
    }
  });
});
