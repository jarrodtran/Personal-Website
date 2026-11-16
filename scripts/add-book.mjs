// Adds a book to content/library.json and saves its cover under
// public/library/covers/. Book data comes from Open Library; covers from
// Open Library, then Apple Books when Open Library has none.
//
//   pnpm add:book "Poor Charlie's Almanack"
//   pnpm add:book 9780593418369 --category "Investing & Finance"
//   pnpm add:book "Sapiens" --author "Harari" --yes
//   pnpm add:book --fill               # covers for entries added by hand
//   pnpm add:book --fill --meta        # also years and Open Library links
//   pnpm add:book --fill the-prince --source apple --force
//   pnpm add:book --fill the-prince --cover-url https://example.com/c.jpg
//
// Flags: --author, --title (override), --category, --yes (no prompts),
// --fill [slug...], --force (refetch covers), --meta, --source
// (openlibrary|apple), --cover-id (Open Library cover id), --cover-url (any
// https JPEG), --no-cover. Run pnpm library:colors afterwards for shelf colors.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const libraryFile = new URL("content/library.json", root);
const coversDir = new URL("public/library/covers/", root);
const bannedFile = new URL("content/banned-phrases.txt", root);

const USER_AGENT = "personal-library-script/1.0";
const SEARCH_FIELDS =
  "key,title,author_name,cover_i,isbn,subject,first_publish_year";

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** En and em dashes are banned site-wide; turn them into plain punctuation. */
export function cleanText(text) {
  return text
    .replace(/\s*[–—]\s*/g, ": ")
    .replace(/\s+/g, " ")
    .trim();
}

export function bannedPhrases() {
  const phrases = readFileSync(bannedFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  return [...phrases, "–", "—"];
}

export function bannedHits(text, phrases = bannedPhrases()) {
  const lower = text.toLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase.toLowerCase()));
}

function normalizeTitle(title) {
  return slugify(title.split(":")[0]).replace(/^(the|a|an)-/, "");
}

function primaryAuthorSurname(author) {
  const first = author
    .replace(/\(.*?\)/g, "")
    .split(/\s+and\s+|,/)[0]
    .trim();
  const parts = first.split(/\s+/);
  return parts.length > 1 ? parts.at(-1) : "";
}

function isIsbn(query) {
  return /^(97[89])?\d{9}[\dX]$/i.test(query.replace(/[-\s]/g, ""));
}

// First match wins, so the narrow sections come before the broad ones and
// fiction ("nonfiction" excluded) comes last.
const CATEGORY_HINTS = [
  ["Biography & Memoir", /biograph|memoir|autobiograph/],
  [
    "Technology & AI",
    /artificial intelligence|technology|computer|internet|software/,
  ],
  [
    "Venture & Startups",
    /venture capital|startup|new business enterprises|entrepreneur/,
  ],
  [
    "Money & Markets",
    /invest|finance|financial|stock|wealth|money|wall street|bank|real estate/,
  ],
  ["Leadership & Management", /leadership|management|executive|organizational/],
  [
    "Power & Persuasion",
    /\bpower\b|persuasion|negotiat|influence|strateg|military art/,
  ],
  ["History & Economics", /history|economics|economic|politic/],
  ["Philosophy & Psychology", /philosophy|psychology|ethics|religio|stoic/],
  [
    "Productivity & Self-Help",
    /self-help|success|habit|productivity|time management|self-realization/,
  ],
  ["Fiction", /(?<!non-?)fiction|novels|mythology|classic literature|drama/],
];

export function guessCategory(subjects, categories) {
  const text = (subjects ?? []).join(" | ").toLowerCase();
  for (const [category, pattern] of CATEGORY_HINTS) {
    if (categories.includes(category) && pattern.test(text)) return category;
  }
  return categories[0];
}

function readLibrary() {
  return JSON.parse(readFileSync(libraryFile, "utf8"));
}

