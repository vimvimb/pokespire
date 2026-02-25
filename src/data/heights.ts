/**
 * National Pokedex numbers for all Pokemon in the game.
 * Used for sorting Pokemon in the PokeDex and Sandbox screens.
 */
export const POKEDEX_NUMBERS: Record<string, number> = {
  bulbasaur: 1,
  ivysaur: 2,
  venusaur: 3,
  charmander: 4,
  charmeleon: 5,
  charizard: 6,
  squirtle: 7,
  wartortle: 8,
  blastoise: 9,
  caterpie: 10,
  butterfree: 12,
  weedle: 13,
  beedrill: 15,
  pidgey: 16,
  pidgeotto: 17,
  pidgeot: 18,
  rattata: 19,
  raticate: 20,
  spearow: 21,
  fearow: 22,
  ekans: 23,
  arbok: 24,
  pikachu: 25,
  raichu: 26,
  sandshrew: 27,
  sandslash: 28,
  "nidoran-f": 29,
  nidorina: 30,
  nidoqueen: 31,
  "nidoran-m": 32,
  nidorino: 33,
  nidoking: 34,
  clefairy: 35,
  clefable: 36,
  vulpix: 37,
  ninetales: 38,
  jigglypuff: 39,
  wigglytuff: 40,
  zubat: 41,
  golbat: 42,
  oddish: 43,
  gloom: 44,
  vileplume: 45,
  paras: 46,
  parasect: 47,
  venonat: 48,
  venomoth: 49,
  meowth: 52,
  persian: 53,
  growlithe: 58,
  arcanine: 59,
  machop: 66,
  machoke: 67,
  machamp: 68,
  gastly: 92,
  haunter: 93,
  gengar: 94,
  drowzee: 96,
  hypno: 97,
  voltorb: 100,
  electrode: 101,
  rhyhorn: 111,
  rhydon: 112,
  kangaskhan: 115,
  electabuzz: 125,
  magmar: 126,
  tauros: 128,
  magikarp: 129,
  gyarados: 130,
  lapras: 131,
  porygon: 137,
  snorlax: 143,
  dratini: 147,
  dragonair: 148,
  dragonite: 149,
  mewtwo: 150,
  chikorita: 152,
  bayleef: 153,
  meganium: 154,
  cyndaquil: 155,
  quilava: 156,
  typhlosion: 157,
  totodile: 158,
  croconaw: 159,
  feraligatr: 160,
  sentret: 161,
  furret: 162,
  hoothoot: 163,
  noctowl: 164,
  ledyba: 165,
  ledian: 166,
  spinarak: 167,
  ariados: 168,
  crobat: 169,
  chinchou: 170,
  lanturn: 171,
  togetic: 176,
  flaaffy: 180,
  ampharos: 181,
  marill: 183,
  azumarill: 184,
  sudowoodo: 185,
  politoed: 186,
  hoppip: 187,
  skiploom: 188,
  jumpluff: 189,
  aipom: 190,
  ambipom: 424,
  sunkern: 191,
  sunflora: 192,
  yanma: 193,
  wooper: 194,
  quagsire: 195,
  espeon: 196,
  umbreon: 197,
  murkrow: 198,
  slowking: 199,
  misdreavus: 200,
  wobbuffet: 202,
  girafarig: 203,
  pineco: 204,
  forretress: 205,
  dunsparce: 206,
  steelix: 208,
  qwilfish: 211,
  scyther: 123,
  scizor: 212,
  horsea: 116,
  seadra: 117,
  heracross: 214,
  sneasel: 215,
  teddiursa: 216,
  ursaring: 217,
  slugma: 218,
  magcargo: 219,
  corsola: 222,
  mantine: 226,
  skarmory: 227,
  houndour: 228,
  houndoom: 229,
  kingdra: 230,
  phanpy: 231,
  donphan: 232,
  porygon2: 233,
  stantler: 234,
  miltank: 241,
  blissey: 242,
  raikou: 243,
  entei: 244,
  suicune: 245,
  larvitar: 246,
  pupitar: 247,
  tyranitar: 248,
  lugia: 249,
  "ho-oh": 250,
  celebi: 251,
  // Cross-gen evolutions (Gen 4 National Dex numbers)
  electivire: 466,
  magmortar: 467,
  "porygon-z": 474,
  // Test-only (e2e)
  arceus: 493,
};

