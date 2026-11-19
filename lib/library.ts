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

/** How a spine's title is set: the shelf mixes them like real bindings. */
export type SpineFace = "serif" | "serif-caps" | "sans" | "sans-caps";

export const SPINE_FACES: readonly SpineFace[] = [
  "serif",
  "serif-caps",
  "sans",
  "sans-caps",
];

export interface SpineLook {
  /** Spine width in px; never under 44, so each spine is a full tap target. */
  width: number;
  /** Spine height in px. */
  height: number;
  /** Cover depth in px (the side face), at the cover's 2:3 ratio. */
  depth: number;
  /** Small lean in degrees; most books stand straight. */
  lean: number;
  /** Push in or out from the shelf edge, in px. */
  z: number;
  face: SpineFace;
}

/**
 * A book's spine, stable between builds. Longer titles get thicker spines;
 * height, lean, and type vary a little per book like a real shelf.
 */
export function spineLook(book: Pick<ShelfBook, "slug" | "title">): SpineLook {
  const h = hash(book.slug);
  const width = Math.min(
    62,
    44 + Math.floor(book.title.length / 12) * 4 + (h % 4) * 2,
  );
  const height = 200 + ((h >>> 3) % 11) * 5;
  const leanRoll = (h >>> 7) % 9;
  const lean = leanRoll === 0 ? 1.6 : leanRoll === 1 ? -1.1 : 0;
  const z = (((h >>> 11) % 17) - 8) * 1;
  const face = SPINE_FACES[(h >>> 15) % SPINE_FACES.length];
  return {
    width,
    height,
    depth: Math.round((height * 2) / 3),
    lean,
    z,
    face,
  };
}

/** Darker shade of a spine color, for the back face and page edges. */
export function shade(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((value >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/**
 * Turn for a spine at horizontal offset `t` from the shelf's center (-1 at
 * the left edge, 1 at the right): the ends swing open so their covers show.
 */
export function spineTurn(t: number, max = 34): number {
  const clamped = Math.max(-1, Math.min(1, t));
  return Math.sign(clamped) * Math.abs(clamped) ** 1.5 * max;
}
