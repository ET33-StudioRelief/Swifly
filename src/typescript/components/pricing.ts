const BILLING_TOGGLE_SELECTOR = '.pricing_toggle-wrp:not(.is-mobile-table) .pricing_toggle';
const PRICING_TABLE_ID = 'pricing-table';

const applyToggle = (toggle: HTMLElement, toggles: NodeListOf<HTMLElement>): void => {
  toggles.forEach((btn) => btn.classList.remove('is-active'));
  toggle.classList.add('is-active');

  const { abo, pricing } = toggle.dataset;

  if (pricing) {
    document.querySelectorAll<HTMLElement>('[id="variable-pricing"]').forEach((el) => {
      el.textContent = pricing;
    });
  }

  const aboEl = document.getElementById('data-abo');
  if (abo && aboEl) aboEl.textContent = abo;

  const pricingEl = document.getElementById('data-pricing');
  if (pricing && pricingEl) pricingEl.textContent = pricing;
};

/**
 * Monthly / annual toggle for the pricing section.
 * Scoped to `.pricing_toggle-wrp:not(.is-mobile-table)` so it does not
 * conflict with the mobile plan tabs (Webflow tabs).
 */
export function initPricingToggle(): void {
  const toggles = document.querySelectorAll<HTMLElement>(BILLING_TOGGLE_SELECTOR);
  if (!toggles.length) return;

  const active =
    document.querySelector<HTMLElement>(`${BILLING_TOGGLE_SELECTOR}.is-active`) ?? toggles[0];
  applyToggle(active, toggles);

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => applyToggle(toggle, toggles));
  });
}

/**
 * Sticky pricing table: updates the corner cell label on scroll and fades out
 * the table when the sticky header reaches the bottom of the table wrapper.
 */
export function initPricingTable(): void {
  const wrap = document.getElementById(PRICING_TABLE_ID);
  if (!wrap) return;

  const header = wrap.querySelector<HTMLElement>('[data-sticky-header]');
  const cornerCell = wrap.querySelector<HTMLElement>('[data-corner-cell]');
  const sections = Array.from(wrap.querySelectorAll<HTMLElement>('[data-html]'));
  if (!header || !cornerCell || !sections.length) return;

  wrap.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  wrap.style.willChange = 'opacity, transform';

  let ticking = false;
  let isHidden = false;

  const update = (): void => {
    ticking = false;

    const headerBottom = header.getBoundingClientRect().bottom;

    let current: HTMLElement | null = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= headerBottom) {
        current = section;
      }
    }
    if (current) {
      cornerCell.textContent = current.getAttribute('data-html');
    }

    const wrapBottom = wrap.getBoundingClientRect().bottom;
    const remaining = wrapBottom - headerBottom;
    const shouldHide = remaining <= 1;

    if (shouldHide && !isHidden) {
      isHidden = true;
      wrap.style.opacity = '0';
      wrap.style.transform = 'translateY(-12px)';
      wrap.style.pointerEvents = 'none';
    } else if (!shouldHide && isHidden) {
      isHidden = false;
      wrap.style.opacity = '1';
      wrap.style.transform = 'translateY(0)';
      wrap.style.pointerEvents = 'auto';
    }
  };

  const onScroll = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
