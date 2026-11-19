// The cover renderer: one function draws the whole poster (panels, photos, grade, white poster
// borders, caption lettering) onto any 2D context at any size, so the on-screen preview and the
// exported PNG are the same drawing. Editor-only marks (the selected panel outline) are opt-in.

import { layoutById, panelRects } from './layouts.js';
import { gradedCanvas } from './grade.js';

const PAPER = '#f4efe4';
const TITLE_FONT = 'Anton';
const SUB_FONT = 'Archivo Black';

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

/** Where a photo lands inside an area: cover-fit scaled by view.zoom, centred, then panned. */
function placement(imgW, imgH, area, view) {
  const base = Math.max(area.w / imgW, area.h / imgH);
  const scale = base * Math.max(1, view.zoom);
  const dw = imgW * scale;
  const dh = imgH * scale;
  const maxOx = Math.max(0, (dw - area.w) / 2);
  const maxOy = Math.max(0, (dh - area.h) / 2);
  const ox = clamp(view.ox * area.w, -maxOx, maxOx);
  const oy = clamp(view.oy * area.h, -maxOy, maxOy);
  return { dx: area.x + (area.w - dw) / 2 + ox, dy: area.y + (area.h - dh) / 2 + oy, dw, dh };
}

function drawPhotoInto(ctx, photo, gradeId, area, view) {
  const art = gradedCanvas(photo, gradeId);
  const spot = placement(art.width, art.height, area, view);
  ctx.drawImage(art, spot.dx, spot.dy, spot.dw, spot.dh);
}

