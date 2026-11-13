import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { tap } from "@/lib/ui";

export function SelectedWork() {
  return (
    <Section id="work">
      <span id="experience" className="block scroll-mt-24" />
      <SectionHeading title={site.sections.work.title} />
      <p className="text-muted-foreground measure text-body leading-[var(--leading-copy)]">
        These case studies cover the AI tools we put into production at Tesla
        Energy, how we allocated investment, and earlier work at Apple and
        Waymo.
      </p>
      <ul
        role="list"
        className="border-border divide-border mt-4 divide-y border-y"
      >
        {site.selectedWork.map(({ slug, title }) => (
          <li key={slug}>
            <Link
              href={`/work/${slug}/`}
              className={`${tap} w-full gap-3 py-2 font-medium underline-offset-4 hover:underline`}
            >
              <span className="min-w-0 flex-1">{title}</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
