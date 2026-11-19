import { Spine } from "@/components/library/spine";
import { Section, SectionHeading } from "@/components/section";
import { booksByRecency, coverPath, libraryBooks } from "@/content/library";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/cn";
import { spineLook } from "@/lib/library";
import { btnGhost } from "@/lib/ui";

/**
 * Home spines are at most 52px wide plus a 2px gap, so book N shows once the
 * column is at least N x 54px wide, plus room for the last book's cover
 * edge. Container queries measure the real column, at any text size.
 */
const SHOW_FROM = [
  "",
  "",
  "",
  "",
  "hidden @min-[300px]:block",
  "hidden @min-[354px]:block",
  "hidden @min-[408px]:block",
  "hidden @min-[462px]:block",
  "hidden @min-[516px]:block",
  "hidden @min-[570px]:block",
  "hidden @min-[624px]:block",
  "hidden @min-[678px]:block",
  "hidden @min-[732px]:block",
  "hidden @min-[786px]:block",
  "hidden @min-[840px]:block",
] as const;

/** Home spines run a little shorter and slimmer than on /library/. */
function homeLook(book: { slug: string; title: string }) {
  const look = spineLook(book);
  const width = Math.min(52, look.width);
  const height = Math.round(look.height * 0.8);
  return { ...look, width, height, depth: Math.round((height * 2) / 3) };
}

/**
 * Home teaser: the newest books standing on a short shelf, and a link to
 * /library/. Each spine opens that book's panel there. Server-rendered with no
 * script: the room's perspective alone turns the outer books.
 */
export function Library() {
  const recent = booksByRecency()
    .filter((book) => book.cover)
    .slice(0, SHOW_FROM.length);

  return (
    <Section id="library">
      <SectionHeading title={site.sections.library.title} />
      <div className="min-w-0">
        <p className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
          {`${libraryBooks.length} books on my shelves. The latest additions:`}
        </p>
        <div className="@container mt-4">
          <ul
            role="list"
            aria-label="Latest additions"
            style={{ perspective: "1100px", perspectiveOrigin: "50% 60%" }}
            className="flex items-end gap-[2px] pt-6"
          >
            {recent.map((book, index) => {
              const look = homeLook(book);
              const src = coverPath(book);
              return (
                <li
                  key={book.slug}
                  className={cn(
                    "relative shrink-0 [transform-style:preserve-3d]",
                    SHOW_FROM[index],
                  )}
                  style={{ width: look.width, height: look.height }}
                >
                  <a
                    href={withBasePath(`/library/#book-${book.slug}`)}
                    aria-label={`${book.title} by ${book.author}`}
                    className="peer absolute inset-0 z-10 block [transform:translateZ(12px)]"
                  />
                  <Spine
                    title={book.title}
                    author={book.author}
                    src={src ? withBasePath(src) : undefined}
                    color={book.color}
                    look={look}
                    className="peer-hover:[--lift:-10px] peer-focus-visible:[--lift:-10px]"
                  />
                </li>
              );
            })}
          </ul>
          <div
            aria-hidden="true"
            className="h-2.5 bg-[linear-gradient(180deg,rgb(0_0_0/0.10),rgb(0_0_0/0.02))] shadow-[0_16px_26px_-16px_rgb(0_0_0/0.45)] dark:bg-[linear-gradient(180deg,rgb(255_255_255/0.10),rgb(255_255_255/0.03))]"
          />
        </div>
        <a
          href={withBasePath("/library/")}
          className={cn(btnGhost, "mt-6 w-fit")}
        >
          Browse the library
        </a>
      </div>
    </Section>
  );
}
