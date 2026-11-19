"use client";

import { Fragment, useEffect, useRef } from "react";
import { Spine } from "@/components/library/spine";
import { spineLook, spineTurn, type ShelfBook } from "@/lib/library";

/**
 * One long shelf that scrolls sideways. Books turn more the farther they sit
 * from the middle, so the ends show their covers; hovering lifts a book and
 * shows its card. Books scrolled past the screen edge are hidden (the edge
 * fades cover the cut), and Tab or the arrow keys bring the next one in.
 */
export function Shelf({
  books,
  label,
  bookends,
  onOpen,
}: {
  books: ShelfBook[];
  label: string;
  /** Stand a labeled bookend before each new category. */
  bookends: boolean;
  onOpen: (event: React.MouseEvent, slug: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const view = document.documentElement.clientWidth;
      const box = list.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      const half = Math.max(1, box.width / 2);
      for (const item of list.children as HTMLCollectionOf<HTMLElement>) {
        const rect = item.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        item.style.setProperty(
          "--ry",
          `${spineTurn((center - middle) / half).toFixed(2)}deg`,
        );
        // The link sits a little forward, so perspective can widen it.
        const link = item.querySelector("a")?.getBoundingClientRect() ?? rect;
        const off =
          Math.min(rect.left, link.left) < 0 ||
          Math.max(rect.right, link.right) > view;
        item.style.visibility =
          off && !item.contains(document.activeElement) ? "hidden" : "";
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    list.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [books]);

  // Mouse drag scrolls the shelf; touch and trackpads scroll natively.
  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const list = event.currentTarget;
    const startX = event.clientX;
    const startScroll = list.scrollLeft;
    dragged.current = false;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) dragged.current = true;
      if (dragged.current) list.scrollLeft = startScroll - dx;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Hidden books are not focusable, so step focus by hand: show the next
  // book, center it, then focus it.
  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const forward =
      event.key === "ArrowRight" || (event.key === "Tab" && !event.shiftKey);
    const back =
      event.key === "ArrowLeft" || (event.key === "Tab" && event.shiftKey);
    if (!forward && !back) return;
    const links = [
      ...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[href]"),
    ];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at === -1) return;
    const next = links[at + (forward ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    const item = next.closest("li");
    if (item) item.style.visibility = "";
    next.focus({ preventScroll: true });
    next.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="from-muted pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent sm:w-32"
      />
      <div
        aria-hidden="true"
        className="from-muted pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l to-transparent sm:w-32"
      />
      <ul
        ref={listRef}
        role="list"
        data-shelf=""
        aria-label={label}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
            dragged.current = false;
          }
        }}
        style={{ perspective: "1400px", perspectiveOrigin: "50% 65%" }}
        className="flex touch-pan-x [scrollbar-width:none] items-end gap-[3px] overflow-x-auto overflow-y-hidden px-[max(1.25rem,calc((100%-72rem)/2+2rem))] pt-24 pb-5 select-none [&::-webkit-scrollbar]:hidden"
      >
        {books.map((book, index) => {
          const look = spineLook(book);
          const bookend =
            bookends &&
            (index === 0 || books[index - 1].category !== book.category);
          return (
            <Fragment key={book.slug}>
              {bookend ? (
                <li
                  className="mx-2 flex shrink-0 [transform-style:preserve-3d]"
                  style={{ height: 150 }}
                >
                  <span className="bg-foreground text-background font-library-mono flex w-7 items-center justify-center rounded-t-[3px] text-[0.625rem] tracking-[0.2em] uppercase [writing-mode:vertical-rl]">
                    <span className="max-h-full overflow-hidden py-2 whitespace-nowrap">
                      {book.category}
                    </span>
                  </span>
                </li>
              ) : null}
              <li
                id={`book-${book.slug}`}
                className="relative shrink-0 [transform-style:preserve-3d]"
                style={{ width: look.width, height: look.height }}
              >
                {/* The link is a clear layer over the art, so its name is
                    the book and the 3D faces never widen its box. */}
                <a
                  href={`#book-${book.slug}`}
                  onClick={(event) => onOpen(event, book.slug)}
                  aria-label={`${book.title} by ${book.author}`}
                  draggable={false}
                  className="peer absolute inset-0 z-10 block [transform:translateZ(12px)] rounded-[2px]"
                />
                <Spine
                  title={book.title}
                  author={book.author}
                  src={book.src}
                  color={book.color}
                  look={look}
                  className="peer-hover:[--lift:-14px] peer-focus-visible:[--lift:-14px]"
                />
                <span
                  aria-hidden="true"
                  className="bg-background text-foreground border-border pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[15rem] [transform:translateX(-50%)_translateZ(80px)] border px-3 py-2 text-left opacity-0 shadow-[0_12px_30px_-12px_rgb(0_0_0/0.35)] transition-opacity duration-200 peer-hover:visible peer-hover:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100"
                >
                  <span className="font-display block text-[1.125rem] leading-tight">
                    {book.title}
                  </span>
                  <span className="font-display text-muted-foreground mt-0.5 block text-[0.9375rem] italic">
                    {book.author}
                  </span>
                  <span className="font-library-mono text-muted-foreground mt-1.5 block text-[0.625rem] tracking-[0.18em] uppercase">
                    {book.year
                      ? `${book.category} · ${book.year}`
                      : book.category}
                  </span>
                </span>
              </li>
            </Fragment>
          );
        })}
      </ul>
      <div
        aria-hidden="true"
        className="relative mx-auto -mt-5 h-3 bg-[linear-gradient(180deg,rgb(0_0_0/0.10),rgb(0_0_0/0.02))] shadow-[0_18px_30px_-18px_rgb(0_0_0/0.45)] dark:bg-[linear-gradient(180deg,rgb(255_255_255/0.10),rgb(255_255_255/0.03))]"
      />
    </div>
  );
}
