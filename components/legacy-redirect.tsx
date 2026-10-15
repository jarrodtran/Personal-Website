import type { Metadata } from "next";
import { withBasePath } from "@/lib/base-path";
import { tap } from "@/lib/ui";

export type LegacyHash = "writing" | "work";

const COPY: Record<LegacyHash, { title: string; label: string }> = {
  writing: { title: "Writing", label: "Go to Writing" },
  work: { title: "Work", label: "Go to Work" },
};

export function legacyRedirectTarget(hash: LegacyHash): string {
  return withBasePath(`/#${hash}`);
}

export function legacyRedirectMetadata(hash: LegacyHash): Metadata {
  const href = legacyRedirectTarget(hash);
  return {
    title: COPY[hash].title,
    robots: { index: false, follow: true },
    alternates: { canonical: href },
  };
}

export function LegacyRedirect({ hash }: { hash: LegacyHash }) {
  const href = legacyRedirectTarget(hash);
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <link rel="canonical" href={href} />
      <div className="mx-auto max-w-5xl px-5 py-28 sm:px-8">
        <p className="measure text-lg leading-relaxed">
          <a href={href} className={tap}>
            {COPY[hash].label}
          </a>
        </p>
      </div>
    </>
  );
}
