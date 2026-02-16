#!/usr/bin/env node
/**
 * Generates optimized PWA icons (192x192 and 512x512) from the favicon design.
 * Run: npm run build:icons
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** Logo scale for app icons (0.7 = 70% of icon, 15% padding each side). Use 0.65 for more padding, 0.75 for less. */
const LOGO_SCALE = 0.7;

// SVG with dark background matching game theme (#0f0f17), diamond + circle in accent (#facc15)
const SVG_TEMPLATE = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f0f17"/>
  <g transform="translate(${size/2}, ${size/2}) scale(${size * LOGO_SCALE / 32}) translate(-16, -16)">
    <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="none" stroke="#facc15" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="16" cy="16" r="5" fill="#facc15"/>
  </g>
</svg>`;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp is required. Run: npm install -D sharp');
    process.exit(1);
  }

  const publicDir = join(root, 'public');
  for (const size of [192, 512]) {
    const svg = Buffer.from(SVG_TEMPLATE(size));
    const outPath = join(publicDir, `icon-${size}.png`);
    await sharp(svg)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