function writeLibrary(library) {
  writeFileSync(libraryFile, `${JSON.stringify(library, null, 2)}\n`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return await response.json();
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await sleep(1500 * (attempt + 1));
  }
  throw new Error(`no response from ${url}`);
}

async function search({ title, author, isbn }) {
  const params = new URLSearchParams({ fields: SEARCH_FIELDS, limit: "10" });
  if (isbn) params.set("isbn", isbn.replace(/[-\s]/g, ""));
  else {
    params.set("title", title);
    const surname = author ? primaryAuthorSurname(author) : "";
    if (surname) params.set("author", surname);
  }
  const { docs = [] } = await getJson(
    `https://openlibrary.org/search.json?${params}`,
  );
  return docs;
}

/** "The Gulag Archipelago 1918-1956" still matches "The Gulag Archipelago". */
export function titleMatches(candidate, wanted = "") {
  const fullSlug = (text) => slugify(text).replace(/^(the|a|an)-/, "");
  const a = fullSlug(candidate ?? "");
  const b = fullSlug(wanted);
  if (!a || !b) return false;
  // A typed subtitle ("Principles: Your Guided Journal") must be matched;
  // without one, Open Library's shorter title is fine ("Leadership").
  if (wanted.includes(":")) return a.startsWith(b);
  return a.startsWith(b) || b.startsWith(a);
}

/** The spine's first-author surname appears in the Open Library authors. */
export function authorMatches(doc, author) {
  const surname = primaryAuthorSurname(author ?? "").toLowerCase();
  if (!surname) return true;
  return (doc.author_name ?? []).some((name) =>
    name.toLowerCase().includes(surname),
  );
}

/**
 * Open Library records with the same title and the spine's author, best
 * first. Tries the title and author fields, then the title alone, then a
 * free-text query, and stops at the first round that finds one.
 */
async function findMatch({ title, author }, { needCover = false } = {}) {
  const accept = (docs) =>
    rankMatches(docs, title, author).find(
      (d) =>
        (!needCover || d.cover_i) &&
        titleMatches(d.title, title) &&
        authorMatches(d, author),
    );
  const freeText = async () => {
    const params = new URLSearchParams({
      q: `${title} ${primaryAuthorSurname(author ?? "")}`.trim(),
      fields: SEARCH_FIELDS,
      limit: "10",
    });
    return (
      (await getJson(`https://openlibrary.org/search.json?${params}`)).docs ??
      []
    );
  };
  for (const round of [
    () => search({ title, author }),
    () => search({ title }),
    freeText,
  ]) {
    const doc = accept(await round());
    if (doc) return doc;
    await sleep(400);
  }
  return undefined;
}

/** Best Open Library match for a title and author: exact title, with a cover. */
export function rankMatches(docs, title, author) {
  const wanted = title ? normalizeTitle(title) : "";
  const score = (doc) =>
    (doc.cover_i ? 2 : 0) +
    (wanted && normalizeTitle(doc.title ?? "") === wanted ? 4 : 0) +
    (author && authorMatches(doc, author) ? 3 : 0);
  return [...docs].sort((a, b) => score(b) - score(a));
}

function pickIsbn(doc) {
  const isbns = doc.isbn ?? [];
  return isbns.find((value) => /^97[89]\d{10}$/.test(value)) ?? isbns[0];
}

