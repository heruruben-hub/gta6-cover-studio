# Vice Panels — GTA-Style Cover Maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/heruruben-hub/gta6-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/heruruben-hub/gta6-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Vice Panels** turns your photos into a multi-panel cover poster in the GTA style: a collage of
photo panels with white poster borders, bold caption lettering and a Vice City colour grade —
exported as a PNG in the sizes posts actually use.

It is a static web app under `app/` with no build step and no network calls: open it, add photos,
arrange them, type a caption, export. Your photos are read on your own machine and never uploaded.

## What it does

- **Five collage layouts** — Vice Grid (6 panels), Hero + Side Stack, Wide Top + Pair, Beach
  Strips and Quad — all drawn with the white frame and panel gutters of a game poster.
- **Any photos, your way** — load photos from your machine (or drag them onto the page), click a
  photo then a panel to place it, drag on the cover to reposition, scroll or use the slider to
  zoom and crop. *One photo spread* mode stretches a single photo across every panel instead.
- **Caption lettering** — an Anton headline with a hard poster outline and an Archivo Black kicker
  line, in poster white, a sunset gradient or a neon gradient, at the top or bottom of the cover.
- **Colour grades** — Vice Sunset and Neon Nights are baked into each photo before it is drawn;
  a clean ungraded look is one click away.
- **Real export sizes** — one click exports a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.
  The live preview is drawn by the same renderer at the same size, so what you see is the file
  you get.
- **Samples included** — six photos made with an image model (a boulevard at sunset, a neon
  sports car, a speedboat, a beach from the air, a pier, a skyline at dusk) so the first cover
  takes seconds.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

or serve the `app/` folder with any static file server and open `index.html` in a desktop
browser. Everything the page loads — scripts, styles, fonts, samples — is a file in `app/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`
with `buildDossier` from `vendor/makefun-app.ts` (the kit's library, unchanged).

## How it is built

- `app/src/layouts.js` — the five panel layouts, as fractions of the cover so they fit every size.
- `app/src/grade.js` — the colour grades, baked into an offscreen copy of each photo once.
- `app/src/render.js` — the one renderer behind both preview and export: panels, crops, grades,
  poster borders, vignette and caption lettering.
- `app/src/editor.js` — the control panel, photo tray, canvas gestures and PNG export.
- `app/src/shot.js` — query-parameter scenes the maker uses to take this entry's screenshots.
- Fonts: Anton and Archivo Black, both under the SIL Open Font License 1.1 (license texts in
  `app/fonts/`). No Rockstar or GTA logo, artwork, character or font is used anywhere; the look
  is an original homage drawn from the app's own code and the user's own photos.

## Screenshots

- `screenshots/1-cover.jpg` — a landscape cover (1920 × 1080) exported by the app.
- `screenshots/2-editor.jpg` — the editor with the sample photos loaded and a cover in progress.
- `screenshots/3-cover.jpg` — a portrait cover (1080 × 1350).
- `screenshots/4-cover.jpg` — a square cover (1080 × 1080) in one-photo spread mode, neon grade.

Entered on [make.fun](https://make.fun/?ref=kh6903y0&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards
