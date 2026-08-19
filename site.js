(() => {
  const header = document.querySelector('[data-site-header]');
  const progress = document.querySelector('[data-scroll-progress]');
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trackedViews = new Set();
  let ticking = false;

  const trackEvent = (name, props = {}) => {
    if (typeof window.plausible === 'function') {
      window.plausible(name, { props });
    }
    window.dispatchEvent(new CustomEvent('portfolio:conversion', {
      detail: { name, ...props }
    }));
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('[data-analytics-event]');
    if (!link) return;
    trackEvent(link.dataset.analyticsEvent, {
      placement: link.dataset.analyticsPlacement || 'unknown'
    });
  });

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    progress?.style.setProperty('--scroll-progress', ratio.toFixed(4));
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollState);
  };

  updateScrollState();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((candidate) => {
        if (candidate === link) candidate.setAttribute('aria-current', 'location');
        else candidate.removeAttribute('aria-current');
      });
    });
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
  }

  if ('IntersectionObserver' in window) {
    const conversionViewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const name = entry.target.dataset.conversionView;
        const threshold = name === 'Proof Viewed' ? 0.5 : 0.35;
        if (!entry.isIntersecting || entry.intersectionRatio < threshold || trackedViews.has(name)) return;
        trackedViews.add(name);
        trackEvent(name, { section: entry.target.id || name.replace(' Viewed', '').toLowerCase() });
        conversionViewObserver.unobserve(entry.target);
      });
    }, { threshold: [0.35, 0.5] });
    document.querySelectorAll('[data-conversion-view]').forEach((element) => conversionViewObserver.observe(element));

    const sections = [...document.querySelectorAll('main section[id]')];
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.1, 0.35] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const impactRows = [...document.querySelectorAll('[data-impact-row]')];
  const impactPanels = [...document.querySelectorAll('[data-impact-panel]')];
  const activateImpact = (index) => {
    impactRows.forEach((row, rowIndex) => row.setAttribute('aria-current', rowIndex === index ? 'true' : 'false'));
    impactPanels.forEach((panel, panelIndex) => panel.classList.toggle('is-active', panelIndex === index));
  };

  impactRows.forEach((row, index) => {
    row.addEventListener('pointerenter', () => activateImpact(index));
    row.addEventListener('focusin', () => activateImpact(index));
  });

  if ('IntersectionObserver' in window) {
    const impactObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateImpact(Number(visible.target.dataset.impactRow));
    }, { rootMargin: '-38% 0px -38% 0px', threshold: [0, 0.25, 0.6] });
    impactRows.forEach((row) => impactObserver.observe(row));
  }
})();
