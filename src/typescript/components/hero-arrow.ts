import { gsap, ScrollTrigger } from '../utils/gsap';

const WRAPPER_SELECTOR = '[data-element="hero-arrow"]';
const MASK_ID = 'hero-arrow-draw-mask';
const SCATTER_GROUP_CLASS = 'hero-arrow-scatter';

const getScrollThresholdPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) * 6;

const getSvgViewBox = (
  svg: SVGSVGElement
): { x: number; y: number; width: number; height: number } => {
  const vb = svg.viewBox.baseVal;

  if (vb.width && vb.height) {
    return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
  }

  return { x: 0, y: 0, width: 117, height: 120 };
};

/**
 * Reveals scatter strokes with a mask rect that grows from top to bottom,
 * matching the visual start of the arrow (top loop) down to the arrowhead.
 */
const setupTopDownMask = (svg: SVGSVGElement): SVGRectElement | null => {
  const existingRect = svg.querySelector<SVGRectElement>(`#${MASK_ID} rect`);
  if (existingRect) return existingRect;

  const uses = [...svg.querySelectorAll(':scope > use')];
  if (!uses.length) return null;

  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
  }

  const { x, y, width } = getSvgViewBox(svg);

  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.id = MASK_ID;
  mask.setAttribute('maskUnits', 'userSpaceOnUse');

  const revealRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  revealRect.setAttribute('x', String(x));
  revealRect.setAttribute('y', String(y));
  revealRect.setAttribute('width', String(width));
  revealRect.setAttribute('height', '0');
  revealRect.setAttribute('fill', '#fff');
  mask.appendChild(revealRect);
  defs.appendChild(mask);

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', SCATTER_GROUP_CLASS);
  group.setAttribute('mask', `url(#${MASK_ID})`);
  uses.forEach((use) => group.appendChild(use));
  svg.insertBefore(group, svg.firstChild);

  return revealRect;
};

/**
 * Reveals the hero decorative arrow after 6rem of scroll (desktop only).
 * The scattered SVG strokes are unmasked from top to bottom.
 */
export function initHeroArrow(): void {
  const wrapper = document.querySelector<HTMLElement>(WRAPPER_SELECTOR);
  if (!wrapper) return;

  const svg = wrapper.querySelector('svg');
  if (!svg) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 768px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isDesktop, reduceMotion } = (context.conditions ?? {}) as {
        isDesktop: boolean;
        reduceMotion: boolean;
      };

      if (!isDesktop || reduceMotion) {
        gsap.set(wrapper, { opacity: 1, visibility: 'visible' });
        return;
      }

      const threshold = getScrollThresholdPx();
      const revealRect = setupTopDownMask(svg);
      const { height: revealHeight } = getSvgViewBox(svg);
      const canReveal = Boolean(revealRect && revealHeight > 0);

      gsap.set(wrapper, { opacity: 0, visibility: 'hidden' });

      if (canReveal && revealRect) {
        gsap.set(revealRect, { attr: { height: 0 } });
      }

      const timeline = gsap.timeline({ paused: true });

      timeline.set(wrapper, { visibility: 'visible' });

      if (canReveal && revealRect) {
        timeline.to(wrapper, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0);
        timeline.to(
          revealRect,
          {
            attr: { height: revealHeight },
            duration: 1.5,
            ease: 'power2.inOut',
          },
          0
        );
      } else {
        timeline.to(wrapper, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      }

      let hasPlayed = false;

      const playOnce = (): void => {
        if (hasPlayed) return;
        hasPlayed = true;
        timeline.play();
      };

      const scrollTrigger = ScrollTrigger.create({
        trigger: document.body,
        start: `top+=${threshold} top`,
        onEnter: () => {
          playOnce();
          scrollTrigger.kill();
        },
      });

      if (window.scrollY >= threshold) {
        hasPlayed = true;
        timeline.progress(1);
        scrollTrigger.kill();
      }

      return () => {
        scrollTrigger.kill();
        timeline.kill();
      };
    }
  );
}
