// The editor's state: which photos are loaded, how they fill the panels, and every lettering and
// grade choice. One plain object, mutated by the editor and read by the renderer.

export const SAMPLE_PHOTOS = [
  { name: 'boulevard', label: 'Boulevard', src: './samples/boulevard.jpg' },
  { name: 'car', label: 'Neon Car', src: './samples/car.jpg' },
  { name: 'boat', label: 'Speedboat', src: './samples/boat.jpg' },
  { name: 'beach', label: 'Beach Air', src: './samples/beach.jpg' },
  { name: 'pier', label: 'Pier', src: './samples/pier.jpg' },
  { name: 'skyline', label: 'Skyline', src: './samples/skyline.jpg' },
];

export const EXPORT_SIZES = [
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1920x1080', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
];

export function sizeById(id) {
  return EXPORT_SIZES.find((size) => size.id === id) ?? EXPORT_SIZES[0];
}

function freshView() {
  return { zoom: 1, ox: 0, oy: 0 };
}

/** A photo record: the loaded image plus its display name. Grade copies cache onto it later. */
export function makePhoto(img, name) {
  return { img, name, cache: null };
}

export function createState() {
  return {
    layoutId: 'vice-grid',
    mode: 'panels',
    photos: [],
    panelPhotos: [0, 1, 2, 3, 4, 5],
    panelViews: [freshView(), freshView(), freshView(), freshView(), freshView(), freshView()],
    spreadPhoto: 0,
    spreadView: freshView(),
    selectedPanel: 0,
    activePhoto: 0,
    caption: 'Vice Heat',
    sub: 'One Last Score',
    captionPos: 'bottom',
    grade: 'sunset',
    lettering: 'white',
    sizeId: '1080x1350',
  };
}

/** Keeps assignments pointing at real photos after the photo list changes size. */
export function clampAssignments(state, panelCount) {
  const count = state.photos.length;
  const pick = (index) => (count === 0 ? -1 : Math.min(Math.max(index, 0), count - 1));
  state.panelPhotos = Array.from({ length: panelCount }, (_, i) => pick(state.panelPhotos[i] ?? i));
  while (state.panelViews.length < panelCount) state.panelViews.push(freshView());
  state.spreadPhoto = pick(state.spreadPhoto);
  state.activePhoto = pick(state.activePhoto);
  state.selectedPanel = Math.min(state.selectedPanel, panelCount - 1);
}
