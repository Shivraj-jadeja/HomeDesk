// js/galaxy.global.js  — 2D Canvas starfield (no dependencies)
// Exposes: window.initGalaxyBackground(container, options)

(() => {
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function hsl(h, s, l) { return `hsl(${h|0} ${clamp(s*100,0,100)}% ${clamp(l*100,0,100)}%)`; }

  window.initGalaxyBackground = function initGalaxyBackground(container, opts = {}) {
    const {
      density = 1.0,             // star count multiplier (1 ≈ 800 on 1920x1080)
      hueShift = 240,            // base hue (0..360)
      saturation = 0.8,          // 0..1
      glowIntensity = 0.5,       // 0..1
      speed = 1.0,               // overall motion
      twinkleIntensity = 0.3,    // 0..1
      rotationSpeed = 0.06,      // radians/sec swirl
      mouseInteraction = true,
      mouseRepulsion = true,
      repulsionStrength = 2.0,   // feel of mouse push
      transparent = true
    } = opts;

    // --- canvas setup ---
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.background = 'transparent';
    if (transparent !== true) canvas.style.background = '#000';
    const ctx = canvas.getContext('2d', { alpha: true });
    container.appendChild(canvas);

    // Mouse smoothing like the shader version
    const mouse = { x: 0.5, y: 0.5, active: 0 };
    const targetMouse = { x: 0.5, y: 0.5, active: 0 };
    function onMove(e) {
      const r = container.getBoundingClientRect();
      targetMouse.x = (e.clientX - r.left) / r.width;
      targetMouse.y = (e.clientY - r.top) / r.height;
      targetMouse.active = 1;
    }
    function onLeave() { targetMouse.active = 0; }
    if (mouseInteraction) {
      const el = container.parentElement || container;
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    }

    let W = 0, H = 0, CX = 0, CY = 0;
    let stars = [];

    function computeCount() {
      // ~0.0004 stars per pixel is a nice default
      const base = Math.round((W * H) * 0.0004);
      return Math.max(150, Math.min(3000, Math.round(base * density)));
    }

    function makeStars(n) {
      stars = new Array(n).fill(0).map(() => {
        const depth = Math.random(); // 0 (near) .. 1 (far)
        const radius = (0.6 + 2.4 * (1 - depth)) * dpr;       // near stars larger
        const hue = (hueShift + rand(-20, 20) + 360) % 360;
        const sat = clamp(saturation + rand(-0.15, 0.15), 0, 1);
        const light = 0.6 + 0.4 * (1 - depth);                 // near = brighter
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          depth,
          r: radius,
          hue, sat, light,
          twPhase: rand(0, Math.PI * 2),
        };
      });
    }

    function resize() {
      const w = container.clientWidth || container.offsetWidth || 300;
      const h = container.clientHeight || container.offsetHeight || 150;
      if (w === W && h === H) return;
      W = w; H = h; CX = W / 2; CY = H / 2;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars(computeCount());
    }
    window.addEventListener('resize', resize);
    resize();

    // --- animation loop ---
    let rafId = 0;
    let last = performance.now();

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000) * speed; // cap dt to keep stable
      last = now;

      // smooth mouse
      const k = 0.06;
      mouse.x += (targetMouse.x - mouse.x) * k;
      mouse.y += (targetMouse.y - mouse.y) * k;
      mouse.active += (targetMouse.active - mouse.active) * k;

      // clear
      ctx.clearRect(0, 0, W, H);

      const shadowBase = 4 + glowIntensity * 14;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // swirl about center based on depth (farther = slower)
        const angle = rotationSpeed * dt * (0.2 + 0.8 * (1 - s.depth));
        const dx = s.x - CX, dy = s.y - CY;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        s.x = CX + dx * cos - dy * sin;
        s.y = CY + dx * sin + dy * cos;

        // subtle drift (wrap)
        s.x += (0.1 + 0.6 * (1 - s.depth)) * dt * 10;
        if (s.x > W) s.x -= W; if (s.x < 0) s.x += W;
        if (s.y > H) s.y -= H; if (s.y < 0) s.y += H;

        // mouse repulsion / parallax
        let ox = 0, oy = 0;
        const mx = mouse.x * W, my = mouse.y * H;
        if (mouseInteraction) {
          const mdx = s.x - mx, mdy = s.y - my;
          const dist = Math.hypot(mdx, mdy) + 1e-3;
          const parallax = (1 - s.depth) * mouse.active * 8; // small parallax
          ox += -mdx / (dist) * parallax;
          oy += -mdy / (dist) * parallax;

          if (mouseRepulsion && mouse.active > 0.01) {
            const push = repulsionStrength * (1 - s.depth) * 14 * mouse.active / (dist + 20);
            s.x += (mdx / dist) * push;
            s.y += (mdy / dist) * push;
          }
        }

        // twinkle
        const tw = 1 + twinkleIntensity * Math.sin(now * 0.003 + s.twPhase);

        // draw star (shadow for glow)
        const size = s.r * tw;
        ctx.beginPath();
        ctx.shadowBlur = shadowBase * (1 - s.depth);
        const col = hsl(s.hue, s.sat, s.light);
        ctx.shadowColor = col;
        ctx.fillStyle = col;
        ctx.arc(s.x + ox, s.y + oy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    rafId = requestAnimationFrame(tick);

    return {
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        try {
          const el = container.parentElement || container;
          el.removeEventListener('mousemove', onMove);
          el.removeEventListener('mouseleave', onLeave);
        } catch {}
        try { container.removeChild(canvas); } catch {}
      }
    };
  };
})();
