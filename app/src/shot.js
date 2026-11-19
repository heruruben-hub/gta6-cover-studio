// Screenshot automation: the maker drives the app with query parameters to capture honest
// screenshots of real covers and of the editor at work, for example
//   ?shot=cover&size=1920x1080&photos=car,boulevard,boat,beach,pier,skyline&caption=Neon%20Shores
//   ?shot=editor&photos=boulevard,car,boat,beach,pier,skyline&caption=Vice%20Heat
// Nothing here changes what a person can do in the editor; it only sets the same state.

import { layoutById } from './layouts.js';
import { SAMPLE_PHOTOS, clampAssignments, sizeById } from './state.js';

/** Applies the query parameters to the state. Returns the shot kind, or '' for a normal visit. */
export function applyShotParams(state, params, photosByName) {
  const shot = params.get('shot') ?? '';
  if (!shot) return '';

  const wanted = (params.get('photos') ?? '').split(',').map((name) => name.trim()).filter(Boolean);
  if (wanted.length) {
    const ordered = wanted.map((name) => photosByName.get(name)).filter(Boolean);
    if (ordered.length) {
      state.photos = ordered;
      state.panelPhotos = ordered.map((_, i) => i);
      state.spreadPhoto = 0;
      state.activePhoto = 0;
    }
  }
  const assign = (params.get('assign') ?? '').split(',').map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (assign.length) state.panelPhotos = assign;
  // view=<panel>:<ox>:<oy>:<zoom>;<panel>:... pans and zooms individual panels, as a drag would.
  for (const spec of (params.get('view') ?? '').split(';')) {
    const [index, ox, oy, zoom] = spec.split(':').map(Number);
    if (Number.isFinite(index) && state.panelViews[index]) {
      if (Number.isFinite(ox)) state.panelViews[index].ox = ox;
      if (Number.isFinite(oy)) state.panelViews[index].oy = oy;
      if (Number.isFinite(zoom)) state.panelViews[index].zoom = zoom;
    }
  }
  if (params.get('layout')) state.layoutId = params.get('layout');
  if (params.get('mode')) state.mode = params.get('mode');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('lettering')) state.lettering = params.get('lettering');
  if (params.get('caption') !== null) state.caption = params.get('caption');
  if (params.get('sub') !== null) state.sub = params.get('sub');
  if (params.get('pos')) state.captionPos = params.get('pos');
  if (params.get('size') && sizeById(params.get('size'))) state.sizeId = params.get('size');
  if (params.get('spread')) {
    const index = state.photos.findIndex((photo) => photo.name.toLowerCase() === params.get('spread').toLowerCase());
    if (index >= 0) state.spreadPhoto = index;
  }
  clampAssignments(state, layoutById(state.layoutId).panels.length);
  return shot;
}

/** In cover shot mode the page is only the cover, edge to edge: the exported art itself. */
export function enterCoverShotMode() {
  document.body.classList.add('cover-only');
  document.title = 'Cover';
}
