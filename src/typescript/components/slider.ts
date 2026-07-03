import type { SwiperOptions } from 'swiper/types';

import { MOBILE_QUERY } from '../utils/breakpoints';
import { Swiper } from '../utils/swiper';

const SPEED = 600;

const clickToSlideHandler: SwiperOptions['on'] = {
  click(swiper) {
    if (!swiper.clickedSlide) return;
    swiper.slideTo(swiper.clickedIndex, SPEED);
  },
};

// ---------------------------------------------------------------------------
// Benefices slider (mobile-only)
// ---------------------------------------------------------------------------

const BENEFICES_GRID_SELECTOR = '.grid-cards_grid._2col';
const BENEFICES_CARD_SELECTOR = '.card.is-grid-2col';
const BENEFICES_SLIDE_CLASS = 'benefices_slide swiper-slide';

const beneficesSwiperOptions: SwiperOptions = {
  slidesPerView: 1,
  centeredSlides: true,
  rewind: true,
  spaceBetween: 16,
  grabCursor: true,
  roundLengths: true,
};

const getBeneficesGrid = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>(BENEFICES_GRID_SELECTOR);

const wrapBeneficesSlides = (grid: HTMLElement): void => {
  Array.from(grid.querySelectorAll<HTMLElement>(BENEFICES_CARD_SELECTOR)).forEach((card) => {
    if (card.closest('.benefices_slide')) return;

    card.classList.remove('swiper-slide');

    const slide = document.createElement('div');
    slide.className = BENEFICES_SLIDE_CLASS;
    card.replaceWith(slide);
    slide.appendChild(card);
  });
};

const unwrapBeneficesSlides = (grid: HTMLElement): void => {
  grid.querySelectorAll<HTMLElement>('.benefices_slide').forEach((slide) => {
    const card = slide.querySelector<HTMLElement>(BENEFICES_CARD_SELECTOR);
    if (card) slide.replaceWith(card);
  });
};

const prepareBeneficesSlider = (container: HTMLElement): boolean => {
  const grid = getBeneficesGrid(container);
  if (!grid) return false;

  container.classList.add('swiper');
  grid.classList.add('swiper-wrapper');
  wrapBeneficesSlides(grid);

  return grid.querySelectorAll<HTMLElement>('.benefices_slide').length > 0;
};

const cleanupBeneficesSlider = (container: HTMLElement): void => {
  const grid = getBeneficesGrid(container);
  container.classList.remove('swiper');
  grid?.classList.remove('swiper-wrapper');
  if (grid) unwrapBeneficesSlides(grid);
};

/**
 * Mobile-only benefices carousel.
 *
 * Webflow setup inside `.benefices_grid-wrp`:
 * - Grid source: `.grid-cards_grid._2col` with `.card.is-grid-2col` children
 * - Illustration sibling: `.benefices_illu-wrp` (outside the swiper wrapper)
 */
export function initBeneficesSlider(selector = '.benefices_grid-wrp'): void {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  if (!containers.length) return;

  const mql = window.matchMedia(MOBILE_QUERY);
  const instances = new Map<HTMLElement, Swiper>();

  const mount = (container: HTMLElement): void => {
    if (!prepareBeneficesSlider(container)) return;

    instances.set(container, new Swiper(container, beneficesSwiperOptions));
  };

  const unmount = (container: HTMLElement): void => {
    instances.get(container)?.destroy(true, true);
    instances.delete(container);
    cleanupBeneficesSlider(container);
  };

  const sync = (): void => {
    containers.forEach((container) => {
      if (mql.matches && !instances.has(container)) mount(container);
      else if (!mql.matches && instances.has(container)) unmount(container);
    });
  };

  sync();
  mql.addEventListener('change', sync);
}

// ---------------------------------------------------------------------------
// Bento slider (mobile-only)
// ---------------------------------------------------------------------------

const BENTO_SLIDE_CLASS = 'bento_slide swiper-slide';
const BENTO_WRAPPER_SELECTOR =
  '.bento_slider-list.swiper-wrapper, .bento_slider_list.swiper-wrapper';

const equalizeFrameIds = new WeakMap<HTMLElement, number>();

const bentoSwiperOptions: SwiperOptions = {
  slidesPerView: 1.15,
  centeredSlides: true,
  rewind: true,
  spaceBetween: 16,
  grabCursor: true,
};

const getBentoWrapper = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>(BENTO_WRAPPER_SELECTOR);

const getBentoSourceSlots = (container: HTMLElement): HTMLElement[] => {
  const scope =
    container.closest('.bento_content') ?? container.closest('.bento_slider-wrp')?.parentElement;

  const gridWrp = scope?.querySelector<HTMLElement>('.bento_grid-wrp');
  if (!gridWrp) return [];

  return Array.from(gridWrp.querySelectorAll<HTMLElement>('.card-slot')).filter(
    (slot) => slot.children.length > 0
  );
};

