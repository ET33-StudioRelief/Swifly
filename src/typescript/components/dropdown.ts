const openAccordion = (container: HTMLElement, contentSelector: string): void => {
  const content = container.querySelector<HTMLElement>(contentSelector);
  if (!content) return;

  container.classList.add('is-open');

  requestAnimationFrame(() => {
    content.style.height = `${content.scrollHeight}px`;
  });

  const onTransitionEnd = (event: TransitionEvent): void => {
    if (event.propertyName !== 'height') return;
    if (container.classList.contains('is-open')) {
      content.style.height = 'auto';
    }
    content.removeEventListener('transitionend', onTransitionEnd);
  };

  content.addEventListener('transitionend', onTransitionEnd);
};

const closeAccordion = (container: HTMLElement, contentSelector: string): void => {
  const content = container.querySelector<HTMLElement>(contentSelector);
  if (!content) return;

  content.style.height = `${content.scrollHeight}px`;

  requestAnimationFrame(() => {
    content.style.height = '0px';
    container.classList.remove('is-open');
  });
};

const toggleAccordion = (
  container: HTMLElement,
  contentSelector: string,
  siblingSelector: string,
  wrapperSelector?: string
): void => {
  if (container.classList.contains('is-open')) {
    closeAccordion(container, contentSelector);
    return;
  }

  const wrapper = wrapperSelector ? container.closest(wrapperSelector) : container.parentElement;
  const siblings = wrapper
    ? wrapper.querySelectorAll<HTMLElement>(siblingSelector)
    : document.querySelectorAll<HTMLElement>(siblingSelector);

  siblings.forEach((sibling) => {
    if (sibling === container) return;
    if (sibling.classList.contains('is-open')) {
      closeAccordion(sibling, contentSelector);
    }
  });

  openAccordion(container, contentSelector);
};

const INFO_DROPDOWN_SELECTOR = '.info_drp-dwn';
const INFO_DROPDOWN_CONTENT = '.info_drp-dwn-invisible';
const INFO_DROPDOWN_WRAPPER = '.info_drp-dwn-wrp';

const PRICING_DROPDOWN_SELECTOR = '.pricing-table_mobile-dropdown';
const PRICING_DROPDOWN_TRIGGER = '.pricing-table_mobile-tabs-show';
const PRICING_DROPDOWN_CONTENT = '.pricing-table_mobile-tabs-hidden';

/**
 * Accordion-style dropdown for `.info_drp-dwn` items inside `.info_drp-dwn-wrp`.
 * Toggles content height and arrow rotation on click.
 */
export function initInfoDropdown(): void {
  const dropdowns = document.querySelectorAll<HTMLElement>(INFO_DROPDOWN_SELECTOR);
  if (!dropdowns.length) return;

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('click', () =>
      toggleAccordion(
        dropdown,
        INFO_DROPDOWN_CONTENT,
        INFO_DROPDOWN_SELECTOR,
        INFO_DROPDOWN_WRAPPER
      )
    );
  });
}

/**
 * Mobile pricing table accordion for `.pricing-table_mobile-dropdown`.
 * Opens/closes `.pricing-table_mobile-tabs-hidden` on trigger click.
 */
export function initPricingMobileDropdown(): void {
  const dropdowns = document.querySelectorAll<HTMLElement>(PRICING_DROPDOWN_SELECTOR);
  if (!dropdowns.length) return;

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector<HTMLElement>(PRICING_DROPDOWN_TRIGGER);
    if (!trigger) return;

    trigger.addEventListener('click', () =>
      toggleAccordion(dropdown, PRICING_DROPDOWN_CONTENT, PRICING_DROPDOWN_SELECTOR)
    );
  });
}
