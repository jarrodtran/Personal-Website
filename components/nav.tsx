"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteContent } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/ui";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav({
  name,
  items,
}: {
  name: string;
  items: SiteContent["nav"];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";
  const sectionHref = (href: string) =>
    withBasePath(href.startsWith("#") && !onHome ? `/${href}` : href);
  const homeHref = onHome ? "#top" : withBasePath("/");
  const current = onHome
    ? scrolled
      ? active
      : ""
    : /^\/work\/[^/]+/.test(pathname)
      ? "#work"
      : /^\/writing\/?$/.test(pathname)
        ? "/writing/"
        : /^\/resume\/?$/.test(pathname)
          ? "/resume/"
          : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!onHome) return;
    const ids = items
      .filter((item) => item.href.startsWith("#"))
      .map((item) => item.href.slice(1));
    const visible = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target, entry.intersectionRatio);
          } else {
            visible.delete(entry.target);
          }
        }
        const section = [...visible].sort((a, b) => b[1] - a[1])[0]?.[0];
        setActive(section ? `#${section.id}` : "");
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.6] },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items, onHome]);

  const ariaCurrent = (href: string) =>
    current === href ? (onHome ? "location" : "true") : undefined;

  // One row from 43rem of header width. Below that the links drop to a second
  // row instead of hiding behind a menu button, and the header stops sticking
  // so two rows never cover the page.
  return (
    <header
      className={cn(
        "bg-background z-50 border-b md:sticky md:top-0",
        scrolled ? "md:border-border border-transparent" : "border-transparent",
      )}
    >
      <div className="lg:max-w-site @container mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 @[43rem]:grid-cols-[minmax(0,1fr)_auto_auto]">
          <a
            href={homeHref}
            className={cn(
              tap,
              "col-start-1 row-start-1 min-w-0 font-medium tracking-tight",
            )}
          >
            <span className="min-w-0 text-wrap">{name}</span>
          </a>

          <nav
            className="col-span-2 row-start-2 -ml-2.5 flex flex-wrap items-center pb-2 @[43rem]:col-span-1 @[43rem]:col-start-2 @[43rem]:row-start-1 @[43rem]:ml-0 @[43rem]:gap-1 @[43rem]:pb-0"
            aria-label="Primary"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                aria-current={ariaCurrent(item.href)}
                className={cn(
                  tap,
                  "text-small px-2.5 whitespace-nowrap transition-colors",
                  current === item.href
                    ? "text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="col-start-2 row-start-1 @[43rem]:col-start-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
