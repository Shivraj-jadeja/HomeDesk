// js/galaxy.global.js  — 2D Canvas starfield (no dependencies)
// Exposes: window.initGalaxyBackground(container, options)

(() => {
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function hsl(h, s, l) {
    return `hsl(${h | 0} ${clamp(s * 100, 0, 100)}% ${clamp(l * 100, 0, 100)}%)`;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  window.initGalaxyBackground = function initGalaxyBackground(container, opts = {}) {
    const {
      density = 1.0,
      hueShift = 240,
      saturation = 0.8,
      glowIntensity = 0.5,
      speed = 1.0,
      twinkleIntensity = 0.3,
      rotationSpeed = 0.06,
      mouseInteraction = true,
      mouseRepulsion = true,
      repulsionStrength = 2.0,
      transparent = true
    } = opts;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = document.createElement('canvas');

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.background = 'transparent';

    if (transparent !== true) canvas.style.background = '#000';

    const ctx = canvas.getContext('2d', { alpha: true });
    container.appendChild(canvas);

    const mouse = { x: 0.5, y: 0.5, active: 0 };
    const targetMouse = { x: 0.5, y: 0.5, active: 0 };

    let W = 0;
    let H = 0;
    let CX = 0;
    let CY = 0;
    let stars = [];
    let resetAnim = null;

    function onMove(e) {
      const r = container.getBoundingClientRect();
      targetMouse.x = (e.clientX - r.left) / r.width;
      targetMouse.y = (e.clientY - r.top) / r.height;
      targetMouse.active = 1;
    }

    function onLeave() {
      targetMouse.active = 0;
    }

    if (mouseInteraction) {
      const el = container.parentElement || container;
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    }

    function computeCount() {
      const base = Math.round((W * H) * 0.0004);
      return Math.max(150, Math.min(3000, Math.round(base * density)));
    }

    function makeCenteredTarget(index, total) {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const t = index / Math.max(1, total - 1);

      // Spiral-ish spread, but much wider than before.
      const angle = index * golden + rand(-0.18, 0.18);

      // Use a wide radius so stars fill the graph area instead of becoming a small cluster.
      const maxRadius = Math.min(W, H) * 0.92;

      // Push more stars outward while keeping some density near the center.
      const radius = Math.pow(t, 0.42) * maxRadius * rand(0.72, 1.12);

      // Slight horizontal stretch because your graph area is wider than it is tall.
      const stretchX = 1.45;
      const stretchY = 0.82;

      return {
        x: CX + Math.cos(angle) * radius * stretchX,
        y: CY + Math.sin(angle) * radius * stretchY
      };
    }

    function makeStars(n) {
      stars = new Array(n).fill(0).map((_, i) => {
        const depth = Math.random();
        const radius = (0.6 + 2.4 * (1 - depth)) * dpr;
        const hue = (hueShift + rand(-20, 20) + 360) % 360;
        const sat = clamp(saturation + rand(-0.15, 0.15), 0, 1);
        const light = 0.6 + 0.4 * (1 - depth);
        const target = makeCenteredTarget(i, n);

        return {
          x: target.x,
          y: target.y,
          depth,
          r: radius,
          hue,
          sat,
          light,
          twPhase: rand(0, Math.PI * 2)
        };
      });
    }

    function resize() {
      const w = container.clientWidth || container.offsetWidth || 300;
      const h = container.clientHeight || container.offsetHeight || 150;

      if (w === W && h === H) return;

      W = w;
      H = h;
      CX = W / 2;
      CY = H / 2;

      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars(computeCount());
    }

    window.addEventListener('resize', resize);
    resize();

    let rafId = 0;
    let last = performance.now();

    function tick(now) {
      rafId = requestAnimationFrame(tick);

      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;

      const k = 0.06;
      mouse.x += (targetMouse.x - mouse.x) * k;
      mouse.y += (targetMouse.y - mouse.y) * k;
      mouse.active += (targetMouse.active - mouse.active) * k;

      ctx.clearRect(0, 0, W, H);

      const shadowBase = 4 + glowIntensity * 14;

      let resetProgress = 0;
      let resetEase = 0;

      if (resetAnim) {
        resetProgress = clamp((now - resetAnim.start) / resetAnim.duration, 0, 1);
        resetEase = easeOutCubic(resetProgress);
      }

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (resetAnim) {
          const start = resetAnim.starts[i];
          const target = resetAnim.targets[i];

          s.x = start.x + (target.x - start.x) * resetEase;
          s.y = start.y + (target.y - start.y) * resetEase;
        } else {
          const angle = rotationSpeed * dt * (0.2 + 0.8 * (1 - s.depth));
          const dx = s.x - CX;
          const dy = s.y - CY;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          s.x = CX + dx * cos - dy * sin;
          s.y = CY + dx * sin + dy * cos;

          s.x += (0.1 + 0.6 * (1 - s.depth)) * dt * 10;

          if (s.x > W) s.x -= W;
          if (s.x < 0) s.x += W;
          if (s.y > H) s.y -= H;
          if (s.y < 0) s.y += H;
        }

        let ox = 0;
        let oy = 0;

        const mx = mouse.x * W;
        const my = mouse.y * H;

        if (mouseInteraction && !resetAnim) {
          const mdx = s.x - mx;
          const mdy = s.y - my;
          const dist = Math.hypot(mdx, mdy) + 1e-3;

          const parallax = (1 - s.depth) * mouse.active * 8;
          ox += -mdx / dist * parallax;
          oy += -mdy / dist * parallax;

          if (mouseRepulsion && mouse.active > 0.01) {
            const push = repulsionStrength * (1 - s.depth) * 14 * mouse.active / (dist + 20);
            s.x += (mdx / dist) * push;
            s.y += (mdy / dist) * push;
          }
        }

        const tw = 1 + twinkleIntensity * Math.sin(now * 0.003 + s.twPhase);
        const size = s.r * tw;

        ctx.beginPath();
        ctx.shadowBlur = shadowBase * (1 - s.depth);

        const col = hsl(s.hue, s.sat, s.light);

        ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.arc(s.x + ox, s.y + oy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (resetAnim && resetProgress >= 1) {
        resetAnim = null;
      }
    }

    rafId = requestAnimationFrame(tick);

    return {
      resetToCenter(duration = 950) {
        targetMouse.x = 0.5;
        targetMouse.y = 0.5;
        targetMouse.active = 0;

        mouse.x = 0.5;
        mouse.y = 0.5;
        mouse.active = 0;

        resetAnim = {
          start: performance.now(),
          duration,
          starts: stars.map(s => ({ x: s.x, y: s.y })),
          targets: stars.map((_, i) => makeCenteredTarget(i, stars.length))
        };
      },

      reset() {
        this.resetToCenter(950);
      },

      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);

        try {
          const el = container.parentElement || container;
          el.removeEventListener('mousemove', onMove);
          el.removeEventListener('mouseleave', onLeave);
        } catch {}

        try {
          container.removeChild(canvas);
        } catch {}
      }
    };
  };
})();