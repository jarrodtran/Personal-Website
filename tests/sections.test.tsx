import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "@/components/section";
import { About } from "@/components/sections/about";
import { CaseStudyBody } from "@/components/sections/case-study";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { HowIWork } from "@/components/sections/how-i-work";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { nextSelectedWork, site } from "@/content/site";
import { btnGhost } from "@/lib/ui";
import {
  formatPostDate,
  isOwnWritingUrl,
  parseFeed,
  writingFeedUrl,
  writingSubscribeUrl,
} from "@/lib/writing";
import {
  WRITING_FIXTURE_BASE,
  WRITING_FIXTURE_TITLES,
} from "./fixtures/writing/titles";

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

const SECTION_EYEBROWS = [
  "01 / Essays",
  "02 / Profile",
  "03 / Career",
  "04 / Case studies",
  "05 / Approach",
  "06 / Toolkit",
  "07 / Contact",
] as const;

const SECTION_DESCRIPTIONS = [
  "Posts from my Substack.",
  "Tesla, Apple, Waymo. Result first, then how we got it.",
  "Four projects from three companies. Each one starts with the problem and ends with the numbers.",
  "I start from the facts, then build a system the team can run.",
  "The skills I use most, grouped by area.",
] as const;

const CONTACT_INTRO =
  "Growth-stage tech, consulting, early-stage startups, or an operating role at a VC firm. Based in Houston.";

describe("hero", () => {
  const html = renderToStaticMarkup(<Hero />);

  it("shows the headline only", () => {
    expect(textOf(html)).toBe(site.positioning.headline);
    expect(headings(html, "h1")).toEqual([site.positioning.headline]);
  });

  it("does not invent posts, links, or a subscribe placeholder", () => {
    expect(links(html)).toEqual([]);
    expect(html).not.toMatch(/substack/i);
    expect(html).not.toMatch(/subscribe/i);
    expect(html).not.toMatch(/coming soon/i);
  });

  it("sizes the headline with the shared display classes", () => {
    expect(html).toContain(
      "measure font-display text-[min(1.75rem,15cqi)] leading-[1.15] tracking-tight text-balance sm:text-[min(2.25rem,9cqi)]",
    );
    expect(html).not.toContain("text-lg");
    expect(html).not.toContain("text-[1.0625rem]");
  });
});

const EMPTY_WRITING =
  "Nothing published yet. Subscribe and the first post will land in your inbox.";
const threeXml = readFileSync(
  path.join(__dirname, "fixtures/writing/three-posts.xml"),
  "utf8",
);

