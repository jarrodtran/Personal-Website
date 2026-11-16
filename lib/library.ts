import { contrastRatio } from "@/lib/theme";

/**
 * Pure helpers for the library UI. They live in lib/ (not content/) so the
 * client components can import them.
 */

export type LibrarySort = "category" | "title" | "author" | "recent";

/** Consecutive runs of books that share a category, in the given order. */
export function groupByCategory(
  books: ShelfBook[],
): { category: string; books: ShelfBook[] }[] {
  const groups: { category: string; books: ShelfBook[] }[] = [];
  for (const book of books) {
    const last = groups.at(-1);
    if (last && last.category === book.category) last.books.push(book);
    else groups.push({ category: book.category, books: [book] });
  }
  return groups;
}
export type LibraryView = "covers" | "shelf";

/** One book as the client needs it; the server adds the cover URL. */
export interface ShelfBook {
  slug: string;
  title: string;
  author: string;
  /** Filing key for corporate or single-name authors; see content/library.ts. */
  authorSort?: string;
  category: string;
  /** 0 is the newest addition. */
  order: number;
  src?: string;
  year?: number;
  olKey?: string;
  color?: string;
}

/** Spine ink: black or white, whichever reads better on the spine color. */
export const SPINE_INK = { dark: "#000000", light: "#ffffff" } as const;

/** Neutral spine for books with no sampled color (or no cover). */
export const SPINE_FALLBACK = "#3a3a3a";

export function spineInk(background: string): string {
  return contrastRatio(background, SPINE_INK.dark) >=
    contrastRatio(background, SPINE_INK.light)
    ? SPINE_INK.dark
    : SPINE_INK.light;
}

/** Fold case and accents so "niccolo" finds "Niccolò". */
export function foldText(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export function matchesQuery(book: ShelfBook, query: string): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = foldText(`${book.title} ${book.author}`);
  return words.every((word) => haystack.includes(word));
}

/** "The Prince" files under P. */
export function titleSortKey(title: string): string {
  return foldText(title.replace(/^(the|a|an)\s+/i, ""));
}

/** First author's surname: "Jocko Willink and Leif Babin" sorts under W. */
export function authorSortKey(author: string): string {
  const first = author
    .replace(/\(.*?\)/g, "")
    .split(/\s+and\s+|,/)[0]
    .trim();
  const parts = first.split(/\s+/);
  return foldText(`${parts.at(-1) ?? ""} ${parts.slice(0, -1).join(" ")}`);
}

/**
 * "category" shelves books the way bookstores and libraries do: by section
 * (in the order of `categories`), then by the first author's surname, then
 * title. The other sorts ignore sections.
 */
function authorKey(book: ShelfBook): string {
  return book.authorSort ?? authorSortKey(book.author);
}

export function sortBooks(
  books: ShelfBook[],
  sort: LibrarySort,
  categories: readonly string[] = [],
): ShelfBook[] {
  const sorted = [...books];
  if (sort === "recent") return sorted.sort((a, b) => a.order - b.order);
  if (sort === "category") {
    const rank = (book: ShelfBook) => {
      const at = categories.indexOf(book.category);
      return at === -1 ? categories.length : at;
    };
    return sorted.sort(
      (a, b) =>
        rank(a) - rank(b) ||
        authorKey(a).localeCompare(authorKey(b)) ||
        titleSortKey(a.title).localeCompare(titleSortKey(b.title)),
    );
  }
  const key =
    sort === "author" ? authorKey : (b: ShelfBook) => titleSortKey(b.title);
  return sorted.sort(
    (a, b) =>
      key(a).localeCompare(key(b)) ||
      titleSortKey(a.title).localeCompare(titleSortKey(b.title)),
  );
}

/** Small stable hash, so a book keeps its spine size between builds. */
function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * Spine box in rem. Longer titles get thicker spines; height varies a little
 * per book like a real shelf. Width never drops under 2.75rem (44px), so each
 * spine is a full tap target.
 */
export function spineSize(book: Pick<ShelfBook, "slug" | "title">): {
  width: number;
  height: number;
} {
  const h = hash(book.slug);
  const width = Math.min(
    3.75,
    2.75 + Math.floor(book.title.length / 14) * 0.25 + (h % 3) * 0.125,
  );
  const height = 10 + ((h >>> 3) % 7) * 0.5;
  return { width, height };
}
