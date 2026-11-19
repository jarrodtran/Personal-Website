"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { shade, SPINE_FALLBACK, type ShelfBook } from "@/lib/library";

const label = "font-library-mono text-[0.6875rem] tracking-[0.22em] uppercase";
const action = cn(
  label,
  "text-muted-foreground hover:text-foreground inline-flex min-h-11 min-w-11 items-center justify-center gap-2 transition-colors",
);

/**
 * Book detail in a native modal dialog, laid out like the book pulled off the
 * shelf: the cover, turned slightly to show its spine, beside its card. Focus
 * moves in and back, Escape and a click outside close it, and the arrow keys
 * step through the books in the current filter and sort order.
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
  const color = book?.color ?? SPINE_FALLBACK;

  return (
    <dialog
      ref={ref}
      aria-labelledby="book-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target === event.currentTarget || target.dataset.backdrop)
          onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onStep(-1);
        if (event.key === "ArrowRight") onStep(1);
      }}
      className="text-foreground m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-transparent p-0 backdrop:bg-[color-mix(in_srgb,var(--muted)_86%,transparent)] backdrop:backdrop-blur-xl"
    >
      {book ? (
        <div
          data-backdrop="true"
          className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center gap-10 px-5 py-12 sm:px-8 md:flex-row md:gap-16"
        >
          <div
            className="w-40 shrink-0 sm:w-56 md:w-72"
            style={{ perspective: "1600px" }}
          >
            <div
              className="relative aspect-[2/3] w-full shadow-[0_50px_100px_-40px_rgb(0_0_0/0.55)] transition-transform duration-700 motion-reduce:transition-none"
              style={{
                transform: "rotateY(16deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="bg-surface border-border absolute inset-0 overflow-hidden rounded-r-[3px] border"
                style={{ backgroundColor: book.src ? color : undefined }}
              >
                {book.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.src}
                    alt={`Cover of ${book.title}`}
                    width={400}
                    height={600}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center">
                    <span className="font-display text-[1.25rem] leading-tight">
                      {book.title}
                    </span>
                    <span className="bg-border-control h-px w-8" />
                    <span className="text-muted-foreground text-small">
                      {book.author}
                    </span>
                  </span>
                )}
                <span className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-[linear-gradient(90deg,rgb(0_0_0/0.28),rgb(255_255_255/0.12)_45%,rgb(0_0_0/0.06))]" />
              </div>
              {/* The spine, folded back from the left edge */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-full h-full w-7 rounded-l-[2px] [backface-visibility:hidden]"
                style={{
                  backgroundColor: shade(color, 0.12),
                  transformOrigin: "right center",
                  transform: "rotateY(-90deg)",
                }}
              />
            </div>
          </div>

          <div className="w-full max-w-xl min-w-0">
            <p className={cn(label, "text-muted-foreground")}>
              {book.category}
            </p>
            <h2
              id="book-dialog-title"
              className="font-display mt-3 text-[clamp(2.25rem,5vw,3.25rem)] leading-[1.05] text-balance [overflow-wrap:anywhere]"
            >
              {book.title}
            </h2>
            <p className="font-display mt-3 text-[1.375rem] italic">
              {book.author}
            </p>
            <p
              className={cn(label, "text-muted-foreground tabular mt-5")}
              aria-live="polite"
            >
              {book.year ? `First published ${book.year} · ` : ""}
              {`${position + 1} of ${total}`}
            </p>
            <ul role="list" className="mt-3 flex flex-wrap gap-x-6">
              {links.map((link) => (
                <li key={link.label} className="max-w-full">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(action, "text-foreground")}
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {link.label}
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="border-border mt-6 flex flex-wrap items-center gap-x-6 border-t pt-3">
              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => onStep(-1)}
                    className={action}
                  >
                    <ArrowLeft aria-hidden="true" className="size-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => onStep(1)}
                    className={action}
                  >
                    Next
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className={cn(action, "text-foreground ml-auto")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