describe("writing", () => {
  it("shows the empty-state copy and subscribe link when there are 0 posts", () => {
    const html = renderToStaticMarkup(<Writing posts={[]} />);
    const text = textOf(html);
    expect(text).toContain(site.substack.name);
    expect(text).not.toContain("01 / Essays");
    expect(text).not.toContain("Posts from my Substack.");
    expect(text).toContain(EMPTY_WRITING);
    expect(text).not.toContain("First post soon");
    expect(text).not.toContain("All writing");
    expect(html).not.toMatch(/<ol\b/);
    expect(html).not.toMatch(/skeleton|card|placeholder/i);
    expect(links(html)).toEqual([
      {
        href: writingSubscribeUrl(site.substack),
        text: "Subscribe on Substack",
        target: "_blank",
      },
    ]);
    expect(html).toMatch(/rel="noopener noreferrer"/);
    expect(html).toContain(btnGhost);
    expect(html).toContain("size-[16px]");
    expect(html).toMatch(/max-w-2xl[\s\S]*Subscribe on Substack/);
    expect(html).toMatch(
      /mt-6[\s\S]*Subscribe on Substack|Subscribe on Substack[\s\S]*mt-6/,
    );
  });

  it("sets the writing heading from site.substack.name", () => {
    const previous = site.substack.name;
    const alt = "ZXQ Writing Publication Name";
    site.substack.name = alt;
    try {
      const html = renderToStaticMarkup(<Writing posts={[]} />);
      expect(html).toContain('id="writing"');
      expect(headings(html, "h2")).toEqual([alt]);
    } finally {
      site.substack.name = previous;
    }
  });

  it("lists three fixture posts newest first with Chicago dates, then subscribe", () => {
    const fixturePosts = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    expect(fixturePosts.map((post) => post.title)).toEqual([
      ...WRITING_FIXTURE_TITLES,
    ]);
    const html = renderToStaticMarkup(<Writing posts={fixturePosts} />);
    const text = textOf(html);
    expect(text).not.toContain("Posts from my Substack.");
    const aurora = text.indexOf(WRITING_FIXTURE_TITLES[0]);
    const beacon = text.indexOf(WRITING_FIXTURE_TITLES[1]);
    const cedar = text.indexOf(WRITING_FIXTURE_TITLES[2]);
    expect(aurora).toBeGreaterThan(-1);
    expect(beacon).toBeGreaterThan(aurora);
    expect(cedar).toBeGreaterThan(beacon);
    expect(text).toContain(formatPostDate("2026-11-02T18:00:00.000Z"));
    expect(text).toContain("2 Nov 2026");
    expect(text).toContain("1 Nov 2026");
    expect(text).toContain("15 Oct 2026");
    expect(html).toMatch(
      /<time[^>]*dateTime="2026-11-02T18:00:00.000Z"[^>]*>2 Nov 2026<\/time>/,
    );
    expect(html).toMatch(
      /<time[^>]*dateTime="2026-11-02T05:00:00.000Z"[^>]*>1 Nov 2026<\/time>/,
    );
    expect(html).toContain("line-clamp-2");
    expect(html).toContain("(opens Substack)");
    expect(html).toContain("size-[16px]");
    expect(html).toMatch(
      /<ol\b[^>]*>[\s\S]*<a\b[^>]*\bno-underline\b[^>]*\bhover:underline\b/,
    );
    expect(html).toMatch(/rel="noopener noreferrer"/);
    expect(html).not.toContain("All writing");
    expect(html).not.toContain("First post soon");
    expect(links(html)).toEqual([
      {
        href: `${WRITING_FIXTURE_BASE}/p/zxq-aurora`,
        text: `${WRITING_FIXTURE_TITLES[0]} (opens Substack)`,
        target: "_blank",
      },
      {
        href: `${WRITING_FIXTURE_BASE}/p/zxq-beacon`,
        text: `${WRITING_FIXTURE_TITLES[1]} (opens Substack)`,
        target: "_blank",
      },
      {
        href: `${WRITING_FIXTURE_BASE}/p/zxq-cedar`,
        text: `${WRITING_FIXTURE_TITLES[2]} (opens Substack)`,
        target: "_blank",
      },
      {
        href: writingSubscribeUrl(site.substack),
        text: "Subscribe on Substack",
        target: "_blank",
      },
    ]);
  });

  it("follows a swapped Substack base for feed, subscribe, and allowed host", () => {
    const previous = site.substack.url;
    const alt = "https://altname.substack.com";
    site.substack.url = alt;
    try {
      expect(writingSubscribeUrl(site.substack)).toBe(alt);
      expect(writingFeedUrl(site.substack)).toBe(`${alt}/feed`);
      expect(isOwnWritingUrl(`${alt}/p/kept`, site.substack.url)).toBe(true);
      expect(
        isOwnWritingUrl(`${WRITING_FIXTURE_BASE}/p/old`, site.substack.url),
      ).toBe(false);

      const html = renderToStaticMarkup(<Writing posts={[]} />);
      expect(links(html)).toEqual([
        {
          href: alt,
          text: "Subscribe on Substack",
          target: "_blank",
        },
      ]);

      const xml = `<?xml version="1.0"?><rss><channel>
<item>
  <title>Kept on alt</title>
  <link>${alt}/p/kept</link>
  <pubDate>Mon, 02 Nov 2026 18:00:00 GMT</pubDate>
  <description>Alt post.</description>
</item>
<item>
  <title>Dropped old host</title>
  <link>${WRITING_FIXTURE_BASE}/p/old</link>
  <pubDate>Tue, 03 Nov 2026 18:00:00 GMT</pubDate>
  <description>Should drop.</description>
</item>
</channel></rss>`;
      expect(
        parseFeed(xml, site.substack.url).map((post) => post.href),
      ).toEqual([`${alt}/p/kept`]);
    } finally {
      site.substack.url = previous;
    }
  });
});

