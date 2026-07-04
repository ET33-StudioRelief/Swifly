import { MOBILE_QUERY } from '../utils/breakpoints';
import { gsap } from '../utils/gsap';

const BRANDS_MOBILE_QUERY = '(max-width: 479px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** Sélecteur de l'overlay (fondu des bords) à NE PAS faire défiler. */
const BRANDS_OVERLAY_SELECTOR = '.brands_mobile-overlay';

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

interface MarqueeInstance {
  destroy: () => void;
  sync: () => void;
}

/**
 * Marquee CSS des logos de marques, actif uniquement sous 480px.
 *
 * Le JS se contente de dupliquer une fois le set de logos (impossible en CSS) ;
 * toute l'animation est gérée par une keyframe CSS (cf. home.css) pour de
 * meilleures performances. Au-dessus du breakpoint, le DOM d'origine est
 * restauré et la grille Webflow reprend la main. Aucune modif Webflow requise.
 *
 * @param selector - CSS selector targeting the logos wrapper(s).
 */
export function initBrandsMarquee(selector = '.brands_logo-wrp'): void {
  const wrappers = document.querySelectorAll<HTMLElement>(selector);
  if (!wrappers.length) return;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  const mql = window.matchMedia(BRANDS_MOBILE_QUERY);
  const originals = new Map<HTMLElement, string>();

  const enable = (wrapper: HTMLElement): void => {
    if (originals.has(wrapper)) return;
    originals.set(wrapper, wrapper.innerHTML);

    const items = (Array.from(wrapper.children) as HTMLElement[]).filter(
      (el) => !el.matches(BRANDS_OVERLAY_SELECTOR)
    );
    const overlay = wrapper.querySelector<HTMLElement>(BRANDS_OVERLAY_SELECTOR);

    const track = document.createElement('div');
    track.className = 'brands_marquee-track';

    items.forEach((item) => track.appendChild(item));
    items.forEach((item) => track.appendChild(item.cloneNode(true)));

    wrapper.classList.add('is-marquee');
    wrapper.appendChild(track);
    if (overlay) wrapper.appendChild(overlay);
  };

  const disable = (wrapper: HTMLElement): void => {
    const original = originals.get(wrapper);
    if (original === undefined) return;

    wrapper.classList.remove('is-marquee');
    wrapper.innerHTML = original;
    originals.delete(wrapper);
  };

  const sync = (): void => {
    wrappers.forEach((wrapper) => (mql.matches ? enable(wrapper) : disable(wrapper)));
  };

  sync();
  mql.addEventListener('change', sync);
}

/**
 * Initializes every marquee carrying the `data-marquee` attribute.
 *
 * Desktop : GSAP + effet dock inchangé. Mobile (≤767px) : animation CSS
 * (compositor) sans dock, pour éviter les saccades.
 *
 * Each marquee needs a `.marquee-track` child. Add `data-effect="dock"` on the
 * marquee to enable the macOS-dock-style hover magnification of `.marquee-item`s.
 *
 * @param selector - CSS selector targeting the marquee wrapper(s).
 */
export function initMarqueeFlags(selector = '[data-marquee]'): void {
  const marquees = document.querySelectorAll<HTMLElement>(selector);
  if (!marquees.length) return;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  const instances = Array.from(marquees).map((marquee) => initMarquee(marquee));
  const mql = window.matchMedia(MOBILE_QUERY);

  const onResize = (): void => {
    instances.forEach((instance) => instance.sync());
  };

  mql.addEventListener('change', onResize);

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(onResize, 150);
  });
}

function initMarquee(marquee: HTMLElement): MarqueeInstance {
  const track = marquee.querySelector<HTMLElement>('.marquee-track');
  if (!track) return { destroy: () => {}, sync: () => {} };

  const original = track.innerHTML;
  let mode: 'mobile' | 'desktop' | null = null;
  let tween: gsap.core.Tween | null = null;
  let dock: DockEffect | null = null;

  const isMobile = (): boolean => window.matchMedia(MOBILE_QUERY).matches;

  const buildContent = (): void => {
    track.innerHTML = original;
    const setWidth = track.scrollWidth;
    const containerWidth = marquee.offsetWidth;

    if (isMobile()) {
      track.innerHTML = original + original;
      return;
    }

    const setsNeeded = Math.max(2, Math.ceil((containerWidth * FILL_RATIO) / setWidth));
    track.innerHTML = original.repeat(setsNeeded);
  };

  const teardownScroll = (): void => {
    tween?.kill();
    tween = null;
    gsap.killTweensOf(track);
    gsap.set(track, { clearProps: 'transform' });
    track.classList.remove('is-animated');
    track.style.removeProperty('--marquee-duration');
  };

  const teardownDock = (): void => {
    dock?.destroy();
    dock = null;
  };

  const setupDesktopScroll = (): void => {
    gsap.set(track, { xPercent: -50, force3D: true });
    tween = gsap.to(track, {
      xPercent: 0,
      duration: MARQUEE_DURATION,
      ease: 'none',
      repeat: -1,
    });
  };

  const setupMobileScroll = (): void => {
    track.style.setProperty('--marquee-duration', `${MARQUEE_DURATION}s`);
    track.classList.add('is-animated');
  };

  const onEnter = (): void => {
    if (!tween) return;
    gsap.to(tween, { timeScale: HOVER_TIME_SCALE, duration: 0.4, overwrite: true });
  };

  const onLeave = (): void => {
    if (!tween) return;
    gsap.to(tween, { timeScale: 1, duration: 0.4, overwrite: true });
  };

  marquee.addEventListener('mouseenter', onEnter);
  marquee.addEventListener('mouseleave', onLeave);

  const sync = (): void => {
    const nextMode = isMobile() ? 'mobile' : 'desktop';

    if (nextMode === mode) {
      buildContent();
      dock?.refresh();
      return;
    }

    teardownScroll();
    teardownDock();
    mode = nextMode;

    buildContent();

    if (mode === 'mobile') {
      setupMobileScroll();
      return;
    }

    setupDesktopScroll();

    if (marquee.dataset.effect === 'dock') {
      dock = createDockEffect(marquee);
    }
  };

  sync();

  return {
    sync,
    destroy: () => {
      teardownScroll();
      teardownDock();
      marquee.removeEventListener('mouseenter', onEnter);
      marquee.removeEventListener('mouseleave', onLeave);
      track.innerHTML = original;
    },
  };
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

  const onEnter = (): void => {
    isHover = true;
  };
  const onLeave = (): void => {
    isHover = false;
  };
  const onMove = (event: MouseEvent): void => {
    pointerX = event.clientX;
  };

  marquee.addEventListener('mouseenter', onEnter);
  marquee.addEventListener('mouseleave', onLeave);
  marquee.addEventListener('mousemove', onMove);

  collect();
  loop();

  return {
    refresh: collect,
    destroy: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      marquee.removeEventListener('mouseenter', onEnter);
      marquee.removeEventListener('mouseleave', onLeave);
      marquee.removeEventListener('mousemove', onMove);
      items.forEach(({ el }) => {
        el.style.removeProperty('will-change');
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        el.style.removeProperty('margin-left');
        el.style.removeProperty('margin-right');
        el.style.removeProperty('transform-origin');
        el.style.removeProperty('flex-shrink');
      });
    },
  };
}
