import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
} from "next/font/google";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { site, siteUrl } from "@/content/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.positioning.name}: ${site.positioning.headline}`,
    template: `%s · ${site.positioning.name}`,
  },
  description: site.positioning.valueProp,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${site.positioning.name}: ${site.positioning.headline}`,
    description: site.positioning.valueProp,
    siteName: site.positioning.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.positioning.name}: ${site.positioning.headline}`,
    description: site.positioning.valueProp,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.positioning.name,
  url: siteUrl,
  jobTitle: site.positioning.currentRole,
  worksFor: { "@type": "Organization", name: site.roles[0].company },
  description: site.positioning.valueProp,
  email: `mailto:${site.contact.email}`,
  image: `${siteUrl}${site.about.photo.src}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Houston",
    addressRegion: "TX",
    addressCountry: "US",
  },
  alumniOf: { "@type": "CollegeOrUniversity", name: "University at Buffalo" },
  sameAs: [site.contact.linkedin, site.contact.github].filter(Boolean),
  knowsAbout: site.knowsAbout,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((t==null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <Providers>
          <a
            href="#content"
            className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-sm focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <Nav />
          <main id="content">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
