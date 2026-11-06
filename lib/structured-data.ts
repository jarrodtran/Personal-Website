import {
  site,
  siteUrl,
  type SelectedWorkItem,
} from "@/content/site";

const person = () => ({
  "@type": "Person" as const,
  name: site.positioning.name,
  url: siteUrl,
});

const website = () => ({
  "@type": "WebSite" as const,
  name: site.positioning.name,
  url: siteUrl,
});

/**
 * Structured data for a case-study page.
 *
 * The layout already emits one `Person` node for the site. A case study is a
 * distinct creative work, so it gets its own `Article` node plus a breadcrumb
 * trail. Both carry stable `@id` values so Google can merge the graph.
 */
export function caseStudyJsonLd(item: SelectedWorkItem) {
  const url = `${siteUrl}/work/${item.slug}/`;

  const article = {
    "@type": "Article" as const,
    "@id": `${url}#article`,
    headline: item.title,
    description: item.problem,
    url,
    mainEntityOfPage: url,
    author: person(),
    publisher: person(),
    isPartOf: website(),
  };

  const breadcrumb = {
    "@type": "BreadcrumbList" as const,
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem" as const,
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem" as const,
        position: 2,
        name: "Selected work",
        item: `${siteUrl}/#work`,
      },
      {
        "@type": "ListItem" as const,
        position: 3,
        name: item.title,
        item: url,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumb],
  };
}
