#!/usr/bin/env node
/**
 * Downloads Pokemon sprites from PokemonDB (Black/White animated) for offline use.
 *
 * IMPORTANT: Ensure compliance with PokemonDB and applicable asset usage terms
 * before running. See DISCLAIMER.md for project policy on assets.
 *
 * Usage: npm run download-sprites
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://img.pokemondb.net/sprites/black-white/anim';
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'sprites');

/** NPC sprites not in pokemon.json */
const NPC_IDS = ['kecleon', 'chansey'];

async function fetchSprite(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function downloadOne(id, variant) {
  const subdir = variant === 'front' ? 'normal' : 'back-normal';
  const url = `${BASE_URL}/${subdir}/${id}.gif`;
  const outPath = join(OUT_DIR, subdir, `${id}.gif`);
  if (existsSync(outPath)) {
    console.log(`  skip ${subdir}/${id}.gif (exists)`);
    return;
  }
  try {
    const buf = await fetchSprite(url);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, buf);
    console.log(`  ok   ${subdir}/${id}.gif`);
  } catch (e) {
    console.error(`  FAIL ${subdir}/${id}.gif: ${e.message}`);
  }
}

async function main() {
  const pokemonPath = join(__dirname, '..', 'src', 'data', 'pokemon.json');
  const pokemon = JSON.parse(readFileSync(pokemonPath, 'utf8'));
  const ids = [...Object.keys(pokemon), ...NPC_IDS];

  console.log(`Downloading sprites for ${ids.length} Pokemon...`);
  mkdirSync(join(OUT_DIR, 'normal'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'back-normal'), { recursive: true });

  for (const id of ids) {
    console.log(id);
    await downloadOne(id, 'front');
    await downloadOne(id, 'back');
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
