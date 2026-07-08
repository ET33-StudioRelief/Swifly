import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import { gsap } from '../utils/gsap';
import { loadScript } from '../utils/loadScript';

gsap.registerPlugin(ScrollToPlugin);

const RECORDER_SCRIPT_URL = 'https://recorder-assets.contact-796.workers.dev/index.js';
const TRANSCRIPTION_INPUT_ID = 'transcriptionResult';
const VOICE_TEXT_SELECTOR = '[data-voice="text"]';
const VOICE_RAW_SELECTOR = '[data-voice="raw-text"]';
const SECTION_SELECTOR = '.section_examples';
const SCROLL_OFFSET_REM = 5;
const SCROLL_POSITION_TOLERANCE_PX = 80;
const SCROLL_DURATION = 1.15;
const SCROLL_EASE = 'power3.inOut';

type TranscriptionData = {
  rawTranscript?: string;
  formattedTranscripts?: string[];
};

const sanitize = (str: string): string =>
  str.trim().replace(/  +/g, ' ').replace(/—/g, ' — ').replace(/\n/g, '<br>');

let scrollOnNextRawTextChange = true;

const render = ({ rawTranscript, formattedTranscripts }: TranscriptionData = {}): void => {
  const rawEl = document.querySelector<HTMLElement>(VOICE_RAW_SELECTOR);
  if (rawEl && rawTranscript) {
    const next = sanitize(rawTranscript);
    const changed = next !== rawEl.innerHTML;
    rawEl.innerHTML = next;
    if (changed && scrollOnNextRawTextChange) {
      scrollOnNextRawTextChange = false;
      scrollToExamplesSection();
    }
  }

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
    if (!val) {
      scrollOnNextRawTextChange = true;
      last = '';
      return;
    }
    if (val === last) return;
    last = val;
    try {
      const data = JSON.parse(val) as { transcription?: TranscriptionData } & TranscriptionData;
      render(data.transcription ?? data);
    } catch {
      // Ignore invalid JSON while the recorder is still writing.
    }
  }, 150);
};

const getScrollOffsetPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) * SCROLL_OFFSET_REM;

const scrollToExamplesSection = (): void => {
  const section = document.querySelector<HTMLElement>(SECTION_SELECTOR);
  if (!section) return;

  const targetTop = section.getBoundingClientRect().top;
  const offset = getScrollOffsetPx();
  if (Math.abs(targetTop - offset) <= SCROLL_POSITION_TOLERANCE_PX) return;

  const top = Math.max(0, targetTop + window.scrollY - offset);

  gsap.to(window, {
    scrollTo: { y: top, autoKill: true },
    duration: SCROLL_DURATION,
    ease: SCROLL_EASE,
    overwrite: true,
  });
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
