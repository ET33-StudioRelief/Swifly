const LEFT_COL_SELECTOR = '[data-element="hero-left-col"]';
const NAVBAR_LINKS_SELECTOR = '[data-element="navbar-links"]';

/**
 * Sets CSS custom properties used by the home hero entrance sequence
 * (`hero-img-wrapper` → `hero-left-col` stagger → navbar links).
 */
export function initHeroEntrance(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 768px)').matches) return;

  const root = document.documentElement;

  const leftCol = document.querySelector(LEFT_COL_SELECTOR);
  if (leftCol?.children.length) {
    root.style.setProperty('--hero-left-col-count', String(leftCol.children.length));
  }

  const linkCount = document.querySelectorAll(NAVBAR_LINKS_SELECTOR).length;
  if (linkCount) root.style.setProperty('--entrance-count', String(linkCount));
}
