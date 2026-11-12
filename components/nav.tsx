"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/ui";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav({
  name,
  items,
  resumeHref,
  resumeFilename,
}: {
  name: string;
  items: SiteContent["nav"];
  resumeHref: string;
  resumeFilename: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";
  const sectionHref = (href: string) =>
    withBasePath(href.startsWith("#") && !onHome ? `/${href}` : href);
  const homeHref = onHome ? "#top" : withBasePath("/");
  const current = onHome ? active : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!onHome) return;
    const ids = items.map((item) => item.href.split("#").pop() ?? "");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActive(`#${visible.target.id}`);
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.6] },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items, onHome]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onResize = () => {
      if (toggleRef.current?.offsetParent === null) setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "bg-background sticky top-0 z-50 border-b",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="@container mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-x-4 px-5 sm:px-8">
        <a
          href={homeHref}
          className={cn(tap, "min-w-0 font-medium tracking-tight")}
        >
          <span className="min-w-0 text-wrap">{name}</span>
        </a>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <nav
            className="hidden flex-nowrap items-center gap-1 @[43rem]:flex"
            aria-label="Primary"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                aria-current={current === item.href ? "location" : undefined}
                className={cn(
                  tap,
                  "px-2.5 text-[0.9375rem] whitespace-nowrap transition-colors",
                  current === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            ))}
            <a
              href={withBasePath(resumeHref)}
              download={resumeFilename}
              className={cn(
                tap,
                "text-muted-foreground hover:text-foreground px-2.5 text-[0.9375rem] whitespace-nowrap",
              )}
            >
              Résumé
            </a>
          </nav>
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="border-border-control bg-card inline-flex size-[44px] items-center justify-center border @[43rem]:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X className="size-[16px]" />
            ) : (
              <Menu className="size-[16px]" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-border bg-background max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-t @[43rem]:hidden"
        >
          <nav
            className="mx-auto flex max-w-5xl flex-col px-5 py-3"
            aria-label="Mobile"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                className={cn(tap, "text-foreground text-base")}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href={withBasePath(resumeHref)}
              download={resumeFilename}
              className={cn(tap, "text-foreground text-base")}
              onClick={() => setOpen(false)}
            >
              Résumé
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
