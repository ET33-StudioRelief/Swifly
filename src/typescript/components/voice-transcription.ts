import { gsap } from '../utils/gsap';
import { loadScript } from '../utils/loadScript';

const RECORDER_SCRIPT_URL = 'https://recorder-assets.contact-796.workers.dev/index.js';
const TRANSCRIPTION_INPUT_ID = 'transcriptionResult';
const VOICE_TEXT_SELECTOR = '[data-voice="text"]';
const VOICE_RAW_SELECTOR = '[data-voice="raw-text"]';

type TranscriptionData = {
  rawTranscript?: string;
  formattedTranscripts?: string[];
};

const sanitize = (str: string): string =>
  str.trim().replace(/  +/g, ' ').replace(/—/g, ' — ').replace(/\n/g, '<br>');

const render = ({ rawTranscript, formattedTranscripts }: TranscriptionData = {}): void => {
  const rawEl = document.querySelector<HTMLElement>(VOICE_RAW_SELECTOR);
  if (rawEl && rawTranscript) rawEl.innerHTML = sanitize(rawTranscript);

  let totalDelay = 0;
  [...document.querySelectorAll<HTMLElement>(VOICE_TEXT_SELECTOR)]
    .sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index))
    .forEach((el, i) => {
      const text = formattedTranscripts?.[i];
      if (!text) return;
      gsap.set(el, { opacity: 0 });
      setTimeout(() => {
        el.innerHTML = sanitize(text);
        gsap.to(el, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }, totalDelay * 1000);
      totalDelay += 0.6;
    });
};

const hookInput = (input: HTMLInputElement): void => {
  let last = '';
  setInterval(() => {
    const val = input.value;
    if (!val || val === last) return;
    last = val;
    try {
      const data = JSON.parse(val) as { transcription?: TranscriptionData } & TranscriptionData;
      render(data.transcription ?? data);
    } catch {
      // Ignore invalid JSON while the recorder is still writing.
    }
  }, 150);
};

const waitForTranscriptionInput = (): void => {
  const input = document.getElementById(TRANSCRIPTION_INPUT_ID) as HTMLInputElement | null;
  if (input) {
    hookInput(input);
    return;
  }

  const obs = new MutationObserver(() => {
    const found = document.getElementById(TRANSCRIPTION_INPUT_ID) as HTMLInputElement | null;
    if (found) {
      obs.disconnect();
      hookInput(found);
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
};

/**
 * Charge le recorder vocal et affiche la transcription dans les éléments
 * `[data-voice="raw-text"]` et `[data-voice="text"]`.
 */
export function initVoiceTranscription(): void {
  const hasVoiceElements =
    document.querySelector(VOICE_TEXT_SELECTOR) || document.querySelector(VOICE_RAW_SELECTOR);
  if (!hasVoiceElements) return;

  void loadScript(RECORDER_SCRIPT_URL);
  waitForTranscriptionInput();
}
