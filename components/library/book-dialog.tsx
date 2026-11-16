"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BookCover } from "@/components/library/book-cover";
import { cn } from "@/lib/cn";
import type { ShelfBook } from "@/lib/library";
import { btnGhost, tap, textAction } from "@/lib/ui";

const iconButton = cn(tap, "min-w-11 justify-center transition-colors");

/**
 * Book detail in a native modal dialog: focus moves in and back, Escape and a
 * backdrop click close it, and the arrow keys step through the books in the
 * current filter and sort order.
 */
export function BookDialog({
  book,
  position,
  total,
  onClose,
  onStep,
}: {
  book: ShelfBook | null;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (book && !dialog.open) dialog.showModal();
    if (!book && dialog.open) dialog.close();
  }, [book]);

  const links = book
    ? [
        ...(book.olKey
          ? [
              {
                label: "Open Library",
                href: `https://openlibrary.org${book.olKey}`,
              },
            ]
          : []),
        {
          label: "Bookshop.org",
          href: `https://bookshop.org/search?keywords=${encodeURIComponent(`${book.title} ${book.author}`)}`,
        },
      ]
    : [];

  return (
    <dialog
      ref={ref}
      aria-labelledby="book-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onStep(-1);
        if (event.key === "ArrowRight") onStep(1);
      }}
      className="bg-background text-foreground border-border m-auto w-[calc(100%-2rem)] max-w-2xl border p-0 backdrop:bg-black/60"
    >
      {book ? (
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-muted-foreground text-small tabular"
              aria-live="polite"
            >
              {`${position + 1} of ${total}`}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(iconButton, "hover:bg-muted -mr-2")}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
            <div className="w-40 max-w-full sm:w-auto">
              <BookCover
                title={book.title}
                author={book.author}
                src={book.src}
                eager
              />
            </div>
            <div className="min-w-0">
              <h2
                id="book-dialog-title"
                className="font-display text-[length:var(--text-h2)] leading-[var(--leading-title)] tracking-tight text-balance [overflow-wrap:anywhere]"
              >
                {book.title}
              </h2>
              <p className="mt-1 text-[length:var(--text-body)]">
                {book.author}
              </p>
              <dl className="text-small mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Category</dt>
                <dd>{book.category}</dd>
                {book.year ? (
                  <>
                    <dt className="text-muted-foreground">First published</dt>
                    <dd className="tabular">{book.year}</dd>
                  </>
                ) : null}
              </dl>
              <ul role="list" className="mt-4 flex flex-wrap gap-x-5">
                {links.map((link) => (
                  <li key={link.label} className="max-w-full">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(textAction, "max-w-full")}
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {link.label}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-[16px] shrink-0"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {total > 1 ? (
            <div className="border-border mt-6 flex flex-wrap justify-between gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => onStep(-1)}
                className={btnGhost}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => onStep(1)}
                className={btnGhost}
              >
                Next
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
