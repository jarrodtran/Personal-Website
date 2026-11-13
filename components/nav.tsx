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
}: {
  name: string;
  items: SiteContent["nav"];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
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
      : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!onHome) return;
    const ids = items.map((item) => item.href.split("#").pop() ?? "");
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
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setOpen(false);
        toggleRef.current?.focus({ preventScroll: true });
      }
    };
    // Background content remains visible but cannot receive focus through Tab.
    const background = document.querySelectorAll<HTMLElement>(
      "#content, body > footer",
    );
    const madeInert = Array.from(background).filter(
      (element) => !element.inert,
    );
    for (const element of madeInert) element.inert = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      for (const element of madeInert) element.inert = false;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
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
                aria-current={
                  current === item.href
                    ? onHome
                      ? "location"
                      : "true"
                    : undefined
                }
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
          className="border-border bg-background max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-t"
        >
          <nav
            className="mx-auto flex max-w-5xl flex-col px-5 py-3"
            aria-label="Mobile"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={sectionHref(item.href)}
                aria-current={
                  current === item.href
                    ? onHome
                      ? "location"
                      : "true"
                    : undefined
                }
                className={cn(
                  tap,
                  "text-foreground text-base",
                  current === item.href && "underline underline-offset-4",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
