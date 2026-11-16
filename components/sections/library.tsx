import { BookCover } from "@/components/library/book-cover";
import { Section, SectionHeading } from "@/components/section";
import { booksByRecency, coverPath, libraryBooks } from "@/content/library";
import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/cn";
import { btnGhost } from "@/lib/ui";

/** Covers shown per breakpoint, so the teaser is always exactly one row. */
const ROW = { base: 3, sm: 4, lg: 6 } as const;

/**
 * Home teaser: the newest covers in one row and a link to /library/. Each
 * cover opens that book's panel on /library/; the title is its alt text since
 * there are no captions here.
 */
export function Library() {
  const recent = booksByRecency()
    .filter((book) => book.cover)
    .slice(0, ROW.lg);

  return (
    <Section id="library">
      <SectionHeading title={site.sections.library.title} />
      <div>
        <p className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
          {`${libraryBooks.length} books on my shelves. The latest additions:`}
        </p>
        <ul
          role="list"
          className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6"
        >
          {recent.map((book, index) => (
            <li
              key={book.slug}
              className={
                index >= ROW.sm
                  ? "hidden lg:block"
                  : index >= ROW.base
                    ? "hidden sm:block"
                    : undefined
              }
            >
              <a
                href={withBasePath(`/library/#book-${book.slug}`)}
                className="group block"
              >
                <BookCover
                  title={book.title}
                  alt={`${book.title} by ${book.author}`}
                  src={withBasePath(coverPath(book) ?? "")}
                  className="transition-transform group-hover:-translate-y-0.5"
                />
              </a>
            </li>
          ))}
        </ul>
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
