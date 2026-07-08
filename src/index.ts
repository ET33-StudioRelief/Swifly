import './index.css';

import { initBentoCardsFade, initFadeByStep } from './typescript/animations/fade-by-step';
import { initHeroEntrance } from './typescript/animations/hero-entrance';
import { initBgParallax } from './typescript/animations/parallax-bg';
import { initAppsIconsParallax } from './typescript/components/apps-icons';
import { initButtonGradient } from './typescript/components/button';
import { initFasterCtaImgScale } from './typescript/components/cta';
import { initInfoDropdown, initPricingMobileDropdown } from './typescript/components/dropdown';
import { initHeroArrow } from './typescript/components/hero-arrow';
import { initBrandsMarquee, initMarqueeFlags } from './typescript/components/marquee';
import { initNavbar } from './typescript/components/navbar';
import { initPricingTable, initPricingToggle } from './typescript/components/pricing';
import {
  initBeneficesSlider,
  initBentoSlider,
  initExamplesSlider,
  initLeadersSlider,
  initTestimonialSlider,
  initToolsSlider,
} from './typescript/components/slider';
import { initStatsProgress } from './typescript/components/stats-progress';
import { initVoiceTranscription } from './typescript/components/voice-transcription';
import { initZendesk } from './typescript/components/zendesk';
import { loadFinsweetAttributes, loadFinsweetToc } from './typescript/utils/finsweet-attributes';
import { launchMarkerSDK } from './typescript/utils/marker';

void loadFinsweetAttributes();

window.Webflow ||= [];
window.Webflow.push(() => {
  if (window.location.href.includes('webflow.io')) {
    launchMarkerSDK();
  }

  // init protect on element presence
  initHeroEntrance();
  initVoiceTranscription();
  initFadeByStep();
  initBentoCardsFade();
  initBgParallax();
  initFasterCtaImgScale();
  initHeroArrow();
  initButtonGradient();
  initPricingToggle();
  initPricingTable();
  initInfoDropdown();
  initPricingMobileDropdown();
  initNavbar();
  initBentoSlider();
  initBeneficesSlider();
  initStatsProgress();
  initToolsSlider();
  initAppsIconsParallax();
  initMarqueeFlags();
  initTestimonialSlider();
  initExamplesSlider();
  initLeadersSlider();
  initBrandsMarquee();
  initZendesk();
  void loadFinsweetToc();
});
