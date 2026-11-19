// Build entry: copy app/ and screenshots/ into MAKEFUN_OUTPUT_DIR (default /output),
// then write dossier.json there via the kit's buildDossier.
//
// Grader constraints honoured here:
//   1. The grader runs this as an unprivileged user in a container whose root filesystem
//      is read-only, with /output (MAKEFUN_OUTPUT_DIR) the only writable mount. So we must
//      empty the output directory's CONTENTS and then mkdirSync it, never rmSync the
//      directory itself — rmSync on the directory fails with EPERM on a read-only mount.
//   2. The grader runs this program twice and requires both runs to write identical bytes,
//      so every copy and the dossier must be deterministic (no timestamps, no ordering drift).

import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The source directory of the entry (this repository's root).
const root = process.cwd();

// The destination directory, from the environment or the default.
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Empty the output directory's contents, then ensure the directory exists.
// Never remove the directory itself: on the grader's read-only root, rmSync(outDir)
// would try to unlink the mount point and fail with EPERM.
try {
  for (const entry of readdirSync(outDir)) {
    rmSync(join(outDir, entry), { recursive: true, force: true });
  }
} catch {
  // The directory may not exist on the first run; create it below.
}
mkdirSync(outDir, { recursive: true });

// Copy every file under app/ and screenshots/, preserving the relative paths,
// in a deterministic order (sorted) so repeated runs write identical trees.
// `name` is the destination subdirectory ("app" or "screenshots").
function copyTree(srcDir: string, name: string): void {
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
    return out;
  };
  mkdirSync(join(outDir, name), { recursive: true });
  for (const src of walk(srcDir)) {
    const rel = src.slice(srcDir.length + 1);
    const relSegs = rel.split(/[\\/]/);
    if (relSegs.length > 1) {
      mkdirSync(join(outDir, name, relSegs.slice(0, -1).join('/')), { recursive: true });
    }
    copyFileSync(src, join(outDir, name, rel));
  }
}

copyTree(join(root, 'app'), 'app');
copyTree(join(root, 'screenshots'), 'screenshots');

// Write the dossier. The caps mirror the bounty's gate: a 160 KiB text budget, at most
// 4 screenshots of at most 256 KiB each (the brief ships four), and app/ bounded to
// 993 files / 16 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
