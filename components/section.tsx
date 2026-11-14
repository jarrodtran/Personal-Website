import { cn } from "@/lib/cn";

/**
 * The site container: the same width and side padding the nav uses, so every
 * left edge lines up with the brand.
 */
export const siteContainer =
  "mx-auto w-full max-w-5xl px-5 sm:px-8 lg:max-w-site";

/**
 * Label rail grid (see .rail-grid in globals.css). From lg: a 12rem rail for
 * a label plus one content column. Below lg: one column. Direct children go in
 * the content column; give the label the `railLabel` class to put it in the
 * rail. Use it on any container that sits inside `siteContainer`.
 */
export const railGrid = "rail-grid";
export const railLabel = "rail-label";

export function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-[var(--spacing-section)]", className)}
    >
      <div className={cn(siteContainer, railGrid)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(railLabel, "mb-5 max-w-2xl lg:mb-0 lg:max-w-none")}>
      <h2 className="font-display text-[length:var(--text-h2)] leading-[var(--leading-title)] tracking-tight text-balance">
        {title}
      </h2>
      {children}
    </div>
  );
}