const populateBentoSlides = (wrapper: HTMLElement, sources: HTMLElement[]): void => {
  const fragment = document.createDocumentFragment();

  sources.forEach((slot) => {
    const slide = document.createElement('div');
    slide.className = BENTO_SLIDE_CLASS;
    slide.appendChild(slot.cloneNode(true));
    fragment.appendChild(slide);
  });

  wrapper.replaceChildren(fragment);
};

const equalizeBentoSlideHeights = (container: HTMLElement): void => {
  const wrapper = getBentoWrapper(container);
  if (!wrapper) return;

  const slides = wrapper.querySelectorAll<HTMLElement>('.bento_slide');
  slides.forEach((slide) => {
    slide.style.height = '';
  });

  const maxHeight = Math.max(0, ...Array.from(slides, (slide) => slide.offsetHeight));
  if (!maxHeight) return;

  slides.forEach((slide) => {
    slide.style.height = `${maxHeight}px`;
  });
};

const cancelScheduledBentoEqualize = (container: HTMLElement): void => {
  const frameId = equalizeFrameIds.get(container);
  if (frameId === undefined) return;

  cancelAnimationFrame(frameId);
  equalizeFrameIds.delete(container);
};

const scheduleEqualizeBentoSlideHeights = (container: HTMLElement): void => {
  cancelScheduledBentoEqualize(container);

  equalizeFrameIds.set(
    container,
    requestAnimationFrame(() => {
      equalizeFrameIds.delete(container);
      equalizeBentoSlideHeights(container);
    })
  );
};

const watchBentoSlideHeights = (container: HTMLElement): (() => void) => {
  const equalize = (): void => scheduleEqualizeBentoSlideHeights(container);
  const wrapper = getBentoWrapper(container);
  if (!wrapper) return () => {};

  wrapper.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;

    img.addEventListener('load', equalize, { once: true });
    img.addEventListener('error', equalize, { once: true });
  });

  const observer = new ResizeObserver(equalize);
  observer.observe(wrapper);

  return () => observer.disconnect();
};

/**
 * Mobile-only bento carousel.
 *
 * Webflow setup inside `.bento_content`:
 * - Desktop source: `.bento_grid-wrp` with `.card-slot` children
 * - Mobile shell: `.bento_slider-wrp` > `.bento_slider.swiper` > `.bento_slider-list.swiper-wrapper`
 */
export function initBentoSlider(selector = '.bento_slider.swiper'): void {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  if (!containers.length) return;

  const mql = window.matchMedia(MOBILE_QUERY);
  const instances = new Map<HTMLElement, Swiper>();
  const cleanups = new Map<HTMLElement, () => void>();

  const mount = (container: HTMLElement): void => {
    const wrapper = getBentoWrapper(container);
    const sources = getBentoSourceSlots(container);
    if (!wrapper || !sources.length) return;

    populateBentoSlides(wrapper, sources);

    const swiper = new Swiper(container, {
      ...bentoSwiperOptions,
      on: {
        init: () => scheduleEqualizeBentoSlideHeights(container),
        resize: () => scheduleEqualizeBentoSlideHeights(container),
      },
    });

    instances.set(container, swiper);
    cleanups.set(container, watchBentoSlideHeights(container));
    scheduleEqualizeBentoSlideHeights(container);
  };

  const unmount = (container: HTMLElement): void => {
    cancelScheduledBentoEqualize(container);
    cleanups.get(container)?.();
    cleanups.delete(container);
    instances.get(container)?.destroy(true, true);
    instances.delete(container);
    getBentoWrapper(container)?.replaceChildren();
  };

  const sync = (): void => {
    containers.forEach((container) => {
      if (mql.matches && !instances.has(container)) mount(container);
      else if (!mql.matches && instances.has(container)) unmount(container);
    });
  };

  sync();
  mql.addEventListener('change', sync);
}

// ---------------------------------------------------------------------------
// Testimonial slider
// ---------------------------------------------------------------------------

/**
 * Initializes the testimonial slider(s).
 *
 * @param selector - CSS selector targeting the slider wrapper(s).
 * @returns The created Swiper instances.
 */
export function initTestimonialSlider(selector = '.testimonial_wrapper'): Swiper[] {
  const containers = document.querySelectorAll<HTMLElement>(selector);

  return Array.from(containers).map((container) => {
    const slideCount = container.querySelectorAll('.swiper-slide').length;

    const options: SwiperOptions = {
      centeredSlides: true,
      initialSlide: Math.floor(slideCount / 2),
      loop: false,
      rewind: true,
      speed: SPEED,
      slidesPerView: 'auto',
      spaceBetween: 40,
      grabCursor: true,
      on: clickToSlideHandler,
    };

    return new Swiper(container, options);
  });
}

// ---------------------------------------------------------------------------
// Tools slider
// ---------------------------------------------------------------------------

