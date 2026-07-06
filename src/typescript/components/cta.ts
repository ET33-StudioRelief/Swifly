import { DESKTOP_QUERY } from '../utils/breakpoints';
import { gsap } from '../utils/gsap';

const BASE_SCALE = 0.95;
const PEAK_SCALE = 1.1;

/**
 * Scales `.faster_cta_img` while scrolling through `.faster_cta` (desktop only).
 */
export function initFasterCtaImgScale(selector = '.faster_cta'): void {
  const sections = document.querySelectorAll(selector);
  if (!sections.length) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: DESKTOP_QUERY,
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = (context.conditions ?? {}) as {
        isDesktop: boolean;
        reduceMotion: boolean;
      };
      if (!isDesktop || reduceMotion) return;

      sections.forEach((section) => {
        const img = section.querySelector<HTMLElement>('.faster_cta_img');
        if (!img) return;

        gsap.fromTo(
          img,
          { scale: BASE_SCALE },
          {
            scale: PEAK_SCALE,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          }
        );
      });
    }
  );
}
