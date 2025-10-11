// js/app.js
import { initUI } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  initUI(); // this builds the graph via graph.js

// Start the galaxy background (canvas version doesn't need OGL)
const galaxyEl = document.getElementById('galaxy-bg');
if (galaxyEl && typeof window.initGalaxyBackground === 'function') {
  window.initGalaxyBackground(galaxyEl, {
    mouseRepulsion: true,
    mouseInteraction: true,
    density: 1.5,
    glowIntensity: 0.5,
    saturation: 0.8,
    hueShift: 240,
    speed: 1.0,
    twinkleIntensity: 0.35,
    rotationSpeed: 0.06
  });
} else {
  console.warn('Galaxy helper not loaded or container missing.');
}
});