const prepareToolsStackSlider = (container: HTMLElement): number => {
  container.classList.add('swiper');

  const wrapper =
    container.querySelector<HTMLElement>(':scope > .swiper-wrapper') ??
    container.querySelector<HTMLElement>(':scope > .stack_list');

  if (!wrapper) return 0;

  wrapper.classList.add('swiper-wrapper');

  const slides = wrapper.querySelectorAll<HTMLElement>(':scope > .stack_list-item');
  slides.forEach((slide) => {
    slide.classList.add('swiper-slide');
  });

  return slides.length;
};

/**
 * Initializes the tools stack slider(s).
 */
export function initToolsSlider(selector = '.stack_list-wrp'): Swiper[] {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  if (!containers.length) return [];

  return Array.from(containers)
    .map((container) => {
      const slideCount = prepareToolsStackSlider(container);
      if (!slideCount) return null;

      const options: SwiperOptions = {
        centeredSlides: true,
        initialSlide: Math.floor(slideCount / 2),
        loop: false,
        rewind: true,
        speed: SPEED,
        slidesPerView: 'auto',
        spaceBetween: 24,
        grabCursor: true,
        on: clickToSlideHandler,
      };

      return new Swiper(container, options);
    })
    .filter((instance): instance is Swiper => instance !== null);
}

// ---------------------------------------------------------------------------
// Examples slider (mobile-only)
// ---------------------------------------------------------------------------

export function initExamplesSlider(selector = '.examples_content.swiper'): void {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  if (!containers.length) return;

  const options: SwiperOptions = {
    // > 1 pour laisser dépasser les slides voisines sur les bords (effet "peek").
    slidesPerView: 1.45,
    centeredSlides: true,
    rewind: true,
    // Démarre sur la 2ᵉ slide (index 0-based), 1ʳᵉ et 3ᵉ visibles sur les bords.
    initialSlide: 1,
    spaceBetween: 16,
    grabCursor: true,
  };

  const mql = window.matchMedia(MOBILE_QUERY);
  const instances = new Map<HTMLElement, Swiper>();

  const sync = (): void => {
    containers.forEach((container) => {
      const existing = instances.get(container);

      if (mql.matches && !existing) {
        instances.set(container, new Swiper(container, options));
      } else if (!mql.matches && existing) {
        existing.destroy(true, true);
        instances.delete(container);
      }
    });
  };

  sync();
  mql.addEventListener('change', sync);
}

// ---------------------------------------------------------------------------
// Leaders slider (mobile-only)
// Webflow: `.leader-tsml_list-wrp.swiper` > `.leader-tsml_list.swiper-wrapper` > `.leaders_tsml-card.swiper-slide`
// ---------------------------------------------------------------------------

const FADE_BY_STEP_ATTR = 'data-css';
const FADE_BY_STEP_VALUE = 'fade-by-step';

const prepareLeadersSlider = (container: HTMLElement): void => {
  const wrapper = container.querySelector<HTMLElement>('.swiper-wrapper');
  if (wrapper?.getAttribute(FADE_BY_STEP_ATTR) !== FADE_BY_STEP_VALUE) return;

  wrapper.removeAttribute(FADE_BY_STEP_ATTR);
  if (!container.hasAttribute(FADE_BY_STEP_ATTR)) {
    container.setAttribute(FADE_BY_STEP_ATTR, FADE_BY_STEP_VALUE);
  }
};

const cleanupLeadersSlider = (container: HTMLElement): void => {
  const wrapper = container.querySelector<HTMLElement>('.swiper-wrapper');
  if (container.getAttribute(FADE_BY_STEP_ATTR) !== FADE_BY_STEP_VALUE || !wrapper) return;

  container.removeAttribute(FADE_BY_STEP_ATTR);
  wrapper.setAttribute(FADE_BY_STEP_ATTR, FADE_BY_STEP_VALUE);
};

export function initLeadersSlider(selector = '.leader-tsml_list-wrp.swiper'): void {
  const containers = document.querySelectorAll<HTMLElement>(selector);
  if (!containers.length) return;

  const options: SwiperOptions = {
    slidesPerView: 1,
    rewind: true,
    speed: SPEED,
    spaceBetween: 16,
    grabCursor: true,
    roundLengths: true,
    observer: true,
    observeParents: true,
    resizeObserver: true,
  };

  const mql = window.matchMedia(MOBILE_QUERY);
  const instances = new Map<HTMLElement, Swiper>();

  const sync = (): void => {
    containers.forEach((container) => {
      const existing = instances.get(container);

      if (mql.matches && !existing) {
        prepareLeadersSlider(container);
        instances.set(container, new Swiper(container, options));
      } else if (!mql.matches && existing) {
        existing.destroy(true, true);
        instances.delete(container);
        cleanupLeadersSlider(container);
      }
    });
  };

  sync();
  mql.addEventListener('change', sync);
}