function formatAuthors(names = []) {
  // Prefer names in Latin script; Open Library also lists translations.
  const latin = names.filter((name) =>
    /^[\p{Script=Latin}\s.,'()-]+$/u.test(name),
  );
  const unique = [...new Set(latin.length ? latin : names)];
  if (unique.length <= 1) return unique[0] ?? "Unknown";
  return `${unique[0]} and ${unique[1]}`;
}

/**
 * Where a cover comes from, stored on the book as `coverRef` so a rebuild
 * fetches the same image: "ol:<cover id>", "isbn:<isbn>", "apple:<artwork
 * url>" (Apple Books, sized on download) or "url:<any https JPEG>".
 */
export function coverUrl(ref) {
  const [kind, ...rest] = ref.split(":");
  const value = rest.join(":");
  if (kind === "ol") {
    return `https://covers.openlibrary.org/b/id/${value}-L.jpg?default=false`;
  }
  if (kind === "isbn") {
    return `https://covers.openlibrary.org/b/isbn/${value}-L.jpg?default=false`;
  }
  if (kind === "apple") return `${value}/400x600bb.jpg`;
  if (kind === "url" && value.startsWith("https://")) return value;
  throw new Error(`unknown cover ref "${ref}"`);
}

async function downloadCover(ref, slug) {
  const response = await fetch(coverUrl(ref), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg || bytes.length < 1500) return null;
  writeFileSync(new URL(`${slug}.jpg`, coversDir), bytes);
  return `${slug}.jpg`;
}

/**
 * Apple Books (iTunes Search API, no key) as the second cover source. It has
 * most recent titles that Open Library lacks. Summaries and translations are
 * rejected by the same title and author checks.
 */
async function findAppleCover({ title, author }) {
  const params = new URLSearchParams({
    term: `${title} ${primaryAuthorSurname(author ?? "")}`.trim(),
    media: "ebook",
    country: "US",
    limit: "15",
  });
  const { results = [] } = await getJson(
    `https://itunes.apple.com/search?${params}`,
  );
  const matches = results.filter(
    (r) =>
      r.artworkUrl100 &&
      !/^summary\b|\bsummary of\b|workbook|study guide/i.test(
        r.trackName ?? "",
      ) &&
      titleMatches(r.trackName, title) &&
      authorMatches({ author_name: [r.artistName ?? ""] }, author),
  );
  // Publisher editions name their artwork by ISBN; self-published reprints
  // of classics upload "..._cover_image.png". Prefer the publisher's.
  const hit =
    matches.find((r) => /\/97[89]\d{10}[^/]*\/[^/]+$/.test(r.artworkUrl100)) ??
    matches[0];
  if (!hit) return undefined;
  const base = hit.artworkUrl100.replace(/\/[^/]+$/, "");
  return { ref: `apple:${base}`, title: hit.trackName };
}

function parseArgs(argv) {
  const options = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--fill") options.fill = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--no-cover") options.noCover = true;
    else if (arg === "--meta") options.meta = true;
    else if (
      [
        "--author",
        "--title",
        "--category",
        "--cover-id",
        "--cover-url",
        "--source",
      ].includes(arg)
    ) {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      options[arg.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] =
        value;
    } else if (arg.startsWith("--")) throw new Error(`unknown flag ${arg}`);
    else options.positional.push(arg);
  }
  return options;
}

async function ask(rl, question) {
  return (await rl.question(question)).trim();
}

