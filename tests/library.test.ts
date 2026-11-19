import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  booksByRecency,
  coverPath,
  libraryBooks,
  libraryCategories,
} from "@/content/library";
import {
  authorSortKey,
  groupByCategory,
  matchesQuery,
  sortBooks,
  SPINE_FALLBACK,
  spineInk,
  spineLook,
  spineTurn,
  type ShelfBook,
} from "@/lib/library";
import { contrastRatio } from "@/lib/theme";
import {
  bannedHits,
  cleanText,
  coverUrl,
  guessCategory,
  rankMatches,
  slugify,
  titleMatches,
} from "../scripts/add-book.mjs";

const shelf = (title: string, author: string, order: number): ShelfBook => ({
  slug: slugify(title),
  title,
  author,
  category: "c",
  order,
});

describe("library UI helpers", () => {
  const books = [
    shelf("The Prince", "Niccolò Machiavelli", 2),
    shelf("Atomic Habits", "James Clear", 0),
    shelf("Extreme Ownership", "Jocko Willink and Leif Babin", 1),
  ];

  it("searches title and author, ignoring case and accents", () => {
    expect(
      books.filter((b) => matchesQuery(b, "niccolo")).map((b) => b.title),
    ).toEqual(["The Prince"]);
    expect(books.filter((b) => matchesQuery(b, "HABITS clear")).length).toBe(1);
    expect(books.filter((b) => matchesQuery(b, "  ")).length).toBe(3);
  });

  it("sorts by title without articles, by first author's surname, or newest first", () => {
    expect(sortBooks(books, "title").map((b) => b.title)).toEqual([
      "Atomic Habits",
      "Extreme Ownership",
      "The Prince",
    ]);
    expect(sortBooks(books, "author").map((b) => b.title)).toEqual([
      "Atomic Habits",
      "The Prince",
      "Extreme Ownership",
    ]);
    expect(sortBooks(books, "recent").map((b) => b.order)).toEqual([0, 1, 2]);
    expect(authorSortKey("Gyurme Dorje (translator)")).toBe("dorje gyurme");
  });

  it("shelves by section in category order, then author surname, like a bookstore", () => {
    const mixed: ShelfBook[] = [
      { ...shelf("Zero to One", "Peter Thiel", 0), category: "Startups" },
      { ...shelf("Mastery", "Robert Greene", 1), category: "Power" },
      {
        ...shelf("The Hard Thing About Hard Things", "Ben Horowitz", 2),
        category: "Startups",
      },
      { ...shelf("The Prince", "Niccolò Machiavelli", 3), category: "Power" },
    ];
    const sorted = sortBooks(mixed, "category", ["Power", "Startups"]);
    expect(sorted.map((b) => b.title)).toEqual([
      "Mastery",
      "The Prince",
      "The Hard Thing About Hard Things",
      "Zero to One",
    ]);
    expect(
      groupByCategory(sorted).map((g) => [g.category, g.books.length]),
    ).toEqual([
      ["Power", 2],
      ["Startups", 2],
    ]);
  });

  it("uses every category, and no section is empty or holds most of the shelf", () => {
    const used = new Set(libraryBooks.map((book) => book.category));
    expect([...used].sort()).toEqual([...libraryCategories].sort());
    for (const category of libraryCategories) {
      const size = libraryBooks.filter(
        (book) => book.category === category,
      ).length;
      expect(size, category).toBeGreaterThan(0);
      expect(size, category).toBeLessThan(libraryBooks.length / 4);
    }
  });

  it("sizes every spine as a full tap target and the same way each build", () => {
    for (const book of libraryBooks) {
      const look = spineLook(book);
      expect(look.width, book.slug).toBeGreaterThanOrEqual(44);
      expect(look.height, book.slug).toBeGreaterThanOrEqual(44);
      expect(spineLook(book)).toEqual(look);
    }
  });

  it("swings shelf ends open symmetrically and stands the middle straight", () => {
    expect(spineTurn(0)).toBe(0);
    expect(spineTurn(-1)).toBe(-34);
    expect(spineTurn(1)).toBe(34);
    expect(spineTurn(5)).toBe(34);
    expect(spineTurn(-0.5)).toBeCloseTo(-spineTurn(0.5));
  });
});

const root = path.resolve(__dirname, "..");
const coversDir = path.join(root, "public/library/covers");

