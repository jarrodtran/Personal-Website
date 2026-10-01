import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSelectedWorkBySlug,
  selectedWorkSlugs,
  site,
  siteUrl,
  type SelectedWorkItem,
} from "@/content/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return selectedWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getSelectedWorkBySlug(slug);
  if (!item) {
    return { title: "Case study" };
  }
  const title = item.title;
  const description = item.problem;
  const path = `/work/${item.slug}/`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: `${siteUrl}${path}`,
      title: `${title} · ${site.positioning.name}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${site.positioning.name}`,
      description,
    },
  };
}

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
    <ul className="text-muted-foreground space-y-3 text-base leading-relaxed">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="text-accent mt-2 size-1.5 shrink-0 rounded-full bg-current"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CaseStudyBody({ item }: { item: SelectedWorkItem }) {
  const { caseStudy } = item;
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="text-accent font-mono-label">
        <Link href="/#work" className="hover:underline">
          Selected work
        </Link>
        <span aria-hidden="true"> / </span>
        {item.panel.kicker}
      </p>
      <h1 className="font-display mt-4 text-4xl tracking-tight text-balance sm:text-5xl">
        {item.title}
      </h1>
      <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty">
        {item.problem}
      </p>

      <div className="border-border bg-muted mt-10 flex flex-col justify-between gap-4 border p-6 sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-accent font-mono-label">{item.panel.kicker}</p>
          <p className="tabular font-display mt-3 text-5xl sm:text-6xl">
            {item.panel.value}
          </p>
        </div>
        <p className="text-muted-foreground max-w-sm text-sm leading-snug">
          {item.panel.label}
        </p>
      </div>

      <div className="mt-12">
        <Block label="Context">
          <p className="text-muted-foreground text-base leading-relaxed text-pretty">
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
          <p className="text-muted-foreground text-base leading-relaxed text-pretty">
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

      <div className="border-border mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {item.tags.map((tag) => (
            <span key={tag} className="text-muted-foreground font-mono-label">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {item.link ? (
            <a
              href={item.link.href}
              className="text-accent font-medium hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {item.link.label}
            </a>
          ) : null}
          <Link
            href="/#work"
            className="text-muted-foreground hover:text-foreground"
          >
            Back to selected work
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getSelectedWorkBySlug(slug);
  if (!item) notFound();
  return <CaseStudyBody item={item} />;
}
