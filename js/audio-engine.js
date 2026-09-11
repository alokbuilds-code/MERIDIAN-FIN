/**
 * STRIPE CINEMATIC INTRO — AUDIO ENGINE
 * Synthesizes minimal, premium audio using native Web Audio API.
 * Safely guarded with try/catch so audio issues can NEVER interrupt visual animation.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.unlocked = false;

    // Check localStorage sound preference
    try {
      this.muted = localStorage.getItem('stripe_sound_enabled') === '0';
    } catch (_) {
      this.muted = false;
    }
  }

  /**
   * Safely obtain or initialize the AudioContext
   */
  getContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.75, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      }
      return this.ctx;
    } catch (e) {
      console.warn('[AUDIO] Context init failed gracefully:', e);
      return null;
    }
  }

  /**
   * Resume / unlock audio context on user interaction
   */
  async unlock() {
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.unlocked = ctx && ctx.state === 'running';
      return this.unlocked;
    } catch (e) {
      console.warn('[AUDIO] Unlock error handled safely:', e);
      return false;
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    try {
      this.muted = !this.muted;
      try {
        localStorage.setItem('stripe_sound_enabled', this.muted ? '0' : '1');
      } catch (_) {}

      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.75, now, 0.05);
      }

      if (!this.muted) {
        this.unlock();
      }
      return this.muted;
    } catch (e) {
      console.warn('[AUDIO] Toggle mute error:', e);
      return this.muted;
    }
  }

  isMuted() {
    return this.muted;
  }

  // =========================================================================
  // CINEMATIC SOUNDS
  // =========================================================================

  /**
   * 1. Logo reveal: subtle low-frequency swell (00:600 - 01:500)
   */
  playReveal() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running' || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.85);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {
      console.warn('[AUDIO] Reveal swell safely ignored:', e);
    }
  }

  /**
   * 2. Logo exit: short rising whoosh (02:500 - 03:700)
   */
  playExit() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running' || this.muted) return;

      const now = ctx.currentTime;
      const duration = 0.7;

      // Bandpass noise sweep
      const buffer = this.createNoiseBuffer(ctx, duration);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(2.5, now);
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.6);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      source.start(now);
    } catch (e) {
      console.warn('[AUDIO] Exit whoosh safely ignored:', e);
    }
  }

  /**
   * 3. Fragment explosion: soft cinematic impact (03:700 - 04:500)
   */
  playImpact() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running' || this.muted) return;

      const now = ctx.currentTime;

      // Sub-bass impact drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('[AUDIO] Impact safely ignored:', e);
    }
  }

  /**
   * Helper to create white noise buffer
   */
  createNoiseBuffer(ctx, duration) {
    try {
      const length = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    } catch (_) {
      return null;
    }
  }

  stopAll() {
    // Master gain silence handles any running nodes
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch (_) {}
  }

  destroy() {
    try {
      this.stopAll();
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch (_) {}
    this.ctx = null;
  }
}
