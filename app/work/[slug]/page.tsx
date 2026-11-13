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
      siteName: site.positioning.name,
      locale: "en_US",
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
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Selected work",
        item: `${siteUrl}/#work`,
      },
      { "@type": "ListItem", position: 2, name: item.panel.kicker },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
        }}
      />
      <CaseStudyBody item={item} />
    </>
  );
}
