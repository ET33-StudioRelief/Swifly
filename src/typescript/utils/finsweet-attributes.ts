import { loadScript } from './loadScript';

const FINSWEET_ATTRIBUTES_URL = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js';
const FINSWEET_TOC_URL = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-toc@1/toc.js';
const LEGAL_PAGE_SELECTOR = '[data-page="legal"]';

export function loadFinsweetAttributes(): Promise<void> {
  return loadScript(FINSWEET_ATTRIBUTES_URL, {
    async: true,
    type: 'module',
    attributes: { 'fs-scrolldisable': true },
  });
}

/** Charge le Table of Contents Finsweet sur les pages `data-page="legal"`. */
export function loadFinsweetToc(): Promise<void> | undefined {
  if (!document.querySelector(LEGAL_PAGE_SELECTOR)) return;

  return loadScript(FINSWEET_TOC_URL, { defer: true });
}
