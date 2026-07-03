import { gsap } from '../utils/gsap';

/** Vertical parallax distance (in px) shared by every `.apps_icon-wrp`. */
const PARALLAX_SPEED = 50;

/**
 * Parallax of the app icons inside the `.section_apps` component.
 *
 * Every `.apps_icon-wrp` moves upward at the same speed while scrolling.
 */
export function initAppsIconsParallax(): void {
  const section = document.querySelector('.section_apps');
  if (!section) return;

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

      gsap.utils.toArray<HTMLElement>('.apps_icon-wrp').forEach((icon) => {
        gsap.to(icon, {
          y: -PARALLAX_SPEED,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });
    }
  );
}
