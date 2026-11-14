import type { Metadata } from "next";
import { withBasePath } from "@/lib/base-path";
import { tap } from "@/lib/ui";

export type LegacyHash = "work";

const COPY: Record<LegacyHash, { title: string; label: string }> = {
  work: { title: "Work", label: "Go to Work" },
};

export function legacyRedirectTarget(hash: LegacyHash): string {
  return withBasePath(`/#${hash}`);
}

export function legacyRedirectMetadata(hash: LegacyHash): Metadata {
  return {
    title: COPY[hash].title,
    robots: { index: false, follow: true },
  };
}

export function LegacyRedirect({ hash }: { hash: LegacyHash }) {
  const href = legacyRedirectTarget(hash);
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <div className="lg:max-w-site mx-auto max-w-5xl px-5 py-28 sm:px-8">
        <p className="measure text-[length:var(--text-body)] leading-[var(--leading-copy)]">
          <a href={href} className={tap}>
            {COPY[hash].label}
          </a>
        </p>
      </div>
    </>
  );
}
