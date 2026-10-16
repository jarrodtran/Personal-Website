import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { btnPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: {
    absolute: `Page not found · ${site.positioning.name}`,
  },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-28 sm:px-8">
      <p className="text-accent font-mono-label">404</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">
        This page doesn’t exist.
      </h1>
      <p className="text-muted-foreground measure mt-3">
        Head back to {site.positioning.name}&apos;s home page.
      </p>
      <Link href="/" className={`${btnPrimary} mt-8`}>
        Go home
      </Link>
    </div>
  );
}
