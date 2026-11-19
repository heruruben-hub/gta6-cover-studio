// Panel layouts for the cover collage. Every layout is a list of rectangles in fractions of the
// cover (x, y, w, h between 0 and 1) that tile the whole canvas, so the same layout works at
// 1080 x 1080, 1080 x 1350 and 1920 x 1080. The first panel is the hero panel.

export const LAYOUTS = [
  {
    id: 'vice-grid',
    name: 'Vice Grid · 6 panels',
    panels: [
      { x: 0.00, y: 0.00, w: 0.58, h: 0.52 },
      { x: 0.58, y: 0.00, w: 0.42, h: 0.30 },
      { x: 0.58, y: 0.30, w: 0.42, h: 0.22 },
      { x: 0.00, y: 0.52, w: 0.34, h: 0.48 },
      { x: 0.34, y: 0.52, w: 0.33, h: 0.48 },
      { x: 0.67, y: 0.52, w: 0.33, h: 0.48 },
    ],
  },
  {
    id: 'hero-side',
    name: 'Hero + Side Stack · 3 panels',
    panels: [
      { x: 0.00, y: 0.00, w: 0.62, h: 1.00 },
      { x: 0.62, y: 0.00, w: 0.38, h: 0.52 },
      { x: 0.62, y: 0.52, w: 0.38, h: 0.48 },
    ],
  },
  {
    id: 'duo-stack',
    name: 'Wide Top + Pair · 3 panels',
    panels: [
      { x: 0.00, y: 0.00, w: 1.00, h: 0.55 },
      { x: 0.00, y: 0.55, w: 0.50, h: 0.45 },
      { x: 0.50, y: 0.55, w: 0.50, h: 0.45 },
    ],
  },
  {
    id: 'strips',
    name: 'Beach Strips · 4 panels',
    panels: [
      { x: 0.00, y: 0.00, w: 0.25, h: 1.00 },
      { x: 0.25, y: 0.00, w: 0.25, h: 1.00 },
      { x: 0.50, y: 0.00, w: 0.25, h: 1.00 },
      { x: 0.75, y: 0.00, w: 0.25, h: 1.00 },
    ],
  },
  {
    id: 'quad',
    name: 'Quad · 4 panels',
    panels: [
      { x: 0.00, y: 0.00, w: 0.50, h: 0.50 },
      { x: 0.50, y: 0.00, w: 0.50, h: 0.50 },
      { x: 0.00, y: 0.50, w: 0.50, h: 0.50 },
      { x: 0.50, y: 0.50, w: 0.50, h: 0.50 },
    ],
  },
];

/** The layout object for an id, or the first layout when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

/** Panel rectangles in pixels for a canvas of w x h, inside the white poster frame. */
export function panelRects(layout, w, h) {
  const frame = Math.round(w * 0.014);
  const gap = Math.max(4, Math.round(w * 0.007));
  const innerW = w - frame * 2;
  const innerH = h - frame * 2;
  return layout.panels.map((p) => {
    const x = frame + p.x * innerW;
    const y = frame + p.y * innerH;
    const pw = p.w * innerW;
    const ph = p.h * innerH;
    return {
      x: x + gap / 2,
      y: y + gap / 2,
      w: pw - gap,
      h: ph - gap,
      fx: p.x,
      fy: p.y,
      fw: p.w,
      fh: p.h,
    };
  });
}

/** Index of the panel under a point given in fractions of the cover, or -1. */
export function panelAt(layout, fx, fy) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) return i;
  }
  return -1;
}
