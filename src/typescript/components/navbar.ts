import { TABLET_QUERY } from '../utils/breakpoints';
import { gsap, ScrollTrigger } from '../utils/gsap';

const SELECTOR = '.navbar';
const OPEN_TOGGLE_SELECTOR = '.w-dropdown-toggle.w--open';
const OPEN_LIST_SELECTOR = '.w-dropdown-list.w--open';
const SCROLL_THRESHOLD = 5;
const SCROLL_DELTA = 5;
const SCROLLED_THRESHOLD = 80;
const DEFAULT_DROPDOWN_DURATION = 400;

type WebflowJQueryWrapper = {
  trigger(event: string): void;
};

type WebflowJQuery = (element: HTMLElement) => WebflowJQueryWrapper;

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

/** Webflow-native close — keeps internal dropdown state in sync (avoids double-click). */
const closeDropdownViaWebflow = (toggle: HTMLElement): Promise<void> => {
  const dropdown = toggle.closest<HTMLElement>('.w-dropdown');
  if (!dropdown) return Promise.resolve();

  const { jQuery } = window as Window & { jQuery?: WebflowJQuery };

  if (jQuery) {
    jQuery(dropdown).trigger('w-close.w-dropdown');
    return Promise.resolve();
  }

  toggle.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })
  );
  toggle.dispatchEvent(
    new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })
  );
  return Promise.resolve();
};

/**
 * Hides the navbar on scroll down (slide up) and reveals it on scroll up (slide down).
 * Toggles `.scrolled` for a readable background past the hero.
 * Below TABLET_QUERY (≤991px), `.scrolled` uses `--_brand---surface--secondary` (see navbar.css).
 * Closes open Webflow dropdowns smoothly before hiding.
 */
export function initNavbar(): void {
  const navbar = document.querySelector<HTMLElement>(SELECTOR);
  if (!navbar) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let isHidden = false;
  let isClosingDropdowns = false;
  let pendingHide: { cancelled: boolean } | null = null;
  let lastScrollY = window.scrollY;

  const dropdownCloseDurationMs = Number(navbar.dataset.duration) || DEFAULT_DROPDOWN_DURATION;

  gsap.set(navbar, { yPercent: 0 });

  const yTo = gsap.quickTo(navbar, 'yPercent', {
    duration: 0.3,
    ease: 'easeInOut',
    overwrite: 'auto',
  });

  const updateScrolled = (scrollY: number): void => {
    navbar.classList.toggle('scrolled', scrollY > SCROLLED_THRESHOLD);
  };

  const getOpenDropdownToggles = (): HTMLElement[] => {
    const toggles = [...navbar.querySelectorAll<HTMLElement>(OPEN_TOGGLE_SELECTOR)];
    if (toggles.length) return toggles;

    return [...navbar.querySelectorAll<HTMLElement>(OPEN_LIST_SELECTOR)]
      .map(
        (list) =>
          list.closest('.w-dropdown')?.querySelector<HTMLElement>('.w-dropdown-toggle') ?? null
      )
      .filter((toggle): toggle is HTMLElement => toggle !== null);
  };

  const closeOpenDropdowns = async (toggles: HTMLElement[]): Promise<void> => {
    await Promise.all(toggles.map(closeDropdownViaWebflow));
    await wait(dropdownCloseDurationMs);
  };

  const cancelPendingHide = (): void => {
    if (pendingHide) {
      pendingHide.cancelled = true;
      pendingHide = null;
    }
    isClosingDropdowns = false;
  };

  const slideNavbarOut = (): void => {
    isHidden = true;
    yTo(-100);
  };

  const show = (): void => {
    cancelPendingHide();
    if (!isHidden) return;
    isHidden = false;
    yTo(0);
  };

  const hide = (): void => {
    if (isHidden || isClosingDropdowns) return;

    const openToggles = getOpenDropdownToggles();
    if (openToggles.length) {
      isClosingDropdowns = true;
      const abort = { cancelled: false };
      pendingHide = abort;

      void closeOpenDropdowns(openToggles).then(() => {
        if (abort.cancelled) return;
        pendingHide = null;
        isClosingDropdowns = false;
        slideNavbarOut();
      });
      return;
    }

    slideNavbarOut();
  };

  updateScrolled(window.scrollY);

  window.matchMedia(TABLET_QUERY).addEventListener('change', () => {
    ScrollTrigger.refresh();
  });

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const scrollY = self.scroll();
      const delta = scrollY - lastScrollY;

      updateScrolled(scrollY);

      if (isClosingDropdowns && delta < 0) {
        cancelPendingHide();
      }

      if (navbar.classList.contains('w--open') || scrollY <= SCROLL_THRESHOLD) {
        show();
        lastScrollY = scrollY;
        return;
      }

      if (delta > SCROLL_DELTA) hide();
      else if (delta < -SCROLL_DELTA) show();

      lastScrollY = scrollY;
    },
  });
}
