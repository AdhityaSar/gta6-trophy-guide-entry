// main.ts — build the make.fun dossier for the GTA VI trophy guide entry.
// Run directly with `node main.ts` (Node 22, no install, no flags, stdlib only).
//
// It copies app/ and screenshots/ from the repository into MAKEFUN_OUTPUT_DIR
// (default /output), then writes dossier.json there by calling buildDossier
// from ./vendor/makefun-frontend.ts.

import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The output directory is chosen by MAKEFUN_OUTPUT_DIR, defaulting to /output.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
// The repository root is the directory this file lives in.
const root = fileURLToPath(new URL('.', import.meta.url));

// Empty the output directory without removing it: the grader hands us a
// directory it owns, and unlinking that directory itself fails with EPERM
// while everything inside it is ours to clear. Clearing the entries still
// makes two runs byte-identical, so a stale copy of an earlier run cannot
// leak into the dossier.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

// Copy the static app and the screenshots verbatim (no build step at serve time).
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The dossier is canonical JSON: buildDossier reads app/ and screenshots/ and
// returns the exact bytes the scorer will compare against.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
