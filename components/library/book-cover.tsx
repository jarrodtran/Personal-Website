import { cn } from "@/lib/cn";

/**
 * One cover in a fixed 2:3 box, so lazy images never shift the layout. Books
 * without a cover get a typeset tile: title in the display face, author below.
 */
export function BookCover({
  title,
  author,
  src,
  alt = "",
  eager = false,
  className,
}: {
  title: string;
  author?: string;
  /** Base-path-prefixed cover URL. */
  src?: string;
  /** Empty when the title is printed next to the cover. */
  alt?: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-surface border-border relative block aspect-[2/3] w-full overflow-hidden border",
        className,
      )}
    >
      {src ? (
        // A static export serves covers as plain files; next/image would not
        // add the base path to a string src.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={400}
          height={600}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          aria-hidden={alt ? undefined : true}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center [overflow-wrap:anywhere]"
        >
          <span className="font-display text-small leading-tight">{title}</span>
          {author ? (
            <>
              <span aria-hidden="true" className="bg-border-control h-px w-6" />
              <span className="text-muted-foreground text-[0.6875rem] leading-tight">
                {author}
              </span>
            </>
          ) : null}
        </span>
      )}
    </span>
  );
}
