/**
 * STRIPE CINEMATIC INTRO — INTRO ENGINE
 * Finite State Machine orchestrating the master timeline via requestAnimationFrame.
 * Strict Failsafe Principle: Fallback text is visible by default in HTML/CSS.
 */

class IntroEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      introSelector: '#intro',
      logoSelector: '#intro-logo',
      siteSelector: '#site',
      particlesSelector: '#intro-particles',
      soundToggleSelector: '#sound-toggle',
      skipBtnSelector: '#skip-intro',
      onComplete: null
    }, options);

    // DOM Elements
    this.introEl = null;
    this.logoEl = null;
    this.letterEls = [];
    this.siteEl = null;
    this.canvasEl = null;
    this.soundToggleEl = null;
    this.skipBtnEl = null;

    // External engines
    this.audioEngine = null;
    this.fragmentEngine = null;

    // Timeline State
    this.rafId = null;
    this.startTime = null;
    this.isRunning = false;
    this.currentState = null;

    // State Constants
    this.STATES = {
      INIT: 'INTRO_INIT',
      REVEAL: 'INTRO_REVEAL',
      HOLD: 'INTRO_HOLD',
      EXIT: 'INTRO_EXIT',
      FRAGMENT: 'INTRO_FRAGMENT',
      COMPLETE: 'INTRO_COMPLETE'
    };

    // Independent letter exit parameters for cinematic distortion
    this.letterExitParams = [
      { dirX: -2.5, rot: -3.5 }, // S
      { dirX: -1.5, rot: -1.8 }, // T
      { dirX: -0.5, rot: -0.6 }, // R
      { dirX:  0.5, rot:  0.6 }, // I
      { dirX:  1.5, rot:  1.8 }, // P
      { dirX:  2.5, rot:  3.5 }  // E
    ];
  }

  /**
   * Initializes IntroEngine and safely verifies DOM bindings
   */
  init({ audioEngine, fragmentEngine } = {}) {
    try {
      this.audioEngine = audioEngine;
      this.fragmentEngine = fragmentEngine;

      this.introEl = document.querySelector(this.options.introSelector);
      this.logoEl = document.querySelector(this.options.logoSelector);
      this.letterEls = this.logoEl ? Array.from(this.logoEl.querySelectorAll('span')) : [];
      this.siteEl = document.querySelector(this.options.siteSelector);
      this.canvasEl = document.querySelector(this.options.particlesSelector);
      this.soundToggleEl = document.querySelector(this.options.soundToggleSelector);
      this.skipBtnEl = document.querySelector(this.options.skipBtnSelector);

      if (!this.introEl || !this.logoEl || this.letterEls.length === 0) {
        throw new Error('Required intro DOM elements or letter spans not found.');
      }

      console.log('[INTRO] initialized');

      // Check reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        this.runReducedMotion();
        return;
      }

      // Start the master timeline immediately
      this.start();
    } catch (err) {
      console.error('[INTRO ERROR]', err);
      this.failsafeFallback();
    }
  }

  /**
   * Easing functions
   */
  easeOutCubic(t) {
    return (--t) * t * t + 1;
  }

  easeInCubic(t) {
    return t * t * t;
  }

  /**
   * State transitions
   */
  transitionState(newState) {
    if (this.currentState === newState) return;
    this.currentState = newState;

    switch (newState) {
      case this.STATES.INIT:
        // 00:00 - 00:600: Show background, prep letters for reveal
        this.letterEls.forEach(span => {
          span.style.opacity = '0';
          span.style.transform = 'translate3d(0, 30px, 0) scale(0.96)';
          span.style.filter = 'blur(10px)';
        });
        break;

      case this.STATES.REVEAL:
        // 00:600 - 01:500: Render STRIPE with reveal curve
        console.log('[INTRO] reveal');
        if (this.audioEngine) {
          try { this.audioEngine.playReveal(); } catch (_) {}
        }
        break;

      case this.STATES.HOLD:
        // 01:500 - 02:500: Hold STRIPE completely still
        console.log('[INTRO] hold');
        this.letterEls.forEach(span => {
          span.style.opacity = '1';
          span.style.transform = 'translate3d(0, 0, 0) scale(1)';
          span.style.filter = 'none';
        });
        break;

      case this.STATES.EXIT:
        // 02:500 - 03:700: Begin cinematic exit
        console.log('[INTRO] exit');
        if (this.audioEngine) {
          try { this.audioEngine.playExit(); } catch (_) {}
        }
        break;

      case this.STATES.FRAGMENT:
        // 03:700 - 04:500: Letters disintegrate into fragments
        console.log('[INTRO] particles');
        this.letterEls.forEach(span => {
          span.style.opacity = '0';
        });

        if (this.fragmentEngine) {
          try { this.fragmentEngine.start(this.letterEls, 800); } catch (_) {}
        }

        if (this.audioEngine) {
          try { this.audioEngine.playImpact(); } catch (_) {}
        }
        break;

      case this.STATES.COMPLETE:
        console.log('[INTRO] complete');
        this.complete();
        break;
    }
  }

  /**
   * Start master animation timeline
   */
  start() {
    this.reset();
    this.isRunning = true;
    this.startTime = performance.now();
    this.transitionState(this.STATES.INIT);

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Master RAF tick running at 60 FPS
   */
  tick(now) {
    if (!this.isRunning) return;

    try {
      const elapsed = now - this.startTime;

      // 1. 00:00 - 00:600 (0 - 600ms) -> INTRO_INIT
      if (elapsed < 600) {
        if (this.currentState !== this.STATES.INIT) {
          this.transitionState(this.STATES.INIT);
        }
      }
      // 2. 00:600 - 01:500 (600 - 1500ms) -> INTRO_REVEAL
      else if (elapsed >= 600 && elapsed < 1500) {
        if (this.currentState !== this.STATES.REVEAL) {
          this.transitionState(this.STATES.REVEAL);
        }

        const rawProgress = (elapsed - 600) / 900;
        const progress = Math.min(Math.max(rawProgress, 0), 1);
        const ease = this.easeOutCubic(progress);

        const opacity = ease;
        const translateY = (1 - ease) * 30;
        const scale = 0.96 + ease * 0.04;
        const blur = (1 - ease) * 10;

        this.letterEls.forEach(span => {
          span.style.opacity = opacity.toFixed(3);
          span.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
          span.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
        });
      }
      // 3. 01:500 - 02:500 (1500 - 2500ms) -> INTRO_HOLD
      else if (elapsed >= 1500 && elapsed < 2500) {
        if (this.currentState !== this.STATES.HOLD) {
          this.transitionState(this.STATES.HOLD);
        }
      }
      // 4. 02:500 - 03:700 (2500 - 3700ms) -> INTRO_EXIT
      else if (elapsed >= 2500 && elapsed < 3700) {
        if (this.currentState !== this.STATES.EXIT) {
          this.transitionState(this.STATES.EXIT);
        }

        const rawProgress = (elapsed - 2500) / 1200;
        const progress = Math.min(Math.max(rawProgress, 0), 1);
        const ease = this.easeInCubic(progress);

        const scaleX = 1 + ease * 1.5;
        const scaleY = 1 - ease * 0.15;
        const blur = ease * 7.0;
        const opacity = Math.max(0.12, 1 - ease * 0.88);

        this.letterEls.forEach((span, i) => {
          const params = this.letterExitParams[i] || { dirX: 0, rot: 0 };
          const translateX = params.dirX * ease * 65;
          const rotation = params.rot * ease;

          span.style.opacity = opacity.toFixed(3);
          span.style.transform = `translate3d(${translateX.toFixed(1)}px, 0, 0) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)}) rotate(${rotation.toFixed(1)}deg)`;
          span.style.filter = `blur(${blur.toFixed(2)}px)`;
        });
      }
      // 5. 03:700 - 04:500 (3700 - 4500ms) -> INTRO_FRAGMENT
      else if (elapsed >= 3700 && elapsed < 4500) {
        if (this.currentState !== this.STATES.FRAGMENT) {
          this.transitionState(this.STATES.FRAGMENT);
        }
      }
      // 6. 04:500 - 05:000 (4500 - 5000ms) -> Fade intro stage to black
      else if (elapsed >= 4500 && elapsed < 5000) {
        const rawProgress = (elapsed - 4500) / 500;
        const progress = Math.min(Math.max(rawProgress, 0), 1);
        if (this.introEl) {
          this.introEl.style.opacity = (1 - progress).toFixed(2);
        }
      }
      // 7. 05:000+ -> Reveal Homepage
      else if (elapsed >= 5000) {
        this.transitionState(this.STATES.COMPLETE);
        return;
      }

      this.rafId = requestAnimationFrame(this.tick.bind(this));
    } catch (err) {
      console.error('[INTRO ERROR]', err);
      this.failsafeFallback();
    }
  }

  /**
   * Reduced motion mode
   */
  runReducedMotion() {
    console.log('[INTRO] prefers-reduced-motion: reduce');
    this.letterEls.forEach(span => {
      span.style.opacity = '1';
      span.style.transform = 'translate3d(0, 0, 0)';
      span.style.filter = 'none';
    });

    setTimeout(() => {
      this.complete();
    }, 1200);
  }

  /**
   * Finish intro and reveal website
   */
  complete() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.introEl) {
      this.introEl.classList.add('is-complete');
      this.introEl.style.display = 'none';
    }

    if (this.siteEl) {
      this.siteEl.classList.add('is-visible');
    }

    if (typeof this.options.onComplete === 'function') {
      try { this.options.onComplete(); } catch (_) {}
    }
  }

  /**
   * Skip button handler
   */
  skip() {
    console.log('[INTRO] skip');
    this.reset();
    this.complete();
  }

  /**
   * Clean reset
   */
  reset() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.isRunning = false;
    this.startTime = null;
    this.currentState = null;

    if (this.introEl) {
      this.introEl.classList.remove('is-complete');
      this.introEl.style.display = 'flex';
      this.introEl.style.opacity = '1';
    }

    this.letterEls.forEach(span => {
      span.style.opacity = '1';
      span.style.transform = 'translate3d(0, 0, 0)';
      span.style.filter = 'none';
    });

    if (this.fragmentEngine) {
      try { this.fragmentEngine.stop(); } catch (_) {}
    }

    if (this.audioEngine) {
      try { this.audioEngine.stopAll(); } catch (_) {}
    }

    if (this.siteEl) {
      this.siteEl.classList.remove('is-visible');
    }
  }

  /**
   * Failsafe recovery: guarantees the site and logo are never frozen in darkness
   */
  failsafeFallback() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.letterEls.forEach(span => {
      span.style.opacity = '1';
      span.style.transform = 'translate3d(0, 0, 0)';
      span.style.filter = 'none';
    });

    setTimeout(() => {
      if (this.introEl) {
        this.introEl.classList.add('is-complete');
        this.introEl.style.display = 'none';
      }
      if (this.siteEl) {
        this.siteEl.classList.add('is-visible');
      }
    }, 1800);
  }

  /**
   * Teardown
   */
  destroy() {
    this.reset();
    this.introEl = null;
    this.logoEl = null;
    this.letterEls = [];
    this.siteEl = null;
    this.canvasEl = null;
  }
}
