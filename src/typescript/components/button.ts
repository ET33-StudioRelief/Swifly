const INIT_ATTR = 'data-gradient-init';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const bindButton = (button: HTMLElement): void => {
  if (button.hasAttribute(INIT_ATTR)) return;
  button.setAttribute(INIT_ATTR, '');

  let stopWhenCycleEnds = false;

  button.addEventListener('mouseenter', () => {
    stopWhenCycleEnds = false;
    button.classList.add('is-spinning');
  });

  button.addEventListener('mouseleave', () => {
    stopWhenCycleEnds = true;
  });

  button.addEventListener('animationiteration', (event) => {
    if (event.animationName !== 'button-gradient-spin') return;
    if (!stopWhenCycleEnds) return;
    stopWhenCycleEnds = false;
    button.classList.remove('is-spinning');
  });
};

/**
 * Conic-gradient spin on `.button.is-component`.
 * Each button is bound once; the spin stops cleanly at the end of the current cycle on mouse leave.
 *
 * @param selector - CSS selector targeting the gradient button(s).
 */
export function initButtonGradient(selector = '.button.is-component'): void {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  const buttons = document.querySelectorAll<HTMLElement>(selector);
  if (!buttons.length) return;

  buttons.forEach(bindButton);
}
