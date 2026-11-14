import type { Metadata } from "next";
import { site } from "@/content/site";
import { btnPrimary } from "@/lib/ui";
import { withBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: {
    absolute: `Page not found · ${site.positioning.name}`,
  },
};

export default function NotFound() {
  return (
    <div className="lg:max-w-site mx-auto max-w-5xl px-5 py-28 sm:px-8">
      <p className="text-accent font-mono-label">404</p>
      <h1 className="font-display mt-3 text-[length:var(--text-404)] leading-[var(--leading-404)] tracking-tight">
        This page doesn’t exist.
      </h1>
      <p className="text-muted-foreground measure mt-3">
        Head back to {site.positioning.name}&apos;s home page.
      </p>
      <a href={withBasePath("/")} className={`${btnPrimary} mt-8`}>
        Go home
      </a>
    </div>
  );
}
