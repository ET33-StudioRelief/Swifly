import { gsap, ScrollTrigger } from '../utils/gsap';

const LINE_SELECTOR = '.stats_progress-line';
const SECTION_SELECTOR = '.stats_component';

const getTargetWidth = (line: HTMLElement): number | null => {
  const value = parseFloat(line.dataset.stats ?? '');
  return Number.isNaN(value) ? null : value;
};

/**
 * Animates `.stats_progress-line` bars from 0% to their `data-stats` value
 * when `.stats_component` enters the viewport.
 *
 * Expects Webflow to set `.stats_progress-line { width: 0%; }` as the initial state.
 */
export function initStatsProgress(): void {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) return;

  const lines = gsap.utils.toArray<HTMLElement>(LINE_SELECTOR);
  const targets = lines
    .map((line) => ({ line, width: getTargetWidth(line) }))
    .filter((entry): entry is { line: HTMLElement; width: number } => entry.width !== null);

  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    targets.forEach(({ line, width }) => {
      gsap.set(line, { width: `${width}%` });
    });
    return;
  }

  const timeline = gsap.timeline({
    paused: true,
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      toggleActions: 'play none none none',
    },
  });

  targets.forEach(({ line, width }, index) => {
    timeline.fromTo(
      line,
      { width: '0%' },
      {
        width: `${width}%`,
        duration: 1,
        ease: 'power2.out',
      },
      index * 0.15
    );
  });

  ScrollTrigger.refresh();
}
