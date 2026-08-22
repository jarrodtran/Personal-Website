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
    <section id={id} className={cn("scroll-mt-24 py-24 sm:py-32", className)}>
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
    <div className="mb-14 max-w-2xl">
      {eyebrow ? (
        <p className="text-accent font-mono-label mb-4">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-4xl tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
