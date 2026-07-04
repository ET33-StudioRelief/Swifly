export interface LoadScriptOptions {
  async?: boolean;
  defer?: boolean;
  type?: HTMLScriptElement['type'];
  /** Attributs HTML supplémentaires (ex. `{ 'fs-scrolldisable': true }`). */
  attributes?: Record<string, string | boolean>;
  /** Ignore le chargement si un script avec la même `src` est déjà présent. */
  idempotent?: boolean;
}

const loadedScripts = new Map<string, Promise<void>>();

/** Charge dynamiquement un script externe. */
export function loadScript(src: string, options: LoadScriptOptions = {}): Promise<void> {
  const cached = loadedScripts.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    if (options.idempotent !== false && document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;

    if (options.async) script.async = true;
    if (options.defer) script.defer = true;
    if (options.type) script.type = options.type;

    for (const [key, value] of Object.entries(options.attributes ?? {})) {
      if (value === true || value === '') {
        script.setAttribute(key, '');
      } else {
        script.setAttribute(key, String(value));
      }
    }

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}