function drawPlaceholder(ctx, rect, h) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#2a1140');
  grad.addColorStop(1, '#571b54');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(2, h * 0.004);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2 - h * 0.02;
  const arm = h * 0.028;
  ctx.beginPath();
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm, cy);
  ctx.moveTo(cx, cy - arm);
  ctx.lineTo(cx, cy + arm);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `${Math.round(h * 0.026)}px ${TITLE_FONT}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', cx, cy + h * 0.055);
  ctx.restore();
}

function titleFill(ctx, lettering, y0, y1) {
  if (lettering === 'sunset') {
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, '#ffd76a');
    grad.addColorStop(0.55, '#ff7a3d');
    grad.addColorStop(1, '#ff2e88');
    return grad;
  }
  if (lettering === 'neon') {
    const grad = ctx.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, '#8ff8ff');
    grad.addColorStop(0.5, '#29c8ff');
    grad.addColorStop(1, '#ff2bd6');
    return grad;
  }
  return '#ffffff';
}

/** Splits the caption into one or two lines and shrinks the size until every line fits maxW. */
function fitTitle(ctx, text, maxW, startSize) {
  let size = startSize;
  const setFont = () => { ctx.font = `${Math.round(size)}px ${TITLE_FONT}, sans-serif`; };
  setFont();
  if (ctx.measureText(text).width <= maxW) return { lines: [text], size };
  const words = text.split(/\s+/).filter(Boolean);
  let lines = [text];
  if (words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const widest = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || widest < best.widest) best = { lines: [a, b], widest };
    }
    lines = best.lines;
  }
  while (size > 14 && lines.some((line) => ctx.measureText(line).width > maxW)) {
    size *= 0.94;
    setFont();
  }
  return { lines, size };
}

function drawCaption(ctx, state, w, h) {
  const title = (state.caption || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  if (!title && !sub) return;
  const atBottom = state.captionPos !== 'top';
  ctx.save();
  // A soft scrim so the lettering reads over any photo.
  const scrimH = h * 0.46;
  const scrim = atBottom
    ? ctx.createLinearGradient(0, h - scrimH, 0, h)
    : ctx.createLinearGradient(0, 0, 0, scrimH);
  if (atBottom) {
    scrim.addColorStop(0, 'rgba(22, 2, 20, 0)');
    scrim.addColorStop(1, 'rgba(22, 2, 20, 0.66)');
  } else {
    scrim.addColorStop(0, 'rgba(22, 2, 20, 0.66)');
    scrim.addColorStop(1, 'rgba(22, 2, 20, 0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, atBottom ? h - scrimH : 0, w, scrimH);

  const maxW = w * 0.92;
  const fitted = title ? fitTitle(ctx, title, maxW, h * 0.118) : { lines: [], size: h * 0.118 };
  const titleSize = fitted.size;
  const lineH = titleSize * 1.05;
  const subSize = Math.round(h * 0.031);
  const gap = h * 0.018;
  const accentH = Math.max(4, h * 0.007);
  const blockH = fitted.lines.length * lineH + (sub ? subSize + gap : 0) + accentH + gap;
  const blockTop = atBottom ? h * 0.972 - blockH : h * 0.028;
  let cursor = blockTop;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (sub) {
    ctx.font = `${subSize}px ${SUB_FONT}, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch { /* older engines */ }
    ctx.lineWidth = Math.max(2, subSize * 0.14);
    ctx.strokeStyle = 'rgba(18, 4, 16, 0.85)';
    ctx.fillStyle = '#ffe3ae';
    const subY = cursor + subSize;
    ctx.strokeText(sub, w / 2, subY);
    ctx.fillText(sub, w / 2, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
    cursor += subSize + gap;
  }
  const accent = ctx.createLinearGradient(w * 0.07, 0, w * 0.93, 0);
  accent.addColorStop(0, '#ff2bd6');
  accent.addColorStop(0.5, '#ff7a3d');
  accent.addColorStop(1, '#ffd76a');
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.07, cursor, w * 0.86, accentH);
  cursor += accentH + gap;

  if (title) {
    ctx.font = `${Math.round(titleSize)}px ${TITLE_FONT}, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = titleSize * 0.15;
    ctx.strokeStyle = 'rgba(16, 5, 18, 0.92)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowOffsetX = titleSize * 0.045;
    ctx.shadowOffsetY = titleSize * 0.055;
    ctx.fillStyle = titleFill(ctx, state.lettering, cursor, cursor + fitted.lines.length * lineH);
    fitted.lines.forEach((line, i) => {
      const y = cursor + titleSize + i * lineH;
      ctx.strokeText(line, w / 2, y);
      ctx.fillText(line, w / 2, y);
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.restore();
}

/**
 * Draws the full cover described by state onto ctx at w x h.
 * opts.editor adds the selected-panel outline used by the on-screen preview only.
 */
export function drawCover(ctx, state, w, h, opts = {}) {
  const layout = layoutById(state.layoutId);
  const rects = panelRects(layout, w, h);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const frame = Math.round(w * 0.014);
  const inner = { x: frame, y: frame, w: w - frame * 2, h: h - frame * 2 };

  rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (state.mode === 'spread') {
      const photo = state.photos[state.spreadPhoto];
      if (photo) drawPhotoInto(ctx, photo, state.grade, inner, state.spreadView);
      else drawPlaceholder(ctx, rect, h);
    } else {
      const photo = state.photos[state.panelPhotos[i]];
      if (photo) drawPhotoInto(ctx, photo, state.grade, rect, state.panelViews[i]);
      else drawPlaceholder(ctx, rect, h);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(20, 8, 24, 0.20)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  });

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vignette.addColorStop(0, 'rgba(12, 0, 18, 0)');
  vignette.addColorStop(1, 'rgba(12, 0, 18, 0.20)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  drawCaption(ctx, state, w, h);

  if (opts.editor && state.mode === 'panels' && rects[state.selectedPanel]) {
    const rect = rects[state.selectedPanel];
    ctx.save();
    ctx.strokeStyle = '#ffd23d';
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.setLineDash([w * 0.012, w * 0.008]);
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    ctx.restore();
  }
}

/** Renders the cover to a fresh canvas at an exact export size. */
export function renderCoverCanvas(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), state, w, h);
  return canvas;
}
