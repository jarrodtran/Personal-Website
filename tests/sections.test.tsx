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

const { email, linkedin, resumeHref, resumeFilename } = site.contact;

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
      { href: resumeHref, text: "Résumé", download: resumeFilename },
      { href: `mailto:${email}`, text: "Email" },
      { href: linkedin, text: "LinkedIn", target: "_blank" },
    ]);
  });
});

describe("experience", () => {
  const html = renderToStaticMarkup(<Experience />);
  const companies = site.experience.map((employer) => employer.company);

  it("lists each employer once", () => {
    expect(headings(html, "h3")).toEqual(companies);
    expect(new Set(companies).size).toBe(companies.length);
  });

  it("nests each role, with its dates, under its employer", () => {
    const starts = companies.map((company) => html.indexOf(`>${company}<`));
    site.experience.forEach((employer, index) => {
      const entry = html.slice(starts[index], starts[index + 1]);
      expect(headings(entry, "h4")).toEqual(
        employer.roles.map((role) => role.title),
      );
      for (const role of employer.roles) {
        expect(textOf(entry)).toContain(role.dates);
      }
      if (employer.note) {
        expect(textOf(entry)).toContain(employer.note);
      }
    });
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

  it("offers email with a copy button, LinkedIn, the résumé, and the calendar when set, and no form", () => {
    const { calendar } = site.contact;
    expect(links(html)).toEqual([
      { href: `mailto:${email}`, text: email },
      {
        href: linkedin,
        text: expect.stringMatching(/^linkedin\.com\/in\/[^/]+$/),
        target: "_blank",
      },
      {
        href: resumeHref,
        text: "Download résumé (PDF)",
        download: resumeFilename,
      },
      ...(calendar
        ? [{ href: calendar, text: "Book a call", target: "_blank" }]
        : []),
    ]);
    expect(html).toMatch(/<button\b[^>]*>Copy email<\/button>/);
    expect(html).not.toMatch(/<(form|input|textarea)\b/);
  });

  it("adds a calendar link when one is configured", () => {
    const configured = site.contact.calendar;
    site.contact.calendar = "https://example.com/book";
    try {
      expect(links(renderToStaticMarkup(<Contact />))).toContainEqual({
        href: "https://example.com/book",
        text: "Book a call",
        target: "_blank",
      });
    } finally {
      site.contact.calendar = configured;
    }
  });
});
