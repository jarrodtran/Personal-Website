import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyBody } from "@/components/sections/case-study";
import {
  getSelectedWorkBySlug,
  selectedWorkSlugs,
  site,
  siteUrl,
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
