const TUNING: ReadonlyArray<{ attr: keyof DOMStringMap; cssVar: string }> = [
  { attr: 'fadeStepOffset', cssVar: '--fade-step-offset' },
  { attr: 'fadeStepGap', cssVar: '--fade-step-gap' },
  { attr: 'fadeStepDuration', cssVar: '--fade-step-duration' },
];

function toPercent(value: string): string {
  return value.trim().endsWith('%') ? value.trim() : `${value.trim()}%`;
}

/**
 * Reads fade-by-step tuning from Webflow custom attributes on the container:
 * - `data-fade-step-offset` — delay before the 1st child (default 25%)
 * - `data-fade-step-gap` — stagger between children (default 10%)
 * - `data-fade-step-duration` — length of each fade (default 30%)
 *
 * Values accept a number (`5`) or a percentage (`5%`).
 */
export function initFadeByStep(selector = '[data-css="fade-by-step"]'): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    for (const { attr, cssVar } of TUNING) {
      const value = el.dataset[attr];
      if (value) el.style.setProperty(cssVar, toPercent(value));
    }
  });
}

const FADE_BENTO_CARDS_VALUE = 'fade-bento-cards';

/**
 * Staggers every `.bento_card` inside each `.bento_grid-wrp` on scroll.
 * Works with any card count and nested grid layout (left/right columns, 2-card row, etc.).
 *
 * Optional tuning on `.bento_grid-wrp` (same attributes as fade-by-step):
 * - `data-fade-step-offset`, `data-fade-step-gap`, `data-fade-step-duration`
 */
export function initBentoCardsFade(selector = '.bento_grid-wrp'): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((wrapper) => {
    const cards = wrapper.querySelectorAll<HTMLElement>('.bento_card');
    if (!cards.length) return;

    for (const { attr, cssVar } of TUNING) {
      const value = wrapper.dataset[attr];
      if (value) wrapper.style.setProperty(cssVar, toPercent(value));
    }

    wrapper.dataset.css = FADE_BENTO_CARDS_VALUE;

    cards.forEach((card, index) => {
      card.style.setProperty('--fade-step-i', String(index));
    });
  });
}
