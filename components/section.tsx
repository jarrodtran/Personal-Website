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
    <section
      id={id}
      className={cn("border-border scroll-mt-24 border-t py-16 sm:py-20", className)}
    >
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
    <div className="mb-10 max-w-2xl sm:mb-12">
      {eyebrow ? (
        <p className="text-accent font-mono-label mb-3">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-[2rem] leading-tight tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground measure mt-4 text-lg leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
