// js/app.js
import { loadProjectsFromServer } from './data.js';
import { initUI } from './ui.js';

window.addEventListener('DOMContentLoaded', async () => {
  await loadProjectsFromServer();

  initUI();

  const galaxyEl = document.getElementById('galaxy-bg');
  let galaxyHandle = null;

  const galaxyOptions = {
    mouseRepulsion: true,
    mouseInteraction: true,
    density: 1.5,
    glowIntensity: 0.5,
    saturation: 0.8,
    hueShift: 240,
    speed: 1.0,
    twinkleIntensity: 0.35,
    rotationSpeed: 0.06
  };

  function startGalaxy() {
    if (galaxyEl && typeof window.initGalaxyBackground === 'function') {
      galaxyHandle = window.initGalaxyBackground(galaxyEl, galaxyOptions);
    } else {
      console.warn('Galaxy helper not loaded or container missing.');
    }
  }

  window.resetHomedeskGalaxy = function resetHomedeskGalaxy() {
    try {
      if (galaxyHandle?.destroy) {
        galaxyHandle.destroy();
      }
    } catch {}

    try {
      if (galaxyEl) {
        galaxyEl.innerHTML = '';
      }
    } catch {}

    startGalaxy();
  };

  startGalaxy();
});