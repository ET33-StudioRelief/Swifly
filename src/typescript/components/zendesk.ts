import { loadScript } from '../utils/loadScript';

const PAGE_SELECTOR = '[data-page="support"]';
const TRIGGER_SELECTOR = '.zendesk-trigger';
const ZENDESK_SNIPPET_URL =
  'https://static.zdassets.com/ekr/snippet.js?key=a837b710-7345-4e0e-a29f-58efc32cb2e4';

type ZendeskApi = (channel: 'messenger', action: 'open') => void;

/**
 * Charge le widget Zendesk et ouvre le messenger au clic sur `.zendesk-trigger`.
 * Actif uniquement sur les pages portant `data-page="support"`.
 */
export function initZendesk(): void {
  if (!document.querySelector(PAGE_SELECTOR)) return;

  document.querySelectorAll<HTMLElement>(TRIGGER_SELECTOR).forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();

      const { zE } = window as Window & { zE?: ZendeskApi };
      if (zE) zE('messenger', 'open');
    });
  });

  void loadScript(ZENDESK_SNIPPET_URL, {
    attributes: { id: 'ze-snippet' },
  });
}
