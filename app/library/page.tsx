import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { siteContainer } from "@/components/section";
import { LibraryBrowser } from "@/components/library/library-browser";
import {
  booksByRecency,
  coverPath,
  libraryCategories,
} from "@/content/library";
import { site, siteUrl } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/cn";
import { sortBooks, type ShelfBook } from "@/lib/library";

// Library-only faces: an italic display cut for the welcome line and a mono
// for the card-catalog labels. Scoped to this route, so other pages skip them.
const welcomeItalic = Newsreader({
  subsets: ["latin"],
  weight: "300",
  style: "italic",
  variable: "--font-library-italic",
  display: "swap",
});

const catalogMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-library-mono",
  display: "swap",
});

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
    <section
      id="library"
      className={cn(
        welcomeItalic.variable,
        catalogMono.variable,
        "bg-muted pt-10 pb-14 sm:pt-14 sm:pb-20",
      )}
    >
      <div className={cn(siteContainer, "text-center")}>
        <p className="font-library-mono text-muted-foreground text-[0.6875rem] tracking-[0.3em] uppercase">
          From my shelves at home
        </p>
        <h1 className="font-library-italic mt-4 text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.95] tracking-[-0.01em] text-balance">
          Welcome to my library
        </h1>
        <p className="font-library-mono text-foreground mt-4 text-[0.75rem] tracking-[0.3em] uppercase">
          {`${books.length} volumes`}
        </p>
      </div>
      <div className="mt-8">
        {/* Server HTML is the default: sections, then author surname. */}
        <LibraryBrowser
          books={sortBooks(books, "category", libraryCategories)}
          categories={libraryCategories}
        />
      </div>
    </section>
  );
}