describe("library data", () => {
  it("has books, each with a unique slug and a known category", () => {
    expect(libraryBooks.length).toBeGreaterThan(0);
    const slugs = libraryBooks.map((book) => book.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const book of libraryBooks) {
      expect(book.slug, book.title).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(libraryCategories, book.slug).toContain(book.category);
      expect(book.title.trim(), book.slug).not.toBe("");
      expect(book.author.trim(), book.slug).not.toBe("");
      expect(book.added, book.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("ships a real JPEG for every cover it names", () => {
    for (const book of libraryBooks) {
      if (!book.cover) continue;
      expect(book.cover, book.slug).toBe(`${book.slug}.jpg`);
      const file = path.join(coversDir, book.cover);
      expect(existsSync(file), file).toBe(true);
      const bytes = readFileSync(file);
      expect([...bytes.subarray(0, 3)], book.cover).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  it("records where each cover came from, so a rebuild gets the same image", () => {
    for (const book of libraryBooks) {
      if (!book.cover) continue;
      expect(book.coverRef, book.slug).toMatch(
        /^(ol:\d+|isbn:\d+|apple:https:\/\/|url:https:\/\/)/,
      );
      expect(coverUrl(book.coverRef ?? "")).toMatch(/^https:\/\//);
    }
  });

  it("gives spines readable ink: at least 4.5:1 on every sampled color", () => {
    for (const book of libraryBooks) {
      const color = book.color ?? SPINE_FALLBACK;
      expect(color, book.slug).toMatch(/^#[0-9a-f]{6}$/);
      expect(
        contrastRatio(color, spineInk(color)),
        `${book.slug} ${color}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps years plausible and Open Library keys well formed", () => {
    for (const book of libraryBooks) {
      if (book.year !== undefined) {
        expect(book.year, book.slug).toBeGreaterThanOrEqual(1400);
        expect(book.year, book.slug).toBeLessThanOrEqual(
          new Date().getFullYear(),
        );
      }
      if (book.olKey)
        expect(book.olKey, book.slug).toMatch(/^\/works\/OL\d+W$/);
    }
  });

  // Book text renders on / and /library/, which the banned-copy scan reads.
  it("keeps banned phrases and dashes out of titles and authors", () => {
    const hits = libraryBooks.flatMap((book) =>
      bannedHits(`${book.title}\n${book.author}`).map(
        (phrase: string) => `${book.slug}: ${phrase}`,
      ),
    );
    expect(hits).toEqual([]);
  });

  it("lists newer additions first and builds root-relative cover paths", () => {
    const newest = booksByRecency([
      {
        slug: "a",
        title: "A",
        author: "X",
        category: "c",
        added: "2026-01-01",
      },
      {
        slug: "b",
        title: "B",
        author: "X",
        category: "c",
        added: "2026-02-01",
      },
      {
        slug: "c",
        title: "C",
        author: "X",
        category: "c",
        added: "2026-02-01",
      },
    ]).map((book) => book.slug);
    expect(newest).toEqual(["c", "b", "a"]);
    expect(
      coverPath({
        slug: "a",
        title: "A",
        author: "X",
        category: "c",
        added: "2026-01-01",
        cover: "a.jpg",
      }),
    ).toBe("/library/covers/a.jpg");
    expect(
      coverPath({
        slug: "a",
        title: "A",
        author: "X",
        category: "c",
        added: "2026-01-01",
      }),
    ).toBeUndefined();
  });
});

describe("add-book helpers", () => {
  it("slugs titles and strips accents", () => {
    expect(slugify("Runnin' Down a Dream")).toBe("runnin-down-a-dream");
    expect(slugify("The Prince by Niccolò")).toBe("the-prince-by-niccolo");
  });

  it("turns en and em dashes into colons so builds stay clean", () => {
    expect(cleanText("Zero to One — Notes on Startups")).toBe(
      "Zero to One: Notes on Startups",
    );
    expect(cleanText("A–B")).toBe("A: B");
  });

  it("flags banned phrases case-insensitively", () => {
    expect(bannedHits("Elevate Your Game")).toContain("elevate");
    expect(bannedHits("Atomic Habits")).toEqual([]);
  });

  it("prefers an exact title match that has a cover", () => {
    const ranked = rankMatches(
      [
        { title: "Sapiens Graphic Novel", cover_i: 1 },
        { title: "Sapiens", cover_i: undefined },
        { title: "Sapiens", cover_i: 2 },
      ],
      "Sapiens",
    );
    expect(ranked[0].cover_i).toBe(2);
  });

  it("matches longer edition titles, and a typed subtitle must match too", () => {
    expect(
      titleMatches("The Gulag Archipelago 1918-1956", "The Gulag Archipelago"),
    ).toBe(true);
    expect(titleMatches("Leadership", "Leadership Plain and Simple")).toBe(
      true,
    );
    expect(titleMatches("Principles", "Principles: Your Guided Journal")).toBe(
      false,
    );
    expect(titleMatches("Mobile Banking", "Mobilize")).toBe(false);
  });

  it("guesses a category from subjects and falls back to the first", () => {
    expect(
      guessCategory(["Investments", "Finance, Personal"], libraryCategories),
    ).toBe("Money & Markets");
    expect(guessCategory([], libraryCategories)).toBe(libraryCategories[0]);
  });
});
