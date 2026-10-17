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
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
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
    const bar = barRef.current;
    const nav = navRef.current;
    if (!bar || !nav) return;

    let frame = 0;
    const apply = (next: boolean) => {
      // Widening past the compact threshold restores the desktop links, so a
      // menu opened in compact mode has to close with it.
      if (compactRef.current && !next) setOpen(false);
      compactRef.current = next;
      setCompact(next);
    };
    const measure = () => {
      bar.parentElement?.style.setProperty(
        "--header-bar",
        `${bar.offsetHeight}px`,
      );
      if (!window.matchMedia("(width >= 48rem)").matches) {
        apply(false);
        return;
      }

      // At 200% text the desktop links no longer fit beside the name. Measure
      // the nav off-canvas so the header can fall back to the phone menu.
      const clone = nav.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: "absolute",
        top: "0",
        left: "-9999px",
        visibility: "hidden",
        display: "flex",
      });
      document.body.append(clone);
      const navWidth = clone.getBoundingClientRect().width;
      clone.remove();

      const style = getComputedStyle(bar);
      const available =
        bar.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      const nameWidth =
        bar.firstElementChild?.getBoundingClientRect().width ?? 0;
      apply(nameWidth + navWidth + 16 > available);
    };
    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(bar);
    window.addEventListener("resize", schedule);
    document.fonts.ready.then(schedule).catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

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
        "bg-background sticky top-0 z-50 border-b",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div
        ref={barRef}
        className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 sm:px-8"
      >
        <a
          href={homeHref}
          className={cn(tap, "shrink-0 font-medium tracking-tight")}
        >
          {name}
        </a>

        <nav
          ref={navRef}
          className={cn(
            "items-center gap-1",
            compact ? "hidden" : "hidden md:flex",
          )}
          aria-label="Primary"
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={sectionHref(item.href)}
              aria-current={current === item.href ? "location" : undefined}
              className={cn(
                tap,
                "px-2.5 text-[0.9375rem] transition-colors",
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
              "text-muted-foreground hover:text-foreground px-2.5 text-[0.9375rem]",
            )}
          >
            Résumé
          </a>
          <ThemeToggle />
        </nav>

        <div
          className={cn(
            "ml-auto flex items-center gap-2",
            !compact && "md:hidden",
          )}
        >
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="border-border bg-card inline-flex size-11 items-center justify-center border"
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
          className={cn(
            "border-border bg-background overflow-y-auto overscroll-contain border-t",
            !compact && "md:hidden",
          )}
          style={{ maxHeight: "calc(100dvh - var(--header-bar, 3.5rem))" }}
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
