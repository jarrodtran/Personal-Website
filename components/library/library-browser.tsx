"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { BookCover } from "@/components/library/book-cover";
import { BookDialog } from "@/components/library/book-dialog";
import { Shelf } from "@/components/library/shelf";
import { siteContainer } from "@/components/section";
import { cn } from "@/lib/cn";
import {
  groupByCategory,
  matchesQuery,
  sortBooks,
  type LibrarySort,
  type LibraryView,
  type ShelfBook,
} from "@/lib/library";

const VIEW_KEY = "library-view";
const HASH_PREFIX = "#book-";

/** Small spaced capitals, like the labels on a library card. */
const label = "font-library-mono text-[0.6875rem] tracking-[0.2em] uppercase";

const pill = cn(
  label,
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-4 transition-colors",
);
const pillIdle =
  "border-border-control text-muted-foreground hover:border-foreground hover:text-foreground";
const pillOn = "border-foreground bg-foreground text-background";

const quietSelect = cn(
  label,
  "text-foreground min-h-11 min-w-0 cursor-pointer rounded-full border border-border-control bg-transparent px-4",
);

const VIEW_EVENT = "library-view-change";

function readHashSlug(): string | null {
  const { hash } = window.location;
  return hash.startsWith(HASH_PREFIX)
    ? decodeURIComponent(hash.slice(HASH_PREFIX.length))
    : null;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

// Used when localStorage is blocked, so the toggle still works for the visit.
let memoryView: LibraryView = "shelf";

function readView(): LibraryView {
  try {
    const saved = window.localStorage.getItem(VIEW_KEY);
    if (saved === "shelf" || saved === "covers") return saved;
  } catch {}
  return memoryView;
}

function chooseView(next: LibraryView) {
  memoryView = next;
  try {
    window.localStorage.setItem(VIEW_KEY, next);
  } catch {}
  window.dispatchEvent(new Event(VIEW_EVENT));
}

function subscribeView(onChange: () => void) {
  window.addEventListener(VIEW_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(VIEW_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The /library/ page below the title: search, category pills, sort, a 3D
 * shelf of spines (or a cover grid), and a detail dialog. Each book is a link to #book-<slug>, so the
 * page works without JS (every cover shows, links jump to the book) and the
 * same link opens the dialog with JS, including from the home page.
 */
export function LibraryBrowser({
  books,
  categories,
}: {
  books: ShelfBook[];
  categories: readonly string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<LibrarySort>("category");
  // The open book lives in the URL (#book-<slug>) and the view in
  // localStorage. The server snapshots are the defaults, so the static HTML
  // is the shelf with no dialog.
  const openSlug = useSyncExternalStore(
    subscribeHash,
    readHashSlug,
    () => null,
  );
  const view = useSyncExternalStore(subscribeView, readView, () => "shelf");

  const visible = useMemo(
    () =>
      sortBooks(
        books.filter(
          (book) =>
            (!category || book.category === category) &&
            matchesQuery(book, query),
        ),
        sort,
        categories,
      ),
    [books, categories, category, query, sort],
  );
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const book of books) {
      map.set(book.category, (map.get(book.category) ?? 0) + 1);
    }
    return map;
  }, [books]);

  // The dialog steps through what is on screen; a book opened from a link
  // that the filters hide still opens, on its own.
  const openIndex = visible.findIndex((book) => book.slug === openSlug);
  const openBook =
    openIndex >= 0
      ? visible[openIndex]
      : (books.find((book) => book.slug === openSlug) ?? null);
  const sequence = openIndex >= 0 ? visible : openBook ? [openBook] : [];

  // replaceState keeps Back for leaving the page, not for stepping books.
  // It fires no hashchange, so send one for the store above.
  const open = useCallback((slug: string | null) => {
    const url = `${window.location.pathname}${window.location.search}${slug ? `${HASH_PREFIX}${slug}` : ""}`;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  const step = (delta: number) => {
    if (sequence.length < 2 || !openBook) return;
    const at = sequence.findIndex((book) => book.slug === openBook.slug);
    const next = sequence[(at + delta + sequence.length) % sequence.length];
    open(next.slug);
  };

  const onBookClick = (event: React.MouseEvent, slug: string) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    open(slug);
  };

  // Sorted by category, the page reads like a bookcase: one labeled section
  // per category. Other sorts are one flat run.
  const groups: {
    category: string | null;
    slug: string;
    books: ShelfBook[];
  }[] =
    sort === "category"
      ? groupByCategory(visible).map((group) => ({
          ...group,
          slug: group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }))
      : [{ category: null, slug: "all", books: visible }];

  const renderCovers = (list: ShelfBook[]) => (
    <ul
      role="list"
      className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-4 gap-y-6 sm:gap-x-5"
    >
      {list.map((book) => (
        <li
          key={book.slug}
          id={`book-${book.slug}`}
          className="min-w-0 scroll-mt-24"
        >
          <a
            href={`${HASH_PREFIX}${book.slug}`}
            onClick={(event) => onBookClick(event, book.slug)}
            className="group block"
          >
            <BookCover
              title={book.title}
              author={book.author}
              src={book.src}
              className="transition-transform group-hover:-translate-y-0.5"
            />
            <span className="text-small mt-2 block leading-snug font-medium [overflow-wrap:anywhere] group-hover:underline">
              {book.title}
            </span>
            <span className="text-muted-foreground text-small block leading-snug [overflow-wrap:anywhere]">
              {book.author}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );

  const chips: (string | null)[] = [
    null,
    ...categories.filter((c) => (counts.get(c) ?? 0) > 0),
  ];

  const groupHeading = (group: {
    category: string | null;
    slug: string;
    books: ShelfBook[];
  }) =>
    group.category ? (
      <h2
        id={`shelf-${group.slug}`}
        className={cn(
          label,
          "border-border text-foreground flex items-baseline justify-between gap-3 border-b pb-2",
        )}
      >
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {group.category}
        </span>
        <span className="text-muted-foreground tabular">
          {group.books.length}
        </span>
      </h2>
    ) : null;

  const summary = `${visible.length === 1 ? "1 book" : `${visible.length} books`}${category ? ` in ${category}` : ""}${query.trim() ? ` matching “${query.trim()}”` : ""}`;

  return (
    <div>
      <div className={cn(siteContainer, "flex flex-col items-center")}>
        <div className="relative w-full max-w-xl">
          <label htmlFor="library-search" className="sr-only">
            Search titles and authors
          </label>
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What are you looking for?"
            autoComplete="off"
            className="border-border-control focus:border-foreground font-display placeholder:text-muted-foreground min-h-11 w-full border-0 border-b bg-transparent px-2 pb-2 text-center text-[1.25rem] italic outline-none focus-visible:outline-none"
          />
        </div>

        {/* Phones get one select instead of rows of pills. */}
        <div className="mt-5 flex max-w-full sm:hidden">
          <label htmlFor="library-category" className="sr-only">
            Category
          </label>
          <select
            id="library-category"
            value={category ?? ""}
            onChange={(event) => setCategory(event.target.value || null)}
            className={cn(quietSelect, "max-w-full")}
          >
            <option value="">{`All (${books.length})`}</option>
            {chips.slice(1).map((chip) => (
              <option key={chip} value={chip ?? ""}>
                {`${chip} (${counts.get(chip ?? "") ?? 0})`}
              </option>
            ))}
          </select>
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="mt-5 hidden max-w-5xl flex-wrap justify-center gap-2 sm:flex"
        >
          {chips.map((chip) => (
            <button
              key={chip ?? "all"}
              type="button"
              aria-pressed={category === chip}
              onClick={() => setCategory(chip)}
              className={cn(pill, category === chip ? pillOn : pillIdle)}
            >
              <span className="min-w-0">{chip ?? "All"}</span>
              <span className="tabular">
                {chip ? (counts.get(chip) ?? 0) : books.length}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <p aria-live="polite" className={cn(label, "text-muted-foreground")}>
            {summary}
          </p>
          <div className="flex max-w-full min-w-0 items-center">
            <label htmlFor="library-sort" className="sr-only">
              Sort
            </label>
            <select
              id="library-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as LibrarySort)}
              className={cn(quietSelect, "max-w-full")}
            >
              <option value="category">Sort: Section</option>
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
              <option value="recent">Sort: Recently added</option>
            </select>
          </div>
          <div
            role="group"
            aria-label="View"
            className="flex max-w-full flex-wrap justify-center gap-1"
          >
            {(
              [
                ["shelf", "Shelf"],
                ["covers", "Covers"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => chooseView(value)}
                className={cn(pill, view === value ? pillOn : pillIdle)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div
          className={cn(
            siteContainer,
            "mt-12 flex flex-col items-center pb-8 text-center",
          )}
        >
          <p className="font-display text-[1.375rem] italic">
            Nothing on the shelf matches.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            className={cn(pill, pillIdle, "mt-4")}
          >
            Clear search and filters
          </button>
        </div>
      ) : view === "shelf" ? (
        <div>
          <Shelf
            books={visible}
            label={category ? `${category} shelf` : "Bookshelf"}
            bookends={sort === "category" && !category}
            onOpen={onBookClick}
          />
        </div>
      ) : (
        <div className={cn(siteContainer, "mt-10")}>
          {groups.map((group) => (
            <div key={group.category ?? "all"} className="mt-10 first:mt-0">
              {groupHeading(group)}
              {renderCovers(group.books)}
            </div>
          ))}
        </div>
      )}

      <BookDialog
        book={openBook}
        position={Math.max(
          0,
          sequence.findIndex((book) => book.slug === openBook?.slug),
        )}
        total={sequence.length}
        onClose={() => open(null)}
        onStep={step}
      />
    </div>
  );
}
