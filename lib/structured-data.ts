import { siteUrl, type SelectedWorkItem } from "@/content/site";

export interface Crumb {
  name: string;
  url?: string;
}

/**
 * The visible breadcrumb on a case study is "Selected work / <company>", so the
 * markup mirrors it. /work/ is a redirect to the home anchor, so the parent is
 * the anchor destination rather than the redirect.
 */
export function caseStudyCrumbs(item: SelectedWorkItem): Crumb[] {
  return [
    { name: "Selected work", url: `${siteUrl}/#work` },
    { name: item.panel.kicker },
  ];
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.url ? { item: crumb.url } : {}),
    })),
  };
}
