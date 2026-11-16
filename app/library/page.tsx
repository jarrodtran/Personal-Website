import type { Metadata } from "next";
import { siteContainer } from "@/components/section";
import { LibraryBrowser } from "@/components/library/library-browser";
import {
  booksByRecency,
  coverPath,
  libraryCategories,
} from "@/content/library";
import { site, siteUrl } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { sortBooks, type ShelfBook } from "@/lib/library";

const path = "/library/";
const title = site.sections.library.title;
const description = `The books on ${site.positioning.name}'s shelf, by category.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "website",
    url: `${siteUrl}${path}`,
    title: `${title} · ${site.positioning.name}`,
    description,
    siteName: site.positioning.name,
    locale: "en_US",
  },
};

export default function LibraryPage() {
  const books: ShelfBook[] = booksByRecency().map((book, order) => {
    const cover = coverPath(book);
    return {
      slug: book.slug,
      title: book.title,
      author: book.author,
      ...(book.authorSort ? { authorSort: book.authorSort } : {}),
      category: book.category,
      order,
      ...(cover ? { src: withBasePath(cover) } : {}),
      ...(book.year ? { year: book.year } : {}),
      ...(book.olKey ? { olKey: book.olKey } : {}),
      ...(book.color ? { color: book.color } : {}),
    };
  });

  return (
    <section id="library" className="py-[var(--spacing-section)]">
      <div className={siteContainer}>
        <h1 className="font-display text-[length:var(--text-h1)] leading-[var(--leading-title)] tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-muted-foreground measure mt-2 text-[length:var(--text-body)] leading-[var(--leading-copy)]">
          {`${books.length} books from my shelves at home, shelved by section and then by author. Open one for details, or switch to the shelf view.`}
        </p>
        <div className="mt-8">
          {/* Server HTML is the default: sections, then author surname. */}
          <LibraryBrowser
            books={sortBooks(books, "category", libraryCategories)}
            categories={libraryCategories}
          />
        </div>
      </div>
    </section>
  );
}
