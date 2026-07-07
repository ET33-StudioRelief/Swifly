const LEFT_COL_SELECTOR = '[data-element="hero-left-col"]';

/**
 * Sets CSS custom properties used by the home hero entrance sequence
 * (`hero-img-wrapper` → `hero-left-col` stagger).
 */
export function initHeroEntrance(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 768px)').matches) return;

  const leftCol = document.querySelector(LEFT_COL_SELECTOR);
  if (leftCol?.children.length) {
    document.documentElement.style.setProperty(
      '--hero-left-col-count',
      String(leftCol.children.length)
    );
  }
}