/**
 * Pokemon weights in kg.
 * Used to scale sprites proportionally in battle.
 * Weight works better than height since "height" for snake-like Pokemon is actually length.
 * Pikachu (6kg) is the reference size.
 */
export const POKEMON_WEIGHTS: Record<string, number> = {
  // Starters
  bulbasaur: 6.9,
  ivysaur: 13,
  venusaur: 70, // Real: 100kg, adjusted -30% for sprite scaling
  charmander: 8.5,
  charmeleon: 19,
  charizard: 90.5,
  squirtle: 9,
  wartortle: 9.5, // Real: 22.5, adjusted -25% for sprite scaling
  blastoise: 29.3, // Real: 85.5, adjusted -30% for sprite scaling

  // Others
  pikachu: 11, // Real: 6kg, increased 20% for sprite scaling
  raichu: 30,
  rattata: 3.5,
  raticate: 18.5,
  pidgey: 6, // Real: 1.8kg, increased 50% for sprite scaling
  pidgeotto: 30,
  pidgeot: 39.5,
  ekans: 6.9,
  arbok: 65,
  snorlax: 109, // Real: 460kg, reduced 10% for sprite scaling
  tauros: 88.4,
  kangaskhan: 80,
  mewtwo: 122,

  persian: 16, // Real: 32kg, reduced 20% for sprite scaling

  // Rhyhorn line
  rhyhorn: 26, // Real: 115kg, reduced ~40% for sprite scaling
  rhydon: 46, // Real: 120kg, reduced ~30% for sprite scaling

  // Nidoking line
  "nidoran-m": 5.6, // Real: 9kg, reduced ~5% sprite size
  nidorino: 10, // Real: 19.5kg, reduced ~20% sprite size
  nidoking: 26, // Real: 62kg, reduced 25% for sprite scaling

  // Nidoqueen line
  "nidoran-f": 4.3, // Real: 7kg, reduced ~5% sprite size
  nidorina: 10.2, // Real: 20kg, reduced ~20% sprite size
  nidoqueen: 17, // Real: 60kg, reduced 35% for sprite scaling

  // Drowzee line
  drowzee: 10, // Real: 32.4kg, reduced for sprite scaling
  hypno: 25, // Real: 75.6kg, reduced for sprite scaling

  // Growlithe line
  growlithe: 12, // Real: 19kg, reduced for sprite scaling
  arcanine: 50, // Real: 155kg, reduced for sprite scaling

  // Voltorb line
  voltorb: 10,
  electrode: 12,

  // Caterpie line
  caterpie: 1,
  butterfree: 8, // Real: 32kg, increased for sprite scaling

  // Venonat line
  venonat: 8, // Real: 30kg, reduced for sprite scaling
  venomoth: 12, // Real: 12.5kg, close to real weight

  // Weedle line
  weedle: 3,
  beedrill: 14, // Real: 29.5kg, reduced for sprite scaling

  // Magikarp line
  magikarp: 10,
  gyarados: 235, // Real: 235kg

  // Lapras
  lapras: 80, // Real: 220kg, reduced for sprite scaling

  // Magmar & Electabuzz lines
  magmar: 40, // Real: 44.5kg, reduced for sprite scaling
  magmortar: 60, // Real: 68kg, reduced for sprite scaling
  electabuzz: 28, // Real: 30kg, reduced for sprite scaling
  electivire: 68, // Real: 138.6kg, reduced for sprite scaling, +15% sprite size

  // Dratini line
  dratini: 5.7, // Real: 3.3kg, increased for sprite scaling (+20%)
  dragonair: 16.5, // Real: 16.5kg
  dragonite: 41, // Real: 210kg, reduced for sprite scaling (visually -20%)

  // Spearow line
  spearow: 4, // Real: 2kg, increased for sprite scaling
  fearow: 128, // Real: 38kg, increased for sprite scaling (+80% visual size)

  // Gastly line (ghosts are ~0.1kg real — scaled up to match Nidoking-tier)
  gastly: 9.7, // ~80% of Haunter's size
  haunter: 19, // ~90% of Gengar's size
  gengar: 26, // Same size as Nidoking

  // Sandshrew line
  sandshrew: 6, // Real: 12kg, reduced for sprite scaling (-20%)
  sandslash: 30, // Real: 29.5kg

  // Clefairy line
  clefairy: 4, // Real: 7.5kg, reduced 20% sprite scale
  clefable: 20, // Real: 40kg, reduced 20% sprite scale

  // Machop line
  machop: 10, // Real: 19.5kg, reduced for sprite scaling
  machoke: 33.5, // Real: 70.5kg, adjusted +15% sprite size
  machamp: 53, // Real: 130kg, adjusted +15% sprite size

  // Vulpix line
  vulpix: 10, // Real: 9.9kg
  ninetales: 20, // Real: 19.9kg

  // Oddish line
  oddish: 5, // Real: 5.4kg
  gloom: 9, // Real: 8.6kg
  vileplume: 19, // Real: 18.6kg

  // Meowth line
  meowth: 7, // Real: 4.2kg, increased for visual balance

  // Zubat line
  zubat: 7.5, // Real: 7.5kg
  golbat: 44, // Real: 55kg, +30% sprite size
  crobat: 104, // Real: 75kg, +68% sprite size

  // Porygon line
  porygon: 8, // Real: 36.5kg, reduced for sprite scaling
  porygon2: 11, // Real: 32.5kg, reduced for sprite scaling
  "porygon-z": 10, // Real: 34kg, reduced for sprite scaling

  // Paras line
  paras: 5.4, // Real: 5.4kg
  parasect: 25, // Real: 29.5kg, reduced for sprite scaling

  // Jigglypuff line
  jigglypuff: 5.5, // Real: 5.5kg
  wigglytuff: 35, // Real: 12kg, increased +50% sprite size

  // ── Gen 2 (Johto) ─────────────────────────────────────────────────────────

  // Johto starters
  chikorita: 6.4, // Real 6.4kg → 82px ✓
  bayleef: 15.8, // Real 15.8kg → 106px ✓
  meganium: 45, // Real 100.5kg → 152px (adjusted -55%)
  cyndaquil: 8, // Real 7.9kg → 84px ✓
  quilava: 19, // Real 19kg → 117px ✓
  typhlosion: 55, // Real 79.5kg → 165px (adjusted -30%)
  totodile: 9.5, // Real 9.5kg → 88px ✓
  croconaw: 25, // Real 25kg → 126px ✓
  feraligatr: 60, // Real 88.8kg → 170px (adjusted -32%)

  // Draft/Recruit pool
  sentret: 6, // Real 6kg → 80px ✓
  furret: 22, // Real 32.5kg → 120px (adjusted -32%)
  hoothoot: 15, // Real 21.2kg → 105px (adjusted -29%)
  noctowl: 28, // Real 40.8kg → 128px (adjusted -31%)
  ledyba: 10.8, // Real 10.8kg → 93px ✓
  ledian: 25, // Real 35.6kg → 126px (adjusted -30%)
  spinarak: 8.5, // Real 8.5kg → 85px ✓
  ariados: 22, // Real 33.5kg → 120px (adjusted -34%)
  wooper: 9, // Real 8.5–11kg → 87px ✓
  quagsire: 50, // Real 75kg → 157px (adjusted -33%)
  aipom: 11.5, // Real 11.5kg → 94px ✓
  ambipom: 39, // Real 20.3kg → 141px (scaled up 50% from Aipom for visual presence)
  hoppip: 4, // Real 0.5kg → 67px (increased; too tiny at real weight)
  murkrow: 6, // Real 2.1kg → 80px (increased for visibility)

  // Act 1 enemies — Ilex Forest
  skiploom: 6, // Real 1kg → 80px (increased for visibility)
  jumpluff: 10, // Real 3kg → 93px (increased)
  sunkern: 3, // Real 1.8kg → 63px (slight boost)
  sunflora: 8.5, // Real 8.5kg → 85px ✓
  yanma: 20, // Real 38kg → 119px (adjusted -47%)
  misdreavus: 7, // Real 1kg → 81px (increased; ghost weight misleading)
  sudowoodo: 25, // Real 38kg → 126px (adjusted -34%)
  celebi: 10, // Real 5kg → 93px (boosted; iconic small legendary)

  // Act 2 enemies — Past Johto
  stantler: 38, // Real 71.2kg → 145px (adjusted -47%)
  marill: 6, // Real 8.5kg → 80px (adjusted; small round Pokemon)
  azumarill: 18, // Real 28.5kg → 114px (adjusted -37%)
  flaaffy: 13, // Real 13.3kg → 98px ✓
  ampharos: 42, // Real 61.5kg → 150px (adjusted -32%)
  togetic: 8, // Real 3.2kg → 84px (increased for visibility)
  espeon: 15, // Real 26.5kg → 105px (adjusted; lean and elegant)
  umbreon: 18, // Real 27kg → 114px (adjusted -33%)
  heracross: 38, // Real 54–62.5kg → 145px (adjusted -32%)
  houndour: 11, // Real 10.8kg → 93px ✓
  houndoom: 25, // Real 35kg → 126px (adjusted -29%)
  sneasel: 14, // Real 27–28kg → 101px (adjusted; slim and fast)
  teddiursa: 9, // Real 8.8kg → 87px ✓
  ursaring: 65, // Real 125.8kg → 175px (adjusted -48%)
  larvitar: 18, // Real 72kg → 114px (adjusted; looks small visually)
  pupitar: 38, // Real 152kg → 145px (adjusted -75%)
  tyranitar: 90, // Real 202kg → 197px (approaches cap intentionally)
  miltank: 45, // Real 75.5kg → 152px (adjusted -40%)
  wobbuffet: 20, // Real 28.5kg → 119px (adjusted -30%)
  blissey: 28, // Real 46.8kg → 128px (adjusted -40%)
  pineco: 7, // Real 7.2kg → 81px ✓
  forretress: 42, // Real 125.8kg → 150px (adjusted -67%; compact armored ball)
  steelix: 75, // Real 400–740kg → 183px (adjusted; long snake, weight misleading)
  scyther: 40, // Real 56kg → 145px (adjusted -28%; lean mantis)
  scizor: 48, // Real 118–125kg → 156px (adjusted -60%)
  dunsparce: 14, // Real 14kg → 100px ✓
  girafarig: 30, // Real 41.5kg → 132px (adjusted -28%)

  // Act 3A — Tin Tower (Fiery and Ancient)
  slugma: 10, // Real 35kg → 93px (adjusted; small lava slug)
  magcargo: 20, // Real 55kg → 119px (adjusted -64%)
  phanpy: 18, // Real 33.5kg → 114px (adjusted; small elephant)
  donphan: 55, // Real 120kg → 165px (adjusted -54%)
  skarmory: 35, // Real 50.5kg → 141px (adjusted -31%)
  "ho-oh": 95, // Real 199kg → 198px (adjusted; large legendary bird at cap)

  // Act 3B — Brass Tower (Watery and Mysterious)
  slowking: 42, // Real 79.5kg → 150px (adjusted -47%)
  corsola: 4, // Real 0.5kg → 67px (increased; tiny coral)
  mantine: 75, // Real 220kg → 183px (adjusted -66%; flat manta)
  chinchou: 10, // Real 12kg → 93px (adjusted; small anglerfish)
  lanturn: 19, // Real 22.5kg → 117px (adjusted -16%)
  politoed: 22, // Real 33.9kg → 120px (adjusted -35%)
  qwilfish: 7, // Real 3.9kg → 81px (increased for visibility)
  horsea: 3.4, // Real 8kg → 63px (adjusted -25% sprite size)
  seadra: 10.5, // Real 25kg → 94px (adjusted -25% sprite size)
  kingdra: 62, // Real 152kg → 172px (adjusted -59%)
  lugia: 110, // Real 216kg → 179px (adjusted; large legendary)

  // Legendary Beasts
  raikou: 85, // Real 178kg → 193px (adjusted; large electric cat)
  entei: 90, // Real 198kg → 197px (adjusted; large fire hound)
  suicune: 85, // Real 187kg → 193px (adjusted; large water beast)

  // Test-only (e2e)
  arceus: 100, // Real 320kg → 200px (adjusted; large God Pokemon)
};

