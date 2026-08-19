(() => {
  const progress = document.querySelector(".reading-progress");
  const supportsScrollTimeline =
    typeof CSS !== "undefined" &&
    CSS.supports &&
    CSS.supports("animation-timeline", "scroll()");

  const updateScrollProgress = () => {
    if (!progress || supportsScrollTimeline) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  };

  if (progress && !supportsScrollTimeline) {
    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("[data-analytics-event]");
    if (!link) return;
    const name = link.dataset.analyticsEvent;
    const props = { placement: link.dataset.analyticsPlacement || "unknown" };
    if (typeof window.plausible === "function") {
      window.plausible(name, { props });
    }
    window.dispatchEvent(new CustomEvent("portfolio:conversion", {
      detail: { name, ...props }
    }));
  });
})();
