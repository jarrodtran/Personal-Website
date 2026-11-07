import { describe, expect, it } from "vitest";
import { selectedWorkSlugs, site, siteUrl } from "@/content/site";
import { GET } from "@/app/llms.txt/route";
import { buildLlmsTxt } from "@/lib/llms";
import { findPhraseHits, loadBannedPhrases } from "./banned-copy";

describe("llms.txt agent surface", () => {
  it("renders a structured Markdown summary from the shared site content module", () => {
    const body = buildLlmsTxt();

    expect(body).toMatch(/^# Jarrod Tran\n/);
    expect(body).toContain(`> ${site.positioning.valueProp}`);
    expect(body).toContain(site.positioning.currentRole);
    expect(body).toContain(site.about.education);
    expect(body).toContain(site.contact.intro);
    expect(body).toContain(`mailto:${site.contact.email}`);
    expect(body).toContain(site.contact.linkedin);
    expect(body).toContain(`${siteUrl}${site.contact.resumeHref}`);
    expect(body).toContain(`[${site.substack.name}](${site.substack.url})`);

    for (const slug of selectedWorkSlugs()) {
      expect(body).toContain(`${siteUrl}/work/${slug}/`);
    }

    for (const employer of site.experience) {
      expect(body).toContain(`### ${employer.company}`);
      for (const role of employer.roles) {
        expect(body).toContain(`#### ${role.title} (${role.dates})`);
      }
    }
  });

  it("serves plain UTF-8 text from GET /llms.txt with zero banned phrases or dashes", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );

    const text = await response.text();
    expect(text).toBe(buildLlmsTxt());

    const phrases = loadBannedPhrases(process.cwd());
    expect(findPhraseHits(text, phrases)).toEqual([]);
  });
});
