const MOBILE_QUERY = '(max-width: 479px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** Sélecteur de l'overlay (fondu des bords) à NE PAS faire défiler. */
const OVERLAY_SELECTOR = '.brands_mobile-overlay';

/**
 * Marquee CSS des logos de marques, actif uniquement sous 480px.
 *
 * Le JS se contente de dupliquer une fois le set de logos (impossible en CSS) ;
 * toute l'animation est gérée par une keyframe CSS (cf. home.css) pour de
 * meilleures performances. Au-dessus du breakpoint, le DOM d'origine est
 * restauré et la grille Webflow reprend la main. Aucune modif Webflow requise.
 *
 * @param selector - CSS selector targeting the logos wrapper(s).
 */
export function initBrandsMarquee(selector = '.brands_logo-wrp'): void {
  const wrappers = document.querySelectorAll<HTMLElement>(selector);
  if (!wrappers.length) return;
  // Accessibilité : pas de défilement auto si l'utilisateur le refuse.
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  const mql = window.matchMedia(MOBILE_QUERY);
  const originals = new Map<HTMLElement, string>();

  const enable = (wrapper: HTMLElement): void => {
    if (originals.has(wrapper)) return;
    originals.set(wrapper, wrapper.innerHTML);

    // L'overlay (fondu des bords) reste fixe au-dessus du track : on l'exclut du défilement.
    const items = (Array.from(wrapper.children) as HTMLElement[]).filter(
      (el) => !el.matches(OVERLAY_SELECTOR)
    );
    const overlay = wrapper.querySelector<HTMLElement>(OVERLAY_SELECTOR);

    const track = document.createElement('div');
    track.className = 'brands_marquee-track';

    // Set original + sa copie : 2 copies identiques => translateX(-50%) boucle sans couture.
    items.forEach((item) => track.appendChild(item));
    items.forEach((item) => track.appendChild(item.cloneNode(true)));

    wrapper.classList.add('is-marquee');
    wrapper.appendChild(track);
    // Repositionne l'overlay APRÈS le track pour qu'il reste au-dessus.
    if (overlay) wrapper.appendChild(overlay);
  };

  const disable = (wrapper: HTMLElement): void => {
    const original = originals.get(wrapper);
    if (original === undefined) return;

    wrapper.classList.remove('is-marquee');
    wrapper.innerHTML = original;
    originals.delete(wrapper);
  };

  const sync = (): void => {
    wrappers.forEach((wrapper) => (mql.matches ? enable(wrapper) : disable(wrapper)));
  };

  sync();
  mql.addEventListener('change', sync);
}
