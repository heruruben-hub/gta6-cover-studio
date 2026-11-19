// Entry program for gta6-cover-art-01 (Node 22, standard library only).
//
// The entry itself is the static web app in app/ (open app/index.html in a desktop browser, no
// build step, no network). This program hands it in: it copies app/ and screenshots/ into the
// output directory and writes dossier.json there with buildDossier from the vendored library in
// vendor/makefun-app.ts, which the scorer rebuilds and compares byte for byte, so the options
// below mirror the scorer's own caps: at most 4 screenshots of at most 256 KiB each, at most 993
// files and 48 MiB under app/, no app/ path over 1000 bytes, and the dossier text capped at
// 163,840 bytes.
//
// Try the app locally with `node serve.ts` (http://localhost:8080). Outside the grader's
// container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app, exactly as it sits in the repository.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

// The maker's screenshots of the app and its covers; the first by name is the cover.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier the judge reads, built from the output copy so it describes what was handed in.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
