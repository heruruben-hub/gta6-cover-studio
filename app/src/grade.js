// Colour grades in the Vice City spirit. A grade is baked into an offscreen copy of a photo once
// (a canvas filter pass plus tinted gradient overlays), then the renderer draws crops from that
// copy, so preview and export always match and stay fast.

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset' },
  { id: 'neon', name: 'Neon Nights' },
  { id: 'none', name: 'Clean (no grade)' },
];

const GRADE_RECIPES = {
  sunset: {
    filter: 'saturate(1.28) contrast(1.07) brightness(1.03)',
    washes: [
      { stops: [[0, 'rgba(255, 94, 58, 0.00)'], [0.55, 'rgba(255, 94, 58, 0.10)'], [1, 'rgba(214, 36, 132, 0.34)']], mode: 'source-over' },
      { stops: [[0, 'rgba(255, 176, 92, 0.16)'], [0.5, 'rgba(255, 176, 92, 0.00)']], mode: 'soft-light' },
    ],
  },
  neon: {
    filter: 'saturate(1.45) contrast(1.14) brightness(0.99)',
    washes: [
      { stops: [[0, 'rgba(0, 229, 255, 0.20)'], [0.45, 'rgba(0, 229, 255, 0.00)'], [1, 'rgba(255, 43, 214, 0.30)']], mode: 'source-over' },
      { stops: [[0, 'rgba(120, 60, 255, 0.14)'], [1, 'rgba(120, 60, 255, 0.00)']], mode: 'soft-light' },
    ],
  },
  none: { filter: '', washes: [] },
};

const MAX_GRADE_EDGE = 1600;

/**
 * The photo with a grade baked in, as a canvas. Results are cached on the photo object, keyed by
 * grade id, so switching grades back and forth does not redo the pixel work.
 */
export function gradedCanvas(photo, gradeId) {
  if (!photo.cache) photo.cache = new Map();
  if (photo.cache.has(gradeId)) return photo.cache.get(gradeId);
  const img = photo.img;
  const scale = Math.min(1, MAX_GRADE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const recipe = GRADE_RECIPES[gradeId] ?? GRADE_RECIPES.none;
  if (recipe.filter) ctx.filter = recipe.filter;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.filter = 'none';
  for (const wash of recipe.washes) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    for (const [at, colour] of wash.stops) grad.addColorStop(at, colour);
    ctx.globalCompositeOperation = wash.mode;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  photo.cache.set(gradeId, canvas);
  return canvas;
}
