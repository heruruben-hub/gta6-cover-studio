// The editor: wires the control panel, photo tray and canvas gestures to the state, keeps the
// live preview drawing, and exports the finished cover as a PNG at the exact post size.

import { LAYOUTS, layoutById, panelAt, panelRects } from './layouts.js';
import { GRADES } from './grade.js';
import { drawCover, renderCoverCanvas } from './render.js';
import { EXPORT_SIZES, clampAssignments, makePhoto, sizeById } from './state.js';

export function initEditor(state, els) {
  const canvas = els.canvas;
  const ctx = canvas.getContext('2d');

  function panelCount() {
    return layoutById(state.layoutId).panels.length;
  }

  function currentView() {
    return state.mode === 'spread' ? state.spreadView : state.panelViews[state.selectedPanel];
  }

  function draw(editorMarks) {
    const size = sizeById(state.sizeId);
    if (canvas.width !== size.w || canvas.height !== size.h) {
      canvas.width = size.w;
      canvas.height = size.h;
    }
    drawCover(ctx, state, canvas.width, canvas.height, editorMarks ? { editor: true } : {});
  }

  function redraw() {
    draw(true);
  }

  /** The cover exactly as it exports, with no editor marks: used for cover screenshots. */
  function drawClean() {
    draw(false);
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  // ---- photo tray -------------------------------------------------------

  function rebuildTray() {
    els.tray.replaceChildren();
    state.photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb' + (index === state.activePhoto ? ' active' : '');
      button.title = photo.name;
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      const label = document.createElement('span');
      label.textContent = photo.name;
      button.append(img, label);
      button.addEventListener('click', () => {
        state.activePhoto = index;
        if (state.mode === 'spread') {
          state.spreadPhoto = index;
          setStatus(`"${photo.name}" now fills the whole cover. Drag to reposition it.`);
        } else {
          state.panelPhotos[state.selectedPanel] = index;
          setStatus(`"${photo.name}" is in panel ${state.selectedPanel + 1}. Drag on the cover to reposition it.`);
        }
        rebuildTray();
        redraw();
      });
      els.tray.append(button);
    });
  }

  function addPhoto(img, name) {
    state.photos.push(makePhoto(img, name));
    clampAssignments(state, panelCount());
    rebuildTray();
    redraw();
  }

  function loadPhotoFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        addPhoto(img, file.name.replace(/\.[^.]+$/, ''));
        setStatus(`Loaded "${file.name}". Click a panel to place it, drag to reposition.`);
      };
      img.src = url;
    }
  }

  els.fileInput.addEventListener('change', () => {
    loadPhotoFiles([...els.fileInput.files]);
    els.fileInput.value = '';
  });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => {
    event.preventDefault();
    loadPhotoFiles([...event.dataTransfer.files]);
  });

  // ---- layout, mode and look controls -----------------------------------

  function rebuildLayouts() {
    els.layouts.replaceChildren();
    for (const layout of LAYOUTS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip' + (layout.id === state.layoutId ? ' active' : '');
      button.textContent = layout.name;
      button.addEventListener('click', () => {
        state.layoutId = layout.id;
        clampAssignments(state, panelCount());
        rebuildLayouts();
        redraw();
      });
      els.layouts.append(button);
    }
  }

  function rebuildGrades() {
    els.grade.replaceChildren();
    for (const grade of GRADES) {
      const option = document.createElement('option');
      option.value = grade.id;
      option.textContent = grade.name;
      els.grade.append(option);
    }
    els.grade.value = state.grade;
  }

  function setMode(mode) {
    state.mode = mode;
    els.modePanels.classList.toggle('active', mode === 'panels');
    els.modeSpread.classList.toggle('active', mode === 'spread');
    setStatus(mode === 'spread'
      ? 'Spread mode: one photo fills every panel. Pick a photo, drag and zoom it as one picture.'
      : 'Panel mode: click a photo, then a panel, to fill panels one by one.');
    syncZoom();
    redraw();
  }
  els.modePanels.addEventListener('click', () => setMode('panels'));
  els.modeSpread.addEventListener('click', () => setMode('spread'));

  els.caption.addEventListener('input', () => { state.caption = els.caption.value; redraw(); });
  els.sub.addEventListener('input', () => { state.sub = els.sub.value; redraw(); });
  els.captionPos.addEventListener('change', () => { state.captionPos = els.captionPos.value; redraw(); });
  els.grade.addEventListener('change', () => { state.grade = els.grade.value; redraw(); });
  els.lettering.addEventListener('change', () => { state.lettering = els.lettering.value; redraw(); });
  els.size.addEventListener('change', () => { state.sizeId = els.size.value; redraw(); });

  // ---- canvas gestures: select, assign, drag to pan, wheel to zoom -------

  function canvasPoint(event) {
    const box = canvas.getBoundingClientRect();
    return {
      fx: (event.clientX - box.left) / box.width,
      fy: (event.clientY - box.top) / box.height,
      px: (event.clientX - box.left) * (canvas.width / box.width),
      py: (event.clientY - box.top) * (canvas.height / box.height),
    };
  }

  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    canvas.setPointerCapture(event.pointerId);
    if (state.mode === 'panels') {
      const hit = panelAt(layoutById(state.layoutId), point.fx, point.fy);
      if (hit >= 0) {
        state.selectedPanel = hit;
        if (state.activePhoto >= 0 && state.panelPhotos[hit] !== state.activePhoto) {
          state.panelPhotos[hit] = state.activePhoto;
          setStatus(`Panel ${hit + 1} now shows "${state.photos[state.activePhoto].name}". Drag to reposition it.`);
        }
      }
    }
    drag = { x: point.px, y: point.py };
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const view = currentView();
    const rects = panelRects(layoutById(state.layoutId), canvas.width, canvas.height);
    const area = state.mode === 'spread'
      ? { w: canvas.width, h: canvas.height }
      : rects[state.selectedPanel];
    view.ox += (point.px - drag.x) / area.w;
    view.oy += (point.py - drag.y) / area.h;
    drag = { x: point.px, y: point.py };
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const view = currentView();
    view.zoom = Math.min(4, Math.max(1, view.zoom * Math.exp(-event.deltaY * 0.0012)));
    syncZoom();
    redraw();
  }, { passive: false });

  function syncZoom() {
    els.zoom.value = String(currentView().zoom);
  }
  els.zoom.addEventListener('input', () => {
    currentView().zoom = Number(els.zoom.value);
    redraw();
  });
  els.resetView.addEventListener('click', () => {
    Object.assign(currentView(), { zoom: 1, ox: 0, oy: 0 });
    syncZoom();
    redraw();
  });

  // ---- export -------------------------------------------------------------

  function exportPng(sizeId) {
    const size = sizeById(sizeId);
    const art = renderCoverCanvas(state, size.w, size.h);
    art.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vice-cover-${size.w}x${size.h}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus(`Exported a ${size.w} × ${size.h} PNG. Post it anywhere.`);
    }, 'image/png');
  }
  els.exportButton.addEventListener('click', () => exportPng(state.sizeId));
  for (const button of els.quickExports) {
    button.addEventListener('click', () => exportPng(button.dataset.size));
  }

  function rebuildSizes() {
    els.size.replaceChildren();
    for (const size of EXPORT_SIZES) {
      const option = document.createElement('option');
      option.value = size.id;
      option.textContent = size.label;
      els.size.append(option);
    }
    els.size.value = state.sizeId;
  }

  rebuildLayouts();
  rebuildGrades();
  rebuildSizes();
  rebuildTray();
  syncZoom();
  redraw();

  return { redraw, drawClean, rebuildTray, addPhoto, setStatus };
}