// Reference Pokemon and base sprite size
const REFERENCE_WEIGHT = 6; // Pikachu's weight in kg
const BASE_SPRITE_SIZE = 80; // Pikachu's sprite size in pixels

/** Maximum sprite size in the battle grid. If any Pokemon exceeds this,
 *  ALL sprites are scaled down proportionally to preserve size ratios. */
export const MAX_BATTLE_SPRITE_SIZE = 200;

/** Boss Pokemon that should appear much larger in battle.
 *  Multiplier is applied to the individual boss sprite size. */
const BOSS_SPRITE_MULTIPLIER: Record<string, number> = {
  lugia: 3.0,
  "ho-oh": 1.5,
};

/** Per-boss pixel offsets to fine-tune positioning (x = right, y = up). */
const BOSS_SPRITE_OFFSET: Record<string, { x: number; y: number }> = {
  lugia: { x: 120, y: -180 },
  "ho-oh": { x: 60, y: -80 },
};

/**
 * Calculate sprite size for a Pokemon based on its weight.
 * Uses cube root scaling since weight scales with volume (length^3).
 * This gives a more natural size progression.
 * Returns the NATURAL (uncapped) size — callers in the battle grid
 * should apply the proportional scale from `getBattleSpriteScale`.
 */
export function getSpriteSize(pokemonId: string): number {
  const weight = POKEMON_WEIGHTS[pokemonId] ?? REFERENCE_WEIGHT;
  // Cube root scaling: weight ~ volume ~ size^3, so size ~ weight^(1/3)
  const scale = Math.cbrt(weight / REFERENCE_WEIGHT);
  return Math.round(BASE_SPRITE_SIZE * scale);
}

/**
 * Compute a global sprite scale factor for a battle.
 * Scales all sprites so the largest Pokemon fills MAX_BATTLE_SPRITE_SIZE.
 * Can scale both UP (all small pokemon) and DOWN (one giant pokemon).
 * This preserves relative size ratios (Snorlax stays ~2.6x Pikachu).
 */
export function getBattleSpriteScale(pokemonIds: string[]): number {
  if (pokemonIds.length === 0) return 1;
  const maxNatural = Math.max(...pokemonIds.map((id) => getSpriteSize(id)));
  return MAX_BATTLE_SPRITE_SIZE / maxNatural;
}

/** Get per-Pokemon boss sprite multiplier.
 *  Returns > 1 for boss Pokemon so they render larger than the normal cap. */
export function getBossSpriteMultiplier(pokemonId: string): number {
  return BOSS_SPRITE_MULTIPLIER[pokemonId] ?? 1;
}

/** Get per-Pokemon boss sprite pixel offset { x, y } for positioning.
 *  x = shift right (px), y = shift up (negative = up). */
export function getBossSpriteOffset(pokemonId: string): {
  x: number;
  y: number;
} {
  return BOSS_SPRITE_OFFSET[pokemonId] ?? { x: 0, y: 0 };
}
