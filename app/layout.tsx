import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/providers";
import { site, siteUrl } from "@/content/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  jobTitle: site.roles[0].title,
  worksFor: { "@type": "Organization", name: "Tesla" },
  description: site.positioning.valueProp,
  email: `mailto:${site.contact.email}`,
  telephone: site.contact.phone
    ? `+1${site.contact.phone.replace(/\D/g, "")}`
    : undefined,
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
            className="focus:bg-card sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:shadow-[var(--shadow-card)]"
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
