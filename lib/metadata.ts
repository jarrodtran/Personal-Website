import type { Metadata } from "next";
import { site, siteUrl } from "@/content/site";
import { writingFeedUrl } from "@/lib/writing";

const feed = writingFeedUrl(site.substack);

export const homeMetadata: Metadata = {
  alternates: {
    canonical: "/",
    ...(feed ? { types: { "application/rss+xml": feed } } : {}),
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: site.positioning.documentTitle,
    description: site.positioning.valueProp,
    siteName: site.positioning.name,
    locale: "en_US",
  },
};
