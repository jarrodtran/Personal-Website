import { cn } from "@/lib/cn";

export function Section({
  id,
  children,
  className,
  contained = true,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  contained?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-20 sm:py-28", className)}>
      {contained ? (
        <div className="mx-auto max-w-5xl px-5 sm:px-8">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-12 max-w-2xl">
      {eyebrow ? (
        <p className="text-accent mb-3 text-xs font-medium tracking-[0.16em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
