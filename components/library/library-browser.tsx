"use client";

import { LayoutGrid, Library as ShelfIcon, Search } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { BookCover } from "@/components/library/book-cover";
import { BookDialog } from "@/components/library/book-dialog";
import { cn } from "@/lib/cn";
import {
  groupByCategory,
  matchesQuery,
  sortBooks,
  SPINE_FALLBACK,
  spineInk,
  spineSize,
  type LibrarySort,
  type LibraryView,
  type ShelfBook,
} from "@/lib/library";
import { btnGhost } from "@/lib/ui";

const VIEW_KEY = "library-view";
const HASH_PREFIX = "#book-";

const pressedClass =
  "bg-accent text-accent-foreground hover:bg-accent-hover border-transparent";

const field =
  "border-border-control bg-background text-foreground text-small min-h-11 border px-3";

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
let memoryView: LibraryView = "covers";

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
 * The /library/ page: search, sort, category chips, a cover grid or a shelf
 * of spines, and a detail dialog. Each book is a link to #book-<slug>, so the
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
  // is the cover grid with no dialog.
  const openSlug = useSyncExternalStore(
    subscribeHash,
    readHashSlug,
    () => null,
  );
  const view = useSyncExternalStore(subscribeView, readView, () => "covers");

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

  const renderShelf = (list: ShelfBook[], label: string | null) => (
    <ul
      role="list"
      data-shelf=""
      aria-label={label ? `${label} shelf` : "Bookshelf"}
      className="mt-6 flex flex-wrap items-end gap-y-8"
    >
      {list.map((book) => {
        const { width, height } = spineSize(book);
        const background = book.color ?? SPINE_FALLBACK;
        return (
          <li
            key={book.slug}
            id={`book-${book.slug}`}
            className="border-border-control scroll-mt-24 border-b-8 px-px"
          >
            <a
              href={`${HASH_PREFIX}${book.slug}`}
              onClick={(event) => onBookClick(event, book.slug)}
              aria-label={`${book.title} by ${book.author}`}
              style={{
                width: `${width}rem`,
                height: `${height}rem`,
                backgroundColor: background,
                color: spineInk(background),
              }}
              className="group flex flex-col items-center justify-between overflow-hidden rounded-t-[2px] px-1 py-2 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.14),inset_-3px_0_0_rgb(0_0_0/0.18),inset_2px_0_0_rgb(255_255_255/0.12)] transition-transform [writing-mode:vertical-rl] hover:-translate-y-1"
            >
              <span className="font-display max-h-full min-h-0 overflow-hidden text-[0.9375rem] leading-tight text-ellipsis whitespace-nowrap">
                {book.title}
              </span>
              <span className="mt-2 max-h-full min-h-0 shrink-0 overflow-hidden text-[0.6875rem] leading-tight text-ellipsis whitespace-nowrap">
                {book.author.split(/\s+and\s+/)[0]}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  const chips: (string | null)[] = [
    null,
    ...categories.filter((c) => (counts.get(c) ?? 0) > 0),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <label htmlFor="library-search" className="sr-only">
            Search titles and authors
          </label>
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles and authors"
            autoComplete="off"
            className={cn(field, "w-full pl-9")}
          />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <label
            htmlFor="library-sort"
            className="text-muted-foreground text-small"
          >
            Sort
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as LibrarySort)}
            className={cn(field, "min-w-0")}
          >
            <option value="category">Category</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="recent">Recently added</option>
          </select>
        </div>
        {/* Phones get one select instead of nine rows of chips. */}
        <div className="flex min-w-0 items-center gap-2 sm:hidden">
          <label
            htmlFor="library-category"
            className="text-muted-foreground text-small"
          >
            Category
          </label>
          <select
            id="library-category"
            value={category ?? ""}
            onChange={(event) => setCategory(event.target.value || null)}
            className={cn(field, "max-w-full min-w-0")}
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
          aria-label="View"
          className="flex max-w-full flex-wrap gap-2"
        >
          {(
            [
              ["covers", "Covers", LayoutGrid],
              ["shelf", "Shelf", ShelfIcon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => chooseView(value)}
              className={cn(
                btnGhost,
                "min-w-11",
                view === value && pressedClass,
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by category"
        className="mt-4 hidden flex-wrap gap-2 sm:flex"
      >
        {chips.map((chip) => (
          <button
            key={chip ?? "all"}
            type="button"
            aria-pressed={category === chip}
            onClick={() => setCategory(chip)}
            className={cn(
              btnGhost,
              "max-w-full min-w-11 text-left",
              category === chip && pressedClass,
            )}
          >
            <span className="min-w-0">{chip ?? "All"}</span>
            <span className="tabular">
              {chip ? (counts.get(chip) ?? 0) : books.length}
            </span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="text-muted-foreground text-small mt-5">
        {visible.length === 1 ? "1 book" : `${visible.length} books`}
        {category ? ` in ${category}` : ""}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4">
          <p className="text-[length:var(--text-body)]">No books match.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            className={cn(btnGhost, "mt-3")}
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        groups.map((group) => (
          <div
            key={group.category ?? "all"}
            className="mt-8 first-of-type:mt-6"
          >
            {group.category ? (
              <h2
                id={`shelf-${group.slug}`}
                className="border-border font-display flex items-baseline justify-between gap-3 border-b pb-2 text-[length:var(--text-h3)] leading-[var(--leading-title)] tracking-tight"
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {group.category}
                </span>
                <span className="text-muted-foreground text-small tabular font-sans tracking-normal">
                  {group.books.length}
                </span>
              </h2>
            ) : null}
            {view === "covers"
              ? renderCovers(group.books)
              : renderShelf(group.books, group.category)}
          </div>
        ))
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
