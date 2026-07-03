import { gsap } from '../utils/gsap';

const MARQUEE_DURATION = 40;
const HOVER_TIME_SCALE = 0.25;
const FILL_RATIO = 2.2;

const DOCK = {
  BASE_SCALE: 1,
  PEAK_SCALE: 2,
  MAX_BLUR: 2,
  LERP: 0.18,
  ACTIVE_RADIUS_ITEMS: 2.5,
  /** Extra spacing (px per side) added at peak scale to compensate for the
   * fact that CSS scale doesn't push flex neighbors. Falls off linearly. */
  PEAK_MARGIN: 14,
} as const;

interface DockEffect {
  refresh: () => void;
  destroy: () => void;
}

interface DockItem {
  el: HTMLElement;
  baseW: number;
  scale: number;
  blur: number;
  margin: number;
  targetScale: number;
  targetBlur: number;
  targetMargin: number;
}

/**
 * Initializes every marquee carrying the `data-marquee` attribute.
 *
 * Each marquee needs a `.marquee-track` child. Add `data-effect="dock"` on the
 * marquee to enable the macOS-dock-style hover magnification of `.marquee-item`s.
 *
 * @param selector - CSS selector targeting the marquee wrapper(s).
 */
export function initMarqueeFlags(selector = '[data-marquee]'): void {
  const marquees = document.querySelectorAll<HTMLElement>(selector);
  if (!marquees.length) return;

  marquees.forEach((marquee) => initMarquee(marquee));
}

function initMarquee(marquee: HTMLElement): void {
  const track = marquee.querySelector<HTMLElement>('.marquee-track');
  if (!track) return;

  const original = track.innerHTML;
  let dock: DockEffect | null = null;

  const build = (): void => {
    track.innerHTML = original;
    const setWidth = track.scrollWidth;
    const containerWidth = marquee.offsetWidth;
    const setsNeeded = Math.max(2, Math.ceil((containerWidth * FILL_RATIO) / setWidth));
    track.innerHTML = original.repeat(setsNeeded);
  };

  build();

  gsap.set(track, { xPercent: -50, force3D: true });
  const tween = gsap.to(track, {
    xPercent: 0,
    duration: MARQUEE_DURATION,
    ease: 'none',
    repeat: -1,
  });

  marquee.addEventListener('mouseenter', () => {
    gsap.to(tween, { timeScale: HOVER_TIME_SCALE, duration: 0.4, overwrite: true });
  });
  marquee.addEventListener('mouseleave', () => {
    gsap.to(tween, { timeScale: 1, duration: 0.4, overwrite: true });
  });

  if (marquee.dataset.effect === 'dock') {
    dock = createDockEffect(marquee);
  }

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      build();
      dock?.refresh();
    }, 150);
  });
}

function createDockEffect(marquee: HTMLElement): DockEffect {
  const { BASE_SCALE, PEAK_SCALE, MAX_BLUR, LERP, ACTIVE_RADIUS_ITEMS, PEAK_MARGIN } = DOCK;

  let items: DockItem[] = [];
  let pointerX = 0;
  let isHover = false;
  let rafId: number | null = null;
  let basePitch = 56;

  const collect = (): void => {
    items = Array.from(marquee.querySelectorAll<HTMLElement>('.marquee-item')).map((el) => {
      const rect = el.getBoundingClientRect();
      el.style.willChange = 'transform, filter, margin';
      el.style.transformOrigin = '50% 50%';
      el.style.flexShrink = '0';

      return {
        el,
        baseW: rect.width,
        scale: BASE_SCALE,
        blur: MAX_BLUR,
        margin: 0,
        targetScale: BASE_SCALE,
        targetBlur: MAX_BLUR,
        targetMargin: 0,
      };
    });

    if (items.length >= 2) {
      const r1 = items[0].el.getBoundingClientRect();
      const r2 = items[1].el.getBoundingClientRect();
      basePitch = Math.abs(r2.left + r2.width / 2 - (r1.left + r1.width / 2)) || items[0].baseW;
    } else if (items.length === 1) {
      basePitch = items[0].baseW;
    }
  };

  const getMarqueeCenter = (): number => {
    const rect = marquee.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };

  const updateTargets = (): void => {
    if (!items.length) return;

    const refX = isHover ? pointerX : getMarqueeCenter();
    const radiusPx = basePitch * ACTIVE_RADIUS_ITEMS;

    for (const item of items) {
      const rect = item.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const dist = Math.abs(cx - refX);
      const t = Math.max(0, 1 - dist / radiusPx);

      item.targetScale = BASE_SCALE + (PEAK_SCALE - BASE_SCALE) * t;
      item.targetBlur = MAX_BLUR * (1 - t);
      item.targetMargin = PEAK_MARGIN * t;
    }
  };

  const render = (): void => {
    for (const it of items) {
      it.scale += (it.targetScale - it.scale) * LERP;
      it.blur += (it.targetBlur - it.blur) * LERP;
      it.margin += (it.targetMargin - it.margin) * LERP;

      it.el.style.transform = `scale(${it.scale.toFixed(4)})`;
      it.el.style.filter = it.blur < 0.05 ? 'none' : `blur(${it.blur.toFixed(2)}px)`;
      it.el.style.marginLeft = `${it.margin.toFixed(2)}px`;
      it.el.style.marginRight = `${it.margin.toFixed(2)}px`;
    }
  };

  const loop = (): void => {
    updateTargets();
    render();
    rafId = requestAnimationFrame(loop);
  };

  marquee.addEventListener('mouseenter', () => {
    isHover = true;
  });
  marquee.addEventListener('mouseleave', () => {
    isHover = false;
  });
  marquee.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
  });

  collect();
  loop();

  return {
    refresh: collect,
    destroy: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}
