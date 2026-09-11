/**
 * STRIPE CINEMATIC INTRO — FRAGMENT PARTICLES ENGINE
 * Generates 100-250 controlled particles ONLY during the disintegration phase (03:700-04:500).
 * Self-terminating requestAnimationFrame loop that frees resources when finished.
 */

class FragmentEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.rafId = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.isRunning = false;
    this.startTime = 0;
    this.duration = 800; // 03:700 - 04:500
    this.onComplete = null;

    this.boundResize = this.resize.bind(this);
  }

  /**
   * Bind canvas and setup DPI
   */
  init(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.resize();
    window.addEventListener('resize', this.boundResize, { passive: true });
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Generates 100-250 particles and starts rendering loop
   * @param {HTMLElement[]} letterElements Array of spans
   * @param {number} durationMs Duration of particle simulation (default 800ms)
   * @param {Function} onComplete Callback when all particles finish
   */
  start(letterElements, durationMs = 800, onComplete = null) {
    if (!this.canvas || !this.ctx) return;

    this.stop();
    this.particles = [];
    this.duration = durationMs;
    this.onComplete = onComplete;
    this.isRunning = true;
    this.startTime = performance.now();

    const cx = this.width / 2;
    const cy = this.height / 2;
    const isMobile = this.width < 768;

    // Target approximately 100-250 particles depending on screen size
    const totalParticles = isMobile ? 120 : 210;
    const perLetter = Math.floor(totalParticles / (letterElements.length || 6));

    letterElements.forEach((el, letterIdx) => {
      const rect = el.getBoundingClientRect();
      const letterCenterX = rect.left + rect.width / 2;
      const letterCenterY = rect.top + rect.height / 2;

      // Direction vector pointing outward from screen center
      const dirX = letterCenterX - cx;
      const normDirX = dirX !== 0 ? dirX / Math.abs(dirX) : (letterIdx < 3 ? -1 : 1);

      for (let i = 0; i < perLetter; i++) {
        // Random point within letter bounding box
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        // Velocities outward with horizontal bias
        const speed = (isMobile ? 8 : 12) + Math.random() * 16;
        const vx = (normDirX * speed) + (Math.random() - 0.5) * 6;
        const vy = (Math.random() - 0.5) * 12 + (letterCenterY - cy) * 0.02;

        this.particles.push({
          x,
          y,
          vx,
          vy,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.15,
          scale: 0.8 + Math.random() * 1.4,
          opacity: 1,
          life: 0,
          maxLife: this.duration * (0.65 + Math.random() * 0.35),
          width: 2 + Math.random() * 5,
          height: 1.5 + Math.random() * 3
        });
      }
    });

    this.tick();
  }

  /**
   * Main RAF animation frame
   */
  tick() {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    this.ctx.clearRect(0, 0, this.width, this.height);

    let aliveCount = 0;
    const dt = 0.016;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += 16.67;

      if (p.life >= p.maxLife || p.opacity <= 0.02) {
        continue;
      }
      aliveCount++;

      // Update physics
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.rotation += p.vRot;

      // Accelerated outward momentum
      p.vx *= 1.02;

      // Opacity decay
      const lifeRatio = p.life / p.maxLife;
      p.opacity = Math.max(0, 1 - Math.pow(lifeRatio, 1.6));

      // Draw fragment
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.scale(p.scale, p.scale);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

      this.ctx.restore();
    }

    if (progress < 1 && aliveCount > 0) {
      this.rafId = requestAnimationFrame(this.tick.bind(this));
    } else {
      this.clear();
      this.isRunning = false;
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  /**
   * Clear canvas
   */
  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Stop rendering and cancel frame
   */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
    this.clear();
  }

  /**
   * Teardown
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.boundResize);
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }
}
