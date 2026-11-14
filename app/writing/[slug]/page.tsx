import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SubscribeBlock } from "@/components/subscribe";
import { site, siteUrl } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import {
  essayWordCount,
  readingMinutes,
  sanitizeEssayHtml,
} from "@/lib/essay-html";
import { tap, textAction } from "@/lib/ui";
import {
  ESSAY_PLACEHOLDER_SLUG,
  formatPostDate,
  loadEssays,
} from "@/lib/writing";

export const dynamicParams = false;

export async function generateStaticParams() {
  const essays = await loadEssays(site.substack);
  return essays.length > 0
    ? essays.map(({ slug }) => ({ slug }))
    : [{ slug: ESSAY_PLACEHOLDER_SLUG }];
}

async function findEssay(slug: string) {
  const essays = await loadEssays(site.substack);
  return essays.find((essay) => essay.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const essay = await findEssay(slug);
  if (!essay) return { title: "Essay" };
  const { title, summary, date, path } = essay.post;
  return {
    title,
    description: summary || undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: `${siteUrl}${path}`,
      title: `${title} · ${site.substack.name}`,
      description: summary || undefined,
      siteName: site.positioning.name,
      locale: "en_US",
      ...(date ? { publishedTime: date } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${site.substack.name}`,
      description: summary || undefined,
    },
  };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = await findEssay(slug);
  if (!essay) notFound();
  const { post } = essay;
  const html = sanitizeEssayHtml(essay.body);
  const minutes = readingMinutes(essayWordCount(html));
  const dateLabel = post.date ? formatPostDate(post.date) : "";

  return (
    <div className="lg:max-w-site mx-auto w-full max-w-5xl px-5 sm:px-8">
      <article
        data-essay
        className="lg:max-w-home w-full max-w-prose py-[var(--spacing-section)]"
      >
        <a
          href={withBasePath("/writing/")}
          className={`${tap} text-muted-foreground hover:text-foreground text-small -ml-0.5 gap-1.5 no-underline`}
        >
          <ArrowLeft className="size-[16px] shrink-0" aria-hidden="true" />
          {site.writing.allEssays}
        </a>
        <h1 className="measure font-display mt-4 text-[length:var(--text-h1)] leading-[var(--leading-hero)] tracking-tight text-balance">
          {post.title}
        </h1>
        <p className="text-muted-foreground text-small tabular mt-3">
          {dateLabel ? (
            <>
              <time dateTime={post.date}>{dateLabel}</time>
              <span aria-hidden="true"> · </span>
            </>
          ) : null}
          {minutes} {site.writing.essay.minutes}
        </p>
        <div
          className="essay-body measure mt-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="border-border mt-12 border-t pt-8">
          <SubscribeBlock level={2} embed />
          <a
            href={post.href}
            className={`${textAction} mt-8`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {site.writing.essay.onSubstack}
            <ArrowUpRight className="size-[16px] shrink-0" aria-hidden="true" />
            <span className="sr-only">(opens Substack)</span>
          </a>
        </div>
      </article>
    </div>
  );
}