async function addBook(options) {
  const library = readLibrary();
  const query = options.positional.join(" ").trim();
  if (!query) throw new Error('usage: pnpm add:book "<title or ISBN>"');
  const interactive = !options.yes && process.stdin.isTTY;
  const rl = interactive
    ? createInterface({ input: process.stdin, output: process.stdout })
    : null;

  try {
    const isbn = isIsbn(query) ? query.replace(/[-\s]/g, "") : undefined;
    const docs = rankMatches(
      await search({
        title: isbn ? undefined : query,
        author: options.author,
        isbn,
      }),
      isbn ? undefined : query,
      options.author,
    );

    // Unattended (the issue form): a title alone is too ambiguous ("The
    // Fund" has several authors), so take an ISBN's record or a same-title,
    // same-author match, or stop.
    let doc;
    if (rl) doc = docs[0];
    else if (isbn) doc = docs[0];
    else if (options.author) {
      doc = await findMatch({ title: query, author: options.author });
    } else {
      throw new Error(
        `"${query}" needs an author or an ISBN when adding without prompts.`,
      );
    }
    if (!rl && !doc) {
      console.warn(
        `No Open Library record for "${query}" by ${options.author}; adding it as typed, without a cover.`,
      );
    }
    if (rl && docs.length > 1) {
      console.log("Matches from Open Library:");
      docs.slice(0, 5).forEach((d, i) => {
        const year = d.first_publish_year ? ` (${d.first_publish_year})` : "";
        const cover = d.cover_i ? "" : " [no cover]";
        console.log(
          `  ${i + 1}. ${d.title}, ${formatAuthors(d.author_name)}${year}${cover}`,
        );
      });
      console.log("  0. None of these: add with the details I typed");
      const choice = Number((await ask(rl, "Pick one [1]: ")) || "1");
      doc = choice === 0 ? undefined : (docs[choice - 1] ?? docs[0]);
    }
    if (!doc && !options.title && isbn) {
      throw new Error(
        `no Open Library match for ISBN ${isbn}; pass --title and --author`,
      );
    }

    // A typed title is how the cover reads; an ISBN takes Open Library's.
    const title = cleanText(
      options.title ?? (isbn ? (doc?.title ?? query) : query),
    );
    // A typed --author wins: it is how the spine reads.
    const author = cleanText(options.author ?? formatAuthors(doc?.author_name));

    let category = options.category;
    if (!category && rl) {
      const guess = guessCategory(doc?.subject, library.categories);
      library.categories.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      const answer = await ask(rl, `Category [${guess}]: `);
      category = answer
        ? (library.categories[Number(answer) - 1] ?? answer)
        : guess;
    }
    category ??= guessCategory(doc?.subject, library.categories);
    if (!library.categories.includes(category)) {
      throw new Error(
        `unknown category "${category}". Use one of: ${library.categories.join(", ")}`,
      );
    }

    const hits = bannedHits(`${title}\n${author}`);
    if (hits.length) {
      throw new Error(
        `"${title}" by ${author} contains site-banned text (${hits.join(", ")}). Pass --title or --author with a cleaned version.`,
      );
    }

    const duplicate = library.books.find(
      (book) =>
        slugify(book.title) === slugify(title) &&
        primaryAuthorSurname(book.author).toLowerCase() ===
          primaryAuthorSurname(author).toLowerCase(),
    );
    if (duplicate)
      throw new Error(`already in the library as "${duplicate.slug}"`);

    let slug = slugify(title);
    if (library.books.some((book) => book.slug === slug)) {
      slug = slugify(`${title} ${primaryAuthorSurname(author)}`);
    }
    if (library.books.some((book) => book.slug === slug)) {
      throw new Error(`slug ${slug} is taken`);
    }

    const book = { slug, title, author, category, added: today() };
    const bookIsbn = isbn ?? (doc ? pickIsbn(doc) : undefined);
    if (!options.noCover) {
      // Typed source first, then Open Library, then Apple Books.
      const refs = [
        options.coverUrl && `url:${options.coverUrl}`,
        options.coverId && `ol:${options.coverId}`,
        doc?.cover_i && `ol:${doc.cover_i}`,
        bookIsbn && `isbn:${bookIsbn}`,
      ].filter(Boolean);
      for (const ref of refs) {
        if (await downloadCover(ref, slug)) {
          book.cover = `${slug}.jpg`;
          book.coverRef = ref;
          break;
        }
      }
      if (!book.cover) {
        const apple = await findAppleCover({ title, author });
        if (apple && (await downloadCover(apple.ref, slug))) {
          book.cover = `${slug}.jpg`;
          book.coverRef = apple.ref;
        }
      }
      if (!book.cover) {
        console.warn("No cover found; the site shows a text tile instead.");
      }
    }
    if (doc?.first_publish_year) book.year = doc.first_publish_year;
    if (doc?.key) book.olKey = doc.key;
    if (bookIsbn) book.isbn = bookIsbn;

    if (rl) {
      const ok = await ask(
        rl,
        `Add "${title}" by ${author} to ${category}? [Y/n] `,
      );
      if (/^n/i.test(ok)) {
        console.log("Not added.");
        return;
      }
    }
    library.books.push(book);
    writeLibrary(library);
    console.log(
      `Added "${title}" by ${author} (${category})${book.cover ? " with cover" : ""}.`,
    );
    console.log(
      "Commit content/library.json and public/library/covers/, then push to publish.",
    );
  } finally {
    rl?.close();
  }
}

