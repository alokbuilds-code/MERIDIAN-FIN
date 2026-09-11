/**
 * STRIPE FINANCIAL OPERATING SYSTEM — ENTERPRISE JAVASCRIPT ENGINE
 * Drives the cinematic intro timeline, 3D card tilt physics, live settlement stream,
 * and multi-currency treasury engine with zero external dependencies.
 */

function runApp() {
  console.log('[APP] Initializing Stripe Enterprise Application Engine...');

  // =========================================================================
  // 1. ENGINE INITIALIZATION (AUDIO & PARTICLES)
  // =========================================================================
  let audioEngine = null;
  let fragmentEngine = null;

  try {
    audioEngine = new AudioEngine();
  } catch (e) {
    console.warn('[APP] AudioEngine init fallback:', e);
  }

  try {
    fragmentEngine = new FragmentEngine();
    const canvasEl = document.getElementById('intro-particles');
    if (canvasEl) {
      fragmentEngine.init(canvasEl);
    }
  } catch (e) {
    console.warn('[APP] FragmentEngine init fallback:', e);
  }

  // =========================================================================
  // 2. CINEMATIC INTRO ENGINE
  // =========================================================================
  const introEngine = new IntroEngine({
    introSelector: '#intro',
    logoSelector: '#intro-logo',
    siteSelector: '#site',
    particlesSelector: '#intro-particles',
    soundToggleSelector: '#sound-toggle',
    skipBtnSelector: '#skip-intro',
    onComplete: () => {
      console.log('[APP] Intro completed. Site fully active.');
    }
  });

  // Expose to window for debugging and programmatic replay
  window.IntroEngine = introEngine;
  window.AudioEngine = audioEngine;
  window.FragmentEngine = fragmentEngine;

  introEngine.init({ audioEngine, fragmentEngine });

  // =========================================================================
  // 3. SOUND CONTROLS & AUTOPLAY POLICY UNLOCK
  // =========================================================================
  const soundToggleBtn = document.getElementById('sound-toggle');
  if (soundToggleBtn && audioEngine) {
    const updateSoundButtonUI = (isMuted) => {
      soundToggleBtn.textContent = isMuted ? 'Sound: Off' : 'Sound: On';
      if (isMuted) {
        soundToggleBtn.classList.add('is-muted');
      } else {
        soundToggleBtn.classList.remove('is-muted');
      }
    };

    updateSoundButtonUI(audioEngine.isMuted());

    soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = audioEngine.toggleMute();
      updateSoundButtonUI(isMuted);
    });
  }

  if (audioEngine) {
    const unlockAudio = () => {
      audioEngine.unlock();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  // =========================================================================
  // 4. INTRO NAVIGATION (SKIP & REPLAY)
  // =========================================================================
  const skipBtn = document.getElementById('skip-intro');
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      introEngine.skip();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === ' ') && introEngine.isRunning) {
      e.preventDefault();
      introEngine.skip();
    }
  });

  const replayBtns = document.querySelectorAll('.replay-trigger');
  replayBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      introEngine.start();
    });
  });

  // =========================================================================
  // 5. INTERACTIVE 3D BRUSHED METAL CARD TILT
  // =========================================================================
  const card = document.getElementById('interactive-card');
  if (card) {
    let isHovered = false;

    card.addEventListener('mouseenter', () => {
      isHovered = true;
      card.style.transition = 'transform 0.1s ease-out, box-shadow 0.2s ease-out';
    });

    card.addEventListener('mousemove', (e) => {
      if (!isHovered) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Restrained tilt angle: max 12 deg for elite feel
      const rotateX = ((y - centerY) / centerY) * -11;
      const rotateY = ((x - centerX) / centerX) * 13;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.boxShadow = `
        ${-rotateY * 2}px ${rotateX * 2 + 30}px 60px rgba(0, 0, 0, 0.9),
        inset 0 1px 0 rgba(255, 255, 255, 0.35),
        inset 0 -1px 0 rgba(0, 0, 0, 0.6)
      `;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease-out';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.5)';
    });
  }

  // =========================================================================
  // 6. LIVE HIGH-FREQUENCY SETTLEMENT LEDGER STREAM
  // =========================================================================
  const ledgerStreamBox = document.getElementById('ledger-stream-box');
  const ledgerCounter = document.getElementById('ledger-counter');

  if (ledgerStreamBox) {
    const enterprisePool = [
      { name: 'NVIDIA Corp — Enterprise Compute Invoicing', amount: '+$215,000.00', currency: 'USD' },
      { name: 'Apple Services — European App Store Split', amount: '+€412,800.00', currency: 'EUR' },
      { name: 'Spotify AB — Global Recurring Subscriptions', amount: '+€92,450.00', currency: 'EUR' },
      { name: 'Microsoft EMEA — Direct Cloud Billing', amount: '+€185,000.00', currency: 'EUR' },
      { name: 'Snowflake Inc — Capacity Commit Tranche', amount: '+$84,000.00', currency: 'USD' },
      { name: 'Uber Technologies — Accelerated Driver Payout', amount: '+$67,350.00', currency: 'USD' },
      { name: 'Airbnb Global — Host Escrow Release', amount: '+$148,200.00', currency: 'USD' },
      { name: 'Hermès International — Flagship Wholesale Batch', amount: '+€56,900.00', currency: 'EUR' },
      { name: 'Figma LLC — Enterprise Seat Licensure', amount: '+$38,500.00', currency: 'USD' },
      { name: 'Salesforce EMEA — Multi-Cloud Contract Settle', amount: '+$190,000.00', currency: 'USD' }
    ];

    let poolIndex = 0;

    const formatTimestamp = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      return `${hh}:${mm}:${ss}.${ms}`;
    };

    const injectLiveTransaction = () => {
      const tx = enterprisePool[poolIndex % enterprisePool.length];
      poolIndex++;

      const row = document.createElement('div');
      row.className = 'ledger-row';
      row.innerHTML = `
        <span class="ledger-time">${formatTimestamp()}</span>
        <span class="ledger-entity">${tx.name}</span>
        <span class="ledger-amount">${tx.amount}</span>
        <span class="ledger-status"><span class="status-tag status-settled">SETTLED</span></span>
      `;

      ledgerStreamBox.insertBefore(row, ledgerStreamBox.firstChild);

      // Keep max 5 rows visible
      while (ledgerStreamBox.children.length > 5) {
        ledgerStreamBox.removeChild(ledgerStreamBox.lastChild);
      }

      // Micro-fluctuate counter for realism
      if (ledgerCounter) {
        const jitterRate = 2480 + Math.floor(Math.random() * 35);
        ledgerCounter.textContent = `STREAMING: ${jitterRate.toLocaleString()} TX/SEC`;
      }
    };

    // Push new simulated settlements every 2.4 seconds
    setInterval(injectLiveTransaction, 2400);
  }

  // =========================================================================
  // 7. GLOBAL TREASURY & INTERBANK FX CONVERTER
  // =========================================================================
  const fxAmountInput = document.getElementById('fx-amount-input');
  const fxFromSelect = document.getElementById('fx-from-currency');
  const fxToSelect = document.getElementById('fx-to-currency');
  const fxOutputAmount = document.getElementById('fx-output-amount');
  const fxRateText = document.getElementById('fx-rate-text');
  const fxSwapBtn = document.getElementById('fx-swap-btn');

  // Benchmark Institutional Mid-Market Rates relative to USD
  const fxRatesToUSD = {
    USD: 1.0,
    EUR: 1.0825,   // 1 EUR = 1.0825 USD
    GBP: 1.2740,   // 1 GBP = 1.2740 USD
    JPY: 0.00648,  // 1 JPY = 0.00648 USD (1 USD ~ 154.3 JPY)
    SGD: 0.7420,   // 1 SGD = 0.7420 USD
    CHF: 1.1210    // 1 CHF = 1.1210 USD
  };

  const calculateFX = () => {
    if (!fxAmountInput || !fxFromSelect || !fxToSelect || !fxOutputAmount) return;

    const amount = parseFloat(fxAmountInput.value) || 0;
    const fromCur = fxFromSelect.value;
    const toCur = fxToSelect.value;

    if (amount <= 0) {
      fxOutputAmount.value = '0.00';
      return;
    }

    // Convert from -> USD -> to
    const amountInUSD = amount * fxRatesToUSD[fromCur];
    const convertedAmount = amountInUSD / fxRatesToUSD[toCur];
    const unitRate = (1 * fxRatesToUSD[fromCur]) / fxRatesToUSD[toCur];

    // Format output
    if (toCur === 'JPY') {
      fxOutputAmount.value = Math.round(convertedAmount).toLocaleString('en-US');
    } else {
      fxOutputAmount.value = convertedAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    if (fxRateText) {
      const precision = toCur === 'JPY' ? 2 : 4;
      fxRateText.textContent = `1 ${fromCur} = ${unitRate.toFixed(precision)} ${toCur} (Live Interbank)`;
    }
  };

  if (fxAmountInput) fxAmountInput.addEventListener('input', calculateFX);
  if (fxFromSelect) fxFromSelect.addEventListener('change', calculateFX);
  if (fxToSelect) fxToSelect.addEventListener('change', calculateFX);

  if (fxSwapBtn && fxFromSelect && fxToSelect) {
    fxSwapBtn.addEventListener('click', () => {
      const temp = fxFromSelect.value;
      fxFromSelect.value = fxToSelect.value;
      fxToSelect.value = temp;
      calculateFX();
    });
  }

  // Initialize initial calculation
  calculateFX();

  // =========================================================================
  // 8. ACCESSIBILITY & REDUCED MOTION SAFEGUARDS
  // =========================================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('[APP] Reduced motion preferred: skipping intro automatically.');
    introEngine.skip();
  }
}

// Guarantee execution regardless of document.readyState
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runApp);
} else {
  runApp();
}
