import Link from "next/link";
import { site } from "@/content/site";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-28 sm:px-8">
      <p className="text-accent text-xs font-medium tracking-[0.16em] uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This page doesn’t exist.
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        Head back to {site.positioning.name}&apos;s home page.
      </p>
      <Link
        href="/"
        className="bg-accent text-accent-foreground mt-8 inline-flex rounded-full px-5 py-2.5 text-sm font-medium"
      >
        Go home
      </Link>
    </div>
  );
}
