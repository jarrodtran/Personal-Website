import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { nextSelectedWork, type SelectedWorkItem } from "@/content/site";
import { tap, textAction } from "@/lib/ui";

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border border-t py-[var(--spacing-section)] first:border-t-0">
      <h2 className="text-accent font-mono-label mb-3">{label}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      role="list"
      className="text-foreground measure space-y-3 text-[length:var(--text-body)] leading-[var(--leading-copy)]"
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CaseStudyBody({ item }: { item: SelectedWorkItem }) {
  const { caseStudy } = item;
  const next = nextSelectedWork(item.slug);

  return (
    <article className="lg:max-w-study mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
      <p className="font-mono-label text-muted-foreground">
        <Link href="/#work" className={tap}>
          Selected work
        </Link>
        <span aria-hidden="true"> / </span>
        {item.panel.kicker}
      </p>
      <h1 className="font-display mt-4 text-[length:var(--text-h2)] leading-[var(--leading-title)] tracking-tight text-balance sm:text-[length:var(--text-figure)]">
        {item.title}
      </h1>
      <p className="text-foreground measure mt-5 text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty">
        {item.problem}
      </p>

      <div className="border-border bg-surface mt-8 border p-5 sm:p-7">
        <p className="tabular font-display text-[length:var(--text-figure)] leading-[var(--leading-figure)] sm:text-[length:var(--text-figure-lg)]">
          {item.panel.value}
        </p>
        <p className="text-muted-foreground text-small mt-2 max-w-sm">
          {item.panel.label}
        </p>
      </div>

      <div className="mt-12">
        <Block label="Context">
          <p className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty">
            {caseStudy.context}
          </p>
        </Block>
        <Block label="Constraints">
          <BulletList items={caseStudy.constraints} />
        </Block>
        <Block label="Decisions">
          <BulletList items={caseStudy.decisions} />
        </Block>
        <Block label="Outcome">
          <p className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty">
            {caseStudy.outcomeDetail}
          </p>
        </Block>
        <Block label="My role">
          <BulletList items={caseStudy.role} />
        </Block>
      </div>

      <div className="border-border mt-10 flex flex-col gap-1 border-t pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {next ? (
          <Link
            href={`/work/${next.slug}/`}
            className={`${textAction} w-full sm:w-auto`}
          >
            Next: {next.title}
          </Link>
        ) : null}
        {item.link ? (
          <a
            href={item.link.href}
            className={textAction}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.link.label}
            <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
          </a>
        ) : null}
        <Link
          href="/#work"
          className={`${tap} text-muted-foreground hover:text-foreground underline underline-offset-4`}
        >
          Back to selected work
        </Link>
      </div>
    </article>
  );
}
