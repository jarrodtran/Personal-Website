(() => {
  const header = document.querySelector('.site-header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  const trackEvent = (name, props = {}) => {
    if (typeof window.plausible === 'function') {
      window.plausible(name, { props });
    }
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
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollState);
  };

  updateScrollState();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  }

  const navLinks = [...document.querySelectorAll('.site-header nav a')];
  if ('IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('main section[id]')];
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.1, 0.35] });
    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
