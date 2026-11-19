// App bootstrap: loads the display fonts and the bundled sample photos, starts the editor, and
// applies screenshot parameters when the maker asks for them.

import { initEditor } from './editor.js';
import { SAMPLE_PHOTOS, createState, makePhoto } from './state.js';
import { applyShotParams, enterCoverShotMode } from './shot.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadDisplayFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('80px Anton'), document.fonts.load('20px "Archivo Black"')]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // The canvas falls back to a heavy sans-serif; the app still works.
  }
}

function collectElements() {
  const byId = (id) => document.getElementById(id);
  return {
    canvas: byId('stage'),
    fileInput: byId('photo-file'),
    tray: byId('tray'),
    layouts: byId('layouts'),
    modePanels: byId('mode-panels'),
    modeSpread: byId('mode-spread'),
    caption: byId('caption'),
    sub: byId('sub'),
    captionPos: byId('caption-pos'),
    grade: byId('grade'),
    lettering: byId('lettering'),
    size: byId('size'),
    zoom: byId('zoom'),
    resetView: byId('reset-view'),
    exportButton: byId('export'),
    quickExports: [...document.querySelectorAll('.quick-export')],
    status: byId('status'),
  };
}

async function main() {
  const state = createState();
  await loadDisplayFonts();
  const photosByName = new Map();
  for (const sample of SAMPLE_PHOTOS) {
    const img = await loadImage(sample.src);
    const photo = makePhoto(img, sample.name);
    photosByName.set(sample.name, photo);
    state.photos.push(photo);
  }
  const editor = initEditor(state, collectElements());
  const shot = applyShotParams(state, new URLSearchParams(location.search), photosByName);
  if (shot) {
    editor.rebuildTray();
    if (shot === 'cover') {
      enterCoverShotMode();
      editor.drawClean();
    } else {
      editor.redraw();
    }
  }
  document.body.dataset.ready = '1';
}

main();
