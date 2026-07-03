import { gsap } from '../utils/gsap';

/**
 * Generic background-image parallax.
 *
 * Targets any wrapper carrying the `data-parallax-bg` attribute, so it can be
 * reused on any section without touching the JS. Each wrapper can be tuned
 * directly from Webflow via custom attributes:
 * - `data-parallax-amount`: travel distance in % of the image height (default 5)
 * - `data-parallax-speed`: ScrollTrigger scrub value (default 1.4)
 *
 * @param selector - CSS selector targeting the parallax wrapper(s).
 */
export function initBgParallax(selector = '[data-parallax-bg]'): void {
  if (!document.querySelector(selector)) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 480px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = (context.conditions ?? {}) as {
        isDesktop: boolean;
        reduceMotion: boolean;
      };
      if (!isDesktop || reduceMotion) return;

      gsap.utils.toArray<HTMLElement>(selector).forEach((wrap) => {
        const img = wrap.querySelector('img');
        if (!img) return;

        const amount = parseFloat(wrap.dataset.parallaxAmount ?? '') || 5;
        const speed = parseFloat(wrap.dataset.parallaxSpeed ?? '') || 1.4;

        gsap.fromTo(
          img,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap.closest('section') ?? wrap,
              start: 'top bottom',
              end: 'bottom top',
              scrub: speed,
            },
          }
        );
      });
    }
  );
}
