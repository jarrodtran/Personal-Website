import sanitizeHtml from "sanitize-html";

/**
 * Substack widgets that only make sense on Substack (subscribe forms, share
 * bars, app nags, embeds). They are dropped with everything inside them.
 */
const SUBSTACK_ONLY =
  /(^|\s)(subscription-widget[\w-]*|subscribe-widget|button-wrapper|captioned-button-wrap|share[\w-]*|digest-post-embed|embedded-post[\w-]*|poll-embed|image-link-expand|youtube-wrap|tweet|instagram|install-substack-app[\w-]*|paywall[\w-]*)(\s|$)/;

const FOOTNOTE_ID = /^footnote-(anchor-)?\d+$/;

const PROSE_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "em",
  "strong",
  "b",
  "i",
  "img",
  "figure",
  "figcaption",
  "pre",
  "code",
  "hr",
  "br",
  "sup",
  "sub",
  "div",
];

const shared = {
  allowedTags: PROSE_TAGS,
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
} satisfies sanitizeHtml.IOptions;

/**
 * Turns a feed post body into the small, safe subset of HTML the essay page
 * styles: prose, links, images, and Substack footnotes. Scripts, styles,
 * iframes, forms, inline handlers, and Substack-only widgets never survive.
 */
export function sanitizeEssayHtml(raw: string): string {
  // Pass 1 keeps classes long enough to find and drop Substack-only blocks.
  const pruned = sanitizeHtml(raw, {
    ...shared,
    allowedAttributes: {
      "*": ["class"],
      a: ["href", "id", "class"],
      img: ["src", "alt", "width", "height"],
    },
    transformTags: { h1: "h2", h5: "h4", h6: "h4" },
    exclusiveFilter: (frame) => SUBSTACK_ONLY.test(frame.attribs.class ?? ""),
  });

  // Pass 2 strips classes and keeps only footnote ids, so nothing in the body
  // can collide with the site's own anchors or pick up site styles by name.
  return sanitizeHtml(pruned, {
    ...shared,
    allowedAttributes: {
      a: ["href", "id"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const { id, ...rest } = attribs;
        return {
          tagName,
          attribs: id && FOOTNOTE_ID.test(id) ? { ...rest, id } : rest,
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
  }).trim();
}

/** Words in the sanitized body, for a reading-time estimate. */
export function essayWordCount(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}
