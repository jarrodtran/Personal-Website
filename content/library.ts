import data from "./library.json";

/**
 * The bookshelf. Add books with `pnpm add:book "<title or ISBN>"`, or by
 * appending an entry to content/library.json and running `pnpm add:book --fill`
 * for its cover. Kept out of `site` so book titles stay out of the copy
 * contract (five-word repeats, figure ledger).
 */
export interface Book {
  /** Stable id; the cover file is public/library/covers/<slug>.jpg. */
  slug: string;
  title: string;
  author: string;
  /** Filing key when surname-first is wrong, e.g. "harvard business review". */
  authorSort?: string;
  category: string;
  /** YYYY-MM-DD the book joined the library. */
  added: string;
  /** Cover file name under public/library/covers/, when there is one. */
  cover?: string;
  /** Where the cover came from ("ol:<id>", "apple:<url>", "url:<url>"), so a rebuild fetches the same image. */
  coverRef?: string;
  /** Set to keep a text tile; `--fill` skips the book. */
  noCover?: boolean;
  /** Year first published, checked by hand; left out for ancient texts. */
  year?: number;
  /** Open Library work, e.g. "/works/OL17078302W". */
  olKey?: string;
  /** Dominant cover color for the shelf view, from `pnpm library:colors`. */
  color?: string;
  /** Some edition's ISBN, for lookups only; not shown. */
  isbn?: string;
}

export const libraryCategories: readonly string[] = data.categories;
export const libraryBooks: readonly Book[] = data.books;

/** Newest first: later `added` dates, then later entries in the file. */
export function booksByRecency(books: readonly Book[] = libraryBooks): Book[] {
  return books
    .map((book, index) => ({ book, index }))
    .sort(
      (a, b) => b.book.added.localeCompare(a.book.added) || b.index - a.index,
    )
    .map(({ book }) => book);
}

/** Root-relative cover path; callers add the base path. */
export function coverPath(book: Book): string | undefined {
  return book.cover ? `/library/covers/${book.cover}` : undefined;
}
