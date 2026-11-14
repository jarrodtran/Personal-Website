import { ArrowUpRight } from "lucide-react";
import { nextSelectedWork, type SelectedWorkItem } from "@/content/site";
import { tap, textAction } from "@/lib/ui";
import { withBasePath } from "@/lib/base-path";

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="group border-border mt-6 border-t first:mt-0 first:border-t-0 sm:mt-8">
      <div className="pt-6 group-first:pt-0 sm:pt-8 sm:group-first:pt-0">
        <h2 className="text-accent font-mono-label mb-3">{label}</h2>
        {children}
      </div>
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

function Paragraphs({ text }: { text: string | string[] }) {
  const paragraphs = Array.isArray(text) ? text : [text];
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="text-foreground measure text-[length:var(--text-body)] leading-[var(--leading-copy)] text-pretty"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function CaseStudyBody({ item }: { item: SelectedWorkItem }) {
  const { caseStudy } = item;
  const next = nextSelectedWork(item.slug);

  return (
    <article className="lg:max-w-study mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-20">
      <p className="font-mono-label text-muted-foreground">
        <a href={withBasePath("/#work")} className={tap}>
          Selected work
        </a>
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
        {item.panel.supporting?.length ? (
          <dl className="border-border mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))] gap-x-6 gap-y-4 border-t pt-5">
            {item.panel.supporting.map((figure) => (
              <div key={figure.label} className="flex min-w-0 flex-col">
                <dt className="text-muted-foreground text-small order-2">
                  {figure.label}
                </dt>
                <dd className="tabular font-display order-1 text-[length:var(--text-h2)] leading-[var(--leading-figure)]">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className="mt-10">
        <Block label="Context">
          <Paragraphs text={caseStudy.context} />
        </Block>
        <Block label="Constraints">
          <BulletList items={caseStudy.constraints} />
        </Block>
        <Block label="Decisions">
          <BulletList items={caseStudy.decisions} />
        </Block>
        <Block label="Outcome">
          <Paragraphs text={caseStudy.outcomeDetail} />
        </Block>
        <Block label="My role">
          <BulletList items={caseStudy.role} />
        </Block>
      </div>

      <div className="border-border mt-10 flex flex-col gap-1 border-t pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        {next ? (
          <a
            href={withBasePath(`/work/${next.slug}/`)}
            className={`${textAction} w-full sm:w-auto`}
          >
            Next: {next.title}
          </a>
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
        <a
          href={withBasePath("/#work")}
          className={`${tap} text-muted-foreground hover:text-foreground underline underline-offset-4`}
        >
          Back to selected work
        </a>
      </div>
    </article>
  );
}