describe("body text size", () => {
  it("uses 18px body text and does not keep a 17px empty-state exception", () => {
    const root = path.resolve(__dirname, "..");
    const leftovers: string[] = [];

    for (const dir of ["components", "app"]) {
      for (const file of readdirSync(path.join(root, dir), {
        recursive: true,
        encoding: "utf8",
      })) {
        if (!/\.(tsx|ts)$/.test(file)) continue;
        const relative = `${dir}/${file}`;
        if (relative === "app/globals.css") continue;
        const source = readFileSync(path.join(root, dir, file), "utf8");
        for (const [index, line] of source.split("\n").entries()) {
          if (!line.includes("text-[1.0625rem]")) continue;
          leftovers.push(`${relative}:${index + 1}`);
        }
      }
    }

    expect(leftovers).toEqual([]);
  });
});

describe("section headings", () => {
  it("renders each section heading as one h2 with no eyebrow or description text", () => {
    const html = [
      renderToStaticMarkup(<Writing posts={[]} />),
      renderToStaticMarkup(<About />),
      renderToStaticMarkup(<Experience />),
      renderToStaticMarkup(<SelectedWork />),
      renderToStaticMarkup(<HowIWork />),
      renderToStaticMarkup(<Contact />),
    ].join("\n");
    const text = textOf(html);

    for (const eyebrow of SECTION_EYEBROWS) {
      expect(text).not.toContain(eyebrow);
    }
    for (const description of SECTION_DESCRIPTIONS) {
      expect(text).not.toContain(description);
    }

    const heading = renderToStaticMarkup(<SectionHeading title="Experience" />);
    expect(heading).toMatch(/<h2\b[^>]*>Experience<\/h2>/);
    expect(heading).not.toContain("<p");
    expect(heading.match(/<h2\b/g) ?? []).toHaveLength(1);
  });

  it("has no Capabilities section and still renders How I work", () => {
    const page = readFileSync(path.resolve(__dirname, "../app/page.tsx"), "utf8");
    expect(page).not.toMatch(/\bCapabilities\b/);
    expect(page).not.toMatch(/sections\/capabilities/);
    expect(page).toContain("HowIWork");
    expect(page).toContain("@/components/sections/how-i-work");
    expect(page).toContain("<HowIWork");

    const html = renderToStaticMarkup(<HowIWork />);
    expect(headings(html, "h2")).toEqual([site.sections.approach.title]);
    expect(html).toContain('id="approach"');
    expect(textOf(html)).toContain("How I work");
    for (const principle of site.principles) {
      expect(textOf(html)).toContain(principle.title);
    }

    expect(
      existsSync(
        path.resolve(__dirname, "../components/sections/capabilities.tsx"),
      ),
    ).toBe(false);
  });

  it("gives every section heading the shared spacing from one place", () => {
    const root = path.resolve(__dirname, "..");
    const leftover: string[] = [];
    const sectionDir = path.join(root, "components/sections");

    for (const file of readdirSync(sectionDir)) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(path.join(sectionDir, file), "utf8");
      if (source.includes("mb-10 max-w-2xl sm:mb-12")) {
        leftover.push(`components/sections/${file}`);
      }
    }

    expect(leftover).toEqual([]);

    const shared = readFileSync(
      path.join(root, "components/section.tsx"),
      "utf8",
    );
    expect(shared.match(/mb-10 max-w-2xl sm:mb-12/g) ?? []).toHaveLength(1);

    const heading = renderToStaticMarkup(<SectionHeading title="Experience" />);
    expect(heading).toContain("mb-10");
    expect(heading).toContain("max-w-2xl");
    expect(heading).toContain("sm:mb-12");

    const contact = renderToStaticMarkup(<Contact />);
    expect(contact).toContain("mb-10");
    expect(contact).toContain("max-w-2xl");
    expect(contact).toContain("sm:mb-12");
    expect(contact).toMatch(/<h2\b[^>]*>[\s\S]*?<\/h2>\s*<p\b[^>]*\bmt-4\b/);
  });
});

