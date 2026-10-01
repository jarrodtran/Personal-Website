"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/content/site";
import { cn } from "@/lib/cn";
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
    href.startsWith("#") && !onHome ? `/${href}` : href;
  const homeHref = onHome ? "#top" : "/";
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
    const desktop = window.matchMedia("(width >= 48rem)");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-md"
          : "bg-background/40 border-transparent backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
        <a href={homeHref} className="font-medium tracking-tight">
          <span className="sm:hidden">JT</span>
          <span className="hidden sm:inline">{name}</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {items.map((item) => (
            <a
              key={item.href}
              href={sectionHref(item.href)}
              aria-current={current === item.href ? "location" : undefined}
              className={cn(
                "relative pb-0.5 text-sm transition-colors",
                current === item.href
                  ? "text-foreground after:bg-accent after:absolute after:inset-x-0 after:-bottom-1 after:h-px"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
          <a
            href={resumeHref}
            download={resumeFilename}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Résumé
          </a>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="border-border bg-card inline-flex size-9 items-center justify-center rounded-sm border"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-border bg-background border-t md:hidden"
        >
          <nav
            className="mx-auto flex max-w-5xl flex-col px-5 py-4"
            aria-label="Mobile"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                className="text-foreground py-3 text-base"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href={resumeHref}
              download={resumeFilename}
              className="text-foreground py-3 text-base"
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
