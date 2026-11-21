import { useEffect } from 'react';

/**
 * Adds `is-visible` to every `[data-reveal]` element once it scrolls into view.
 * The hidden starting state is only applied when JS runs and motion is allowed
 * (see `.js-reveal` in base.css), so content is never stuck invisible.
 */
export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    const observe = () =>
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => observer.observe(el));
    observe();
    // Pick up elements that mount later (e.g. after a gallery filter change).
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);
}
