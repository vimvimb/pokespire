# Audio & Media Asset Pipeline

## Overview

Raw/original assets live in `assets-src/`. A build script compresses them into production-ready files in `assets/` (backgrounds, music, sounds). The generated `assets/` directories are gitignored — only `assets-src/` is committed.

## Running the Pipeline

```bash
npm run build:assets
```

This is also run automatically as part of `npm run build`. Requires **ffmpeg** on PATH.

The script is **idempotent** — it skips files whose output is already newer than the source.

## What It Does

### Backgrounds (`assets-src/backgrounds/` → `assets/backgrounds/`)
- PNG → JPEG at quality ~85 (`-q:v 3`)
- JPG → copied as-is
- Reduces ~28 MB of PNGs to ~4 MB of JPEGs

### Music (`assets-src/music/` → `assets/music/`)
- EBU R128 loudness normalization + mono downmix + 64 kbps MP3
- Single ffmpeg pass: `-ac 1 -b:a 64k -af loudnorm=I=-16:TP=-1.5:LRA=11`
- Reduces ~62 MB to ~37 MB

### Sounds (`assets-src/sounds/` → `assets/sounds/`)
- Copied as-is (already small, ~1 MB total)

## Normalization Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `I=-16` | -16 LUFS | Integrated loudness target (streaming/YouTube standard) |
| `TP=-1.5` | -1.5 dBFS | True peak limit — prevents clipping |
| `LRA=11` | 11 LU | Loudness range — controls dynamic range |
| `-ac 1` | Mono | Phone speakers don't benefit from stereo |
| `-b:a 64k` | 64 kbps | Sufficient quality for game background music |

## Adding New Tracks

1. Place the source file in `assets-src/music/` (MP3 or WAV)
2. Run `npm run build:assets`
3. Import the output from `assets/music/` in your TypeScript code
4. Add the track to `MUSIC_URLS` in `src/ui/utils/music.ts`

## Adding New Backgrounds

1. Place the source PNG/JPG in `assets-src/backgrounds/`
2. Run `npm run build:assets`
3. Import the output `.jpg` from `assets/backgrounds/` in your TypeScript code
