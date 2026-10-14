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
    <section className="border-border border-t py-8 first:border-t-0 first:pt-0">
      <p className="text-accent font-mono-label mb-3">{label}</p>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="text-muted-foreground measure space-y-3 text-[1.0625rem] leading-relaxed">
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
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
      <p className="font-mono-label text-muted-foreground">
        <Link href="/#work" className={tap}>
          Selected work
        </Link>
        <span aria-hidden="true"> / </span>
        {item.panel.kicker}
      </p>
      <h1 className="font-display mt-4 text-[2rem] leading-tight tracking-tight text-balance sm:text-5xl">
        {item.title}
      </h1>
      <p className="text-muted-foreground measure mt-5 text-[1.0625rem] leading-relaxed text-pretty">
        {item.problem}
      </p>

      <div className="border-border bg-muted mt-8 flex flex-col justify-between gap-4 border p-5 sm:flex-row sm:items-end sm:p-7">
        <div>
          <p className="text-accent font-mono-label">{item.panel.kicker}</p>
          <p className="tabular font-display mt-3 text-5xl sm:text-6xl">
            {item.panel.value}
          </p>
        </div>
        <p className="text-muted-foreground max-w-sm text-[0.9375rem] leading-snug">
          {item.panel.label}
        </p>
      </div>

      {next ? (
        <Link
          href={`/work/${next.slug}/`}
          className={`${textAction} mt-4 w-full sm:w-auto`}
        >
          Next: {next.title}
        </Link>
      ) : null}

      <div className="mt-12">
        <Block label="Context">
          <p className="text-muted-foreground measure text-[1.0625rem] leading-relaxed text-pretty">
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
          <p className="text-muted-foreground measure text-[1.0625rem] leading-relaxed text-pretty">
            {caseStudy.outcomeDetail}
          </p>
        </Block>
        <Block label="My role">
          <BulletList items={caseStudy.role} />
        </Block>
        <Block label="Team">
          <BulletList items={caseStudy.team} />
        </Block>
      </div>

      <div className="border-border mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-muted-foreground font-mono-label">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-4">
          {item.link ? (
            <a
              href={item.link.href}
              className={textAction}
              target="_blank"
              rel="noreferrer"
            >
              {item.link.label}
            </a>
          ) : null}
          <Link href="/#work" className={`${tap} text-muted-foreground`}>
            Back to selected work
          </Link>
        </div>
      </div>
    </article>
  );
}