function markupById(html: string, id: string): string {
  const idAttr = `id="${id}"`;
  const idAt = html.indexOf(idAttr);
  expect(idAt, `missing #${id}`).toBeGreaterThan(-1);
  return html.slice(html.lastIndexOf("<", idAt));
}

describe("selected work cards", () => {
  it("makes each card title the only link and drops kickers, meta labels, and the case-study row", () => {
    const html = renderToStaticMarkup(<SelectedWork />);
    const work = markupById(html, "work");
    const workText = textOf(work);
    const articles = [
      ...work.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g),
    ].map(([article]) => article);

    expect(articles).toHaveLength(site.selectedWork.length);

    site.selectedWork.forEach((item, index) => {
      const article = articles[index];
      const articleLinks = links(article);
      expect(articleLinks).toHaveLength(1);
      expect(articleLinks[0].href).toMatch(
        new RegExp(`^/work/${item.slug}/?$`),
      );
      expect(articleLinks[0].text).toBe(item.title);

      const paragraphs = [
        ...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g),
      ].map(([, inner]) => textOf(inner));
      expect(paragraphs).not.toContain(item.panel.kicker);
    });

    expect(workText).not.toContain("Read the case study");

    const workParagraphs = [...work.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(
      ([, inner]) => textOf(inner),
    );
    expect(workParagraphs).not.toContain("Problem");
    expect(workParagraphs).not.toContain("What I did");
    expect(workParagraphs).not.toContain("Outcome");
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
      "Growth-stage tech",
      "consulting",
      "early-stage startups",
      "operating role at a VC firm",
    ]) {
      expect(text).toContain(audience);
    }
  });

  it("renders the contact intro under the Contact h2", () => {
    expect(site.contact.intro).toBe(CONTACT_INTRO);
    expect(html).toMatch(
      new RegExp(
        `<h2\\b[^>]*>${site.sections.contact.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h2>\\s*<p\\b[^>]*>${CONTACT_INTRO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</p>`,
      ),
    );
  });

  it("offers email with a copy button, LinkedIn, a speaking invite, the résumé, and the calendar when set, and no form", () => {
    const { calendar } = site.contact;
    expect(links(html)).toEqual([
      { href: `mailto:${email}`, text: email },
      {
        href: linkedin,
        text: expect.stringMatching(/^linkedin\.com\/in\/[^/]+$/),
        target: "_blank",
      },
      {
        href: `mailto:${email}?subject=Speaking%20invitation`,
        text: "Invite me to speak",
      },
      {
        href: resumeHref,
        text: "Résumé",
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

describe("case study", () => {
  const item = site.selectedWork[0];
  const html = renderToStaticMarkup(<CaseStudyBody item={item} />);
  const next = nextSelectedWork(item.slug);

  it("lets a reader skim the problem, see the proof, and reach the next link", () => {
    const text = textOf(html);
    expect(text.indexOf(item.problem)).toBeGreaterThan(-1);
    expect(text.indexOf(item.panel.value)).toBeGreaterThan(
      text.indexOf(item.problem),
    );
    expect(next).toBeDefined();
    expect(text.indexOf(`Next: ${next!.title}`)).toBeGreaterThan(
      text.indexOf(item.panel.value),
    );
    expect(html).toMatch(new RegExp(`/work/${next!.slug}/?`));
  });
});
