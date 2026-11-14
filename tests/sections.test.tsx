import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "@/components/section";
import { About } from "@/components/sections/about";
import { CaseStudyBody } from "@/components/sections/case-study";
import { Hero } from "@/components/sections/hero";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { SubscribeBlock } from "@/components/subscribe";
import { nextSelectedWork, site } from "@/content/site";
import { btnGhost, btnPrimary } from "@/lib/ui";
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

const { email, linkedin } = site.contact;

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

const threeXml = readFileSync(
  path.join(__dirname, "fixtures/writing/three-posts.xml"),
  "utf8",
);

const SUBSCRIBE_LINK = {
  href: writingSubscribeUrl(site.substack),
  text: "Subscribe (opens Substack)",
  target: "_blank",
};

describe("case-study supporting figures", () => {
  it("renders each item's supporting figures under the headline panel", () => {
    for (const item of site.selectedWork) {
      expect(item.panel.supporting?.length, item.slug).toBeGreaterThanOrEqual(
        1,
      );
      const html = renderToStaticMarkup(<CaseStudyBody item={item} />);
      for (const figure of item.panel.supporting ?? []) {
        expect(textOf(html)).toContain(figure.value);
        expect(textOf(html)).toContain(figure.label);
      }
    }
  });
});

describe("subscribe form", () => {
  it("renders a labelled email field that submits by GET to Substack", () => {
    const html = renderToStaticMarkup(<SubscribeBlock level={2} form />);
    expect(html).toContain(`action="${writingSubscribeUrl(site.substack)}"`);
    expect(html).toContain('method="get"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="noopener noreferrer"/);
    expect(html).toMatch(/<label[^>]*for="subscribe-email"/);
    expect(html).toMatch(/<input[^>]*type="email"/);
    expect(html).toMatch(/<input[^>]*name="email"/);
    expect(html).toMatch(/<input[^>]*required/);
    expect(html).toMatch(
      /<input[^>]*autoComplete="email"|autocomplete="email"/,
    );
    expect(html).toContain(btnPrimary);
    expect(html).not.toContain("<iframe");
  });

  it("renders nothing when the configured URL is not an https Substack host we own", () => {
    const previous = site.substack.url;
    site.substack.url = "javascript:alert(1)";
    try {
      expect(renderToStaticMarkup(<SubscribeBlock form />)).toBe("");
    } finally {
      site.substack.url = previous;
    }
  });
});

describe("hero", () => {
  const html = renderToStaticMarkup(<Hero />);

  it("shows one name heading and the introduction", () => {
    expect(textOf(html)).toContain(site.positioning.intro);
    expect(headings(html, "h1")).toEqual([site.positioning.name]);
    expect(html).not.toContain(site.positioning.headline);
  });

  it("offers selected work and the résumé while there are no posts, and no subscribe", () => {
    expect(links(html)).toMatchObject([
      { href: "#work", text: site.positioning.workAction },
      { href: site.contact.resumePage, text: "Résumé" },
    ]);
    expect(html).toContain(btnPrimary);
    expect(html).not.toMatch(/coming soon/i);
    expect(html).not.toContain(site.writing.readLatest);
  });

  it("links the latest essay on this site when the feed has its body", () => {
    const [latest] = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    const filled = renderToStaticMarkup(<Hero latest={latest} />);
    expect(links(filled)).toMatchObject([
      { href: "/writing/zxq-aurora/", text: site.writing.readLatest },
      { href: site.contact.resumePage, text: "Résumé" },
    ]);
  });

  it("falls back to Substack for a latest essay without a body", () => {
    const [, beacon] = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    const filled = renderToStaticMarkup(<Hero latest={beacon} />);
    expect(links(filled)).toMatchObject([
      {
        href: beacon.href,
        text: `${site.writing.readLatest} (opens Substack)`,
        target: "_blank",
      },
      { href: site.contact.resumePage, text: "Résumé" },
    ]);
  });

  it("sizes the headline with the shared display classes", () => {
    expect(html).toContain(
      "measure font-display text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance",
    );
    expect(html).not.toContain("text-lg");
    expect(html).not.toContain("text-[1.0625rem]");
  });
});

describe("writing", () => {
  it("shows the empty copy, not a Substack link, when nothing was held back", () => {
    const html = renderToStaticMarkup(<Writing posts={[]} />);
    expect(textOf(html)).toContain(site.writing.empty);
    expect(textOf(html)).not.toContain("on Substack");
  });

  it("offers a direct publication link only when snapshot posts could not be shown", () => {
    const html = renderToStaticMarkup(<Writing posts={[]} unavailable />);
    expect(textOf(html)).toContain("Read Worth Mulling on Substack");
    expect(textOf(html)).not.toContain(site.writing.empty);
    expect(links(html)).toEqual([
      { href: site.substack.url, text: "Read Worth Mulling on Substack" },
      SUBSCRIBE_LINK,
    ]);
  });

  it("shows the coming-soon line and the subscribe block when there are 0 posts", () => {
    const html = renderToStaticMarkup(<Writing posts={[]} />);
    const text = textOf(html);
    const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(
      ([, inner]) => textOf(inner),
    );
    expect(headings(html, "h2")).toEqual([site.writing.latestTitle]);
    expect(headings(html, "h3")).toEqual([site.writing.subscribe.title]);
    expect(paragraphs).toContain(site.writing.empty);
    expect(paragraphs).toContain(site.writing.subscribe.body);
    expect(paragraphs).toContain(site.writing.subscribe.note);
    expect(text).not.toContain("01 / Essays");
    expect(text).not.toContain(site.writing.allEssays);
    expect(html).not.toMatch(/<ol\b/);
    expect(html).not.toMatch(/skeleton|card|placeholder/i);
    expect(links(html)).toEqual([SUBSCRIBE_LINK]);
    expect(html).toMatch(/rel="noopener noreferrer"/);
    expect(html).toContain(btnGhost);
    expect(html).toContain("size-[16px]");
  });

  it("gives the empty and filled writing sections the same section padding", () => {
    const empty = renderToStaticMarkup(<Writing posts={[]} />);
    expect(empty).toContain("py-[var(--spacing-section)]");
    expect(empty).not.toContain("py-10");
    expect(empty).not.toContain("py-16");

    const filled = renderToStaticMarkup(
      <Writing posts={parseFeed(threeXml, WRITING_FIXTURE_BASE)} />,
    );
    expect(filled).toContain("py-[var(--spacing-section)]");
    expect(filled).not.toContain("py-10");
    expect(filled).not.toContain("py-16");
  });

  it("sets the writing heading from site.writing.latestTitle", () => {
    const previous = site.writing.latestTitle;
    const alt = "ZXQ Latest Heading";
    site.writing.latestTitle = alt;
    try {
      const html = renderToStaticMarkup(<Writing posts={[]} />);
      expect(html).toContain('id="writing"');
      expect(headings(html, "h2")).toEqual([alt]);
    } finally {
      site.writing.latestTitle = previous;
    }
  });

  it("lists three fixture posts newest first with Chicago dates, then subscribe", () => {
    const fixturePosts = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    expect(fixturePosts.map((post) => post.title)).toEqual([
      ...WRITING_FIXTURE_TITLES,
    ]);
    const html = renderToStaticMarkup(<Writing posts={fixturePosts} />);
    const text = textOf(html);
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
    expect(text).not.toContain(site.writing.allEssays);
    expect(text).not.toContain(site.writing.empty);
    expect(links(html)).toEqual([
      { href: "/writing/zxq-aurora/", text: WRITING_FIXTURE_TITLES[0] },
      {
        href: `${WRITING_FIXTURE_BASE}/p/zxq-beacon`,
        text: `${WRITING_FIXTURE_TITLES[1]} (opens Substack)`,
        target: "_blank",
      },
      { href: "/writing/zxq-cedar/", text: WRITING_FIXTURE_TITLES[2] },
      SUBSCRIBE_LINK,
    ]);
  });

  it("gives a lone essay a longer summary", () => {
    const [only] = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    const html = renderToStaticMarkup(<Writing posts={[only]} />);
    expect(html).toContain("line-clamp-3");
    expect(html).not.toContain("line-clamp-2");
  });

  it("shows the three newest and an All essays link past three posts", () => {
    const posts = parseFeed(threeXml, WRITING_FIXTURE_BASE);
    const four = [
      ...posts,
      {
        ...posts[2],
        href: `${WRITING_FIXTURE_BASE}/p/zxq-delta`,
        title: "ZXQ Delta",
      },
    ];
    const html = renderToStaticMarkup(<Writing posts={four} />);
    expect(html).not.toContain("ZXQ Delta");
    expect(links(html)).toContainEqual({
      href: "/writing/",
      text: site.writing.allEssays,
    });
  });

  it("follows a swapped Substack base for feed, subscribe, and allowed host", () => {
    const previous = site.substack.url;
    const alt = "https://altname.substack.com";
    site.substack.url = alt;
    try {
      expect(writingSubscribeUrl(site.substack)).toBe(`${alt}/subscribe`);
      expect(writingFeedUrl(site.substack)).toBe(`${alt}/feed`);
      expect(isOwnWritingUrl(`${alt}/p/kept`, site.substack.url)).toBe(true);
      expect(
        isOwnWritingUrl(`${WRITING_FIXTURE_BASE}/p/old`, site.substack.url),
      ).toBe(false);

      const html = renderToStaticMarkup(<Writing posts={[]} />);
      expect(links(html)).toEqual([
        {
          href: `${alt}/subscribe`,
          text: "Subscribe (opens Substack)",
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
      renderToStaticMarkup(<SelectedWork />),
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

  it("keeps the homepage focused on Writing, Work, and About", () => {
    const page = readFileSync(
      path.resolve(__dirname, "../app/page.tsx"),
      "utf8",
    );
    expect(page).not.toMatch(/\bCapabilities\b/);
    expect(page).not.toMatch(/sections\/capabilities/);
    expect(page).not.toMatch(/<HowIWork|<Experience/);
    expect(
      existsSync(
        path.resolve(__dirname, "../components/sections/capabilities.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.resolve(__dirname, "../components/sections/experience.tsx"),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.resolve(__dirname, "../components/sections/how-i-work.tsx"),
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
      if (source.includes("mb-5 max-w-2xl sm:mb-8")) {
        leftover.push(`components/sections/${file}`);
      }
    }

    expect(leftover).toEqual([]);

    const shared = readFileSync(
      path.join(root, "components/section.tsx"),
      "utf8",
    );
    expect(shared.match(/mb-5 max-w-2xl sm:mb-8/g) ?? []).toHaveLength(1);

    const heading = renderToStaticMarkup(<SectionHeading title="Experience" />);
    expect(heading).toContain("mb-5");
    expect(heading).toContain("max-w-2xl");
    expect(heading).toContain("sm:mb-8");

    const about = renderToStaticMarkup(<About />);
    expect(about).toContain("mb-5");
    expect(about).toContain("max-w-2xl");
    expect(about).toContain("sm:mb-8");
  });
});

describe("selected work", () => {
  it("renders a compact list of all four case studies", () => {
    const html = renderToStaticMarkup(<SelectedWork />);
    expect(html).toContain('role="list"');
    expect(html).not.toContain("<article");
    expect(links(html)).toEqual(
      site.selectedWork.map(({ slug, title, preview, panel }) => ({
        href: expect.stringMatching(new RegExp(`^/work/${slug}/?$`)),
        text: `${title} ${preview} ${panel.value} ${panel.label}`,
      })),
    );
  });
});

describe("about and contact", () => {
  const html = renderToStaticMarkup(<About />);

  it("keeps the #about and #contact anchors and renders the bio and invitation once", () => {
    expect(html).toContain('id="about"');
    expect(html).toContain('id="contact"');
    expect(html).not.toContain("Invite me to speak");
    for (const paragraph of [...site.about.bio, site.contact.intro]) {
      expect(textOf(html).split(paragraph).length - 1).toBe(1);
    }
  });

  it("renders the career path from site.experience, newest start first", () => {
    const path = textOf(
      html.match(/data-testid="career-path"[^>]*>([\s\S]*?)<\/p>/)![1],
    );
    expect(path.startsWith("Tesla 2023 to now · Waymo 2022 to 2023 · ")).toBe(
      true,
    );
    expect(path).toContain("Apple 2021 to 2022");
  });

  it("offers email with a copy button, LinkedIn and the résumé, and no form", () => {
    expect(links(html)).toMatchObject([
      { href: `mailto:${email}`, text: email },
      { href: linkedin, text: "LinkedIn", target: "_blank" },
      { href: site.contact.resumePage, text: "Résumé" },
    ]);
    expect(html).toMatch(/<button\b[^>]*>Copy email<\/button>/);
    expect(html).not.toMatch(/<(form|input|textarea)\b/);
  });

  it("keeps Section on a single contained path", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../components/section.tsx"),
      "utf8",
    );
    expect(source).not.toContain("contained");
  });
});

describe("selected work figures", () => {
  it("shows each panel value and label in its row", () => {
    const html = renderToStaticMarkup(<SelectedWork />);
    for (const { panel } of site.selectedWork) {
      expect(textOf(html)).toContain(panel.value);
      expect(textOf(html)).toContain(panel.label);
    }
  });
});
