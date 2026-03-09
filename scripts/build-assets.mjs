#!/usr/bin/env node
/**
 * Asset compression pipeline.
 *
 * Converts raw assets in assets-src/ into production-ready files in assets/:
 *   - Backgrounds: PNG → JPEG (quality ~85), JPG → copy
 *   - Music: normalize (EBU R128) + mono + 64 kbps MP3
 *   - Sounds: copy as-is (already small)
 *
 * Idempotent — skips files whose output is newer than the source.
 * Requires ffmpeg on PATH.
 *
 * Usage: node scripts/build-assets.mjs
 */

import { execSync } from 'child_process';
import { readdirSync, mkdirSync, statSync, copyFileSync } from 'fs';
import { join, extname, basename } from 'path';

const SRC = 'assets-src';
const OUT = 'assets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

/** Return true if output exists and is at least as new as source. */
function isUpToDate(src, out) {
  try {
    return statSync(out).mtimeMs >= statSync(src).mtimeMs;
  } catch {
    return false;
  }
}

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

// ---------------------------------------------------------------------------
// Check ffmpeg
// ---------------------------------------------------------------------------

try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
} catch {
  console.error('Error: ffmpeg is required but not found on PATH.');
  console.error('Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Backgrounds: PNG → JPEG, JPG → copy
// ---------------------------------------------------------------------------

const bgSrc = join(SRC, 'backgrounds');
const bgOut = join(OUT, 'backgrounds');
ensureDir(bgOut);

console.log('\n=== Backgrounds ===');
for (const file of readdirSync(bgSrc)) {
  const src = join(bgSrc, file);
  const ext = extname(file).toLowerCase();

  if (ext === '.png') {
    const outFile = join(bgOut, basename(file, '.png') + '.jpg');
    if (isUpToDate(src, outFile)) {
      console.log(`  [skip] ${file}`);
      continue;
    }
    console.log(`  [build] ${file} → JPEG`);
    run(`ffmpeg -i "${src}" -q:v 3 -y "${outFile}"`);
  } else if (ext === '.jpg' || ext === '.jpeg') {
    const outFile = join(bgOut, file);
    if (isUpToDate(src, outFile)) {
      console.log(`  [skip] ${file}`);
      continue;
    }
    console.log(`  [copy] ${file}`);
    copyFileSync(src, outFile);
  }
}

// ---------------------------------------------------------------------------
// Music: normalize + mono + 64 kbps
//
// Combines EBU R128 loudness normalization (from AUDIO.md) with mono downmix
// and bitrate reduction in a single ffmpeg pass.
//
// Parameters:
//   loudnorm I=-16   Integrated loudness target (LUFS)
//   TP=-1.5          True peak limit (dBFS) — prevents clipping
//   LRA=11           Loudness range (dynamic range)
//   -ac 1            Mono downmix (game music on phone speakers)
//   -b:a 64k         64 kbps bitrate
// ---------------------------------------------------------------------------

const musicSrc = join(SRC, 'music');
const musicOut = join(OUT, 'music');
ensureDir(musicOut);

console.log('\n=== Music ===');
for (const file of readdirSync(musicSrc)) {
  const src = join(musicSrc, file);
  const ext = extname(file).toLowerCase();
  if (ext !== '.mp3' && ext !== '.wav') continue;

  // Output is always .mp3
  const outFile = join(musicOut, basename(file, ext) + '.mp3');
  if (isUpToDate(src, outFile)) {
    console.log(`  [skip] ${file}`);
    continue;
  }
  console.log(`  [build] ${file} → mono 64k normalized MP3`);
  // -vn strips embedded artwork/video streams that inflate file size
  run(`ffmpeg -i "${src}" -vn -ac 1 -b:a 64k -af loudnorm=I=-16:TP=-1.5:LRA=11 -y "${outFile}"`);
}

// ---------------------------------------------------------------------------
// Sounds: copy as-is (already small, ~1 MB total)
// ---------------------------------------------------------------------------

const soundsSrc = join(SRC, 'sounds');
const soundsOut = join(OUT, 'sounds');
ensureDir(soundsOut);

console.log('\n=== Sounds ===');
for (const file of readdirSync(soundsSrc)) {
  const src = join(soundsSrc, file);
  if (extname(file).toLowerCase() !== '.mp3') continue;

  const outFile = join(soundsOut, file);
  if (isUpToDate(src, outFile)) {
    console.log(`  [skip] ${file}`);
    continue;
  }
  console.log(`  [copy] ${file}`);
  copyFileSync(src, outFile);
}

console.log('\nDone.\n');