/**
 * Fetch covers for books without one (Open Library, then Apple Books), and
 * with --meta the first-published year and Open Library record for the
 * detail panel. --force refetches covers: from the stored coverRef when there
 * is one, so a rebuild gets the same image.
 */
async function fill(options) {
  const library = readLibrary();
  const only = new Set(options.positional);
  const needsCover = (book) =>
    (!book.noCover || only.has(book.slug)) &&
    (options.force ||
      Boolean(options.coverUrl || options.coverId) ||
      !book.cover ||
      !existsSync(new URL(book.cover, coversDir)));
  // Year and record come together from one Open Library match. A book with a
  // record but no year (ancient texts) is left alone, so a year removed by
  // hand stays removed.
  const needsMeta = (book) => Boolean(options.meta) && !book.olKey;
  const targets = library.books.filter(
    (book) =>
      (only.size === 0 || only.has(book.slug)) &&
      (needsCover(book) || needsMeta(book)),
  );
  if ((options.coverId || options.coverUrl) && targets.length !== 1) {
    throw new Error("--cover-id and --cover-url need exactly one slug");
  }
  const report = { covered: [], missing: [] };
  for (const book of targets) {
    let olDoc;
    let via = "";
    if (needsCover(book)) {
      let ref;
      if (options.coverUrl) ref = `url:${options.coverUrl}`;
      else if (options.coverId) ref = `ol:${options.coverId}`;
      else if (options.force && book.coverRef && !options.source) {
        ref = book.coverRef;
      } else {
        if (options.source !== "apple") {
          olDoc = await findMatch(book, { needCover: true });
          if (olDoc) {
            ref = `ol:${olDoc.cover_i}`;
            via = `${olDoc.title} / ${formatAuthors(olDoc.author_name)}`;
          }
        }
        if (!ref && options.source !== "openlibrary") {
          const apple = await findAppleCover(book);
          if (apple) {
            ref = apple.ref;
            via = `Apple Books: ${apple.title}`;
          }
        }
      }
      const cover = ref ? await downloadCover(ref, book.slug) : null;
      if (cover) {
        book.cover = cover;
        book.coverRef = ref;
        delete book.noCover;
        report.covered.push(book.slug);
      } else report.missing.push(book.slug);
      console.log(
        `${cover ? "ok  " : "miss"} ${book.slug}${via ? `  <- ${via}` : ""}`,
      );
    }
    if (needsMeta(book)) {
      const meta = olDoc ?? (await findMatch(book));
      if (meta?.first_publish_year && !book.year) {
        book.year = meta.first_publish_year;
      }
      if (meta?.key && !book.olKey) book.olKey = meta.key;
      console.log(
        `meta ${book.slug}  year ${book.year ?? "?"}  ${book.olKey ?? "no record"}`,
      );
    }
    writeLibrary(library);
    await sleep(400);
  }
  console.log(
    `\n${report.covered.length} covers saved, ${report.missing.length} missing.`,
  );
  if (report.missing.length) {
    console.log(`Missing (shown as text tiles): ${report.missing.join(", ")}`);
    console.log(
      "Fix one with: pnpm add:book --fill <slug> --cover-url <https://...jpg>",
    );
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const options = parseArgs(process.argv.slice(2));
    await (options.fill ? fill(options) : addBook(options));
  } catch (error) {
    console.error(`add:book: ${error.message}`);
    process.exit(1);
  }
}
