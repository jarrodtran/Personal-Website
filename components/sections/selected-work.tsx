import Link from "next/link";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export function SelectedWork() {
  return (
    <Section id="work">
      <SectionHeading title={site.sections.work.title} />

      <div className="grid gap-6 sm:grid-cols-2">
        {site.selectedWork.map((item, index) => {
          const featured = index === 0;
          return (
            <article
              key={item.slug}
              className={cn(
                "reveal border-border bg-card group has-[a:focus-visible]:outline-ring relative flex min-w-0 flex-col overflow-hidden border has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2",
                featured && "sm:col-span-2",
              )}
            >
              <div
                className={cn(
                  "border-border bg-muted @container flex aspect-[3/2] w-full min-w-0 flex-col justify-end border-b p-[20px] sm:p-[28px]",
                  featured &&
                    "sm:order-last sm:aspect-auto sm:min-h-0 sm:justify-start sm:border-t sm:border-b-0",
                )}
              >
                <div>
                  <p
                    className={cn(
                      "tabular font-display text-[min(3rem,30cqi)] leading-none sm:text-[min(3.75rem,30cqi)]",
                      featured && "measure",
                    )}
                  >
                    {item.panel.value}
                  </p>
                  <p
                    className={cn(
                      "text-muted-foreground mt-3 text-[0.9375rem] leading-snug",
                      featured ? "measure" : "max-w-xs",
                    )}
                  >
                    {item.panel.label}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-7">
                <h3 className="font-display text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
                  <Link
                    href={`/work/${item.slug}/`}
                    className="underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {item.title}
                  </Link>
                </h3>
                <div className="mt-4 space-y-3">
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.problem}
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.contribution}
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {item.outcome}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
