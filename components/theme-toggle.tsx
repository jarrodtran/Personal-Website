"use client";

import { Moon, Sun } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pressed, setPressed] = useState(() => resolvedTheme === "dark");

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const sync = () => {
      const next =
        document.documentElement.classList.contains("dark") ||
        resolvedTheme === "dark";
      setPressed(next);
      button?.setAttribute("aria-pressed", String(next));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  return (
    <button
      ref={buttonRef}
      type="button"
      suppressHydrationWarning
      onClick={() => setTheme(pressed ? "light" : "dark")}
      aria-pressed={pressed}
      className="border-muted-foreground text-foreground hover:border-foreground inline-flex size-[44px] items-center justify-center border transition-colors"
      aria-label="Toggle color theme"
    >
      <Sun className="hidden size-[16px] dark:block" aria-hidden="true" />
      <Moon className="size-[16px] dark:hidden" aria-hidden="true" />
    </button>
  );
}
