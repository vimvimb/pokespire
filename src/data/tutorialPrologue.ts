/**
 * Tutorial Prologue: "The Proving Grounds"
 *
 * A 4-battle prologue campaign that teaches positioning, switching, enemy intents,
 * type effectiveness, and the full toolkit of player options.
 *
 * Entry point: Debugging menu button.
 * All battles use skipShuffle for deterministic card draw order.
 */

import type { PokemonData, Position } from "../engine/types";
import type { TutorialStep } from "./tutorial";
import { getPokemon } from "./loaders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrologueNodeId = "spawn" | "node1" | "node2" | "node3" | "node4" | "complete";

export interface PrologueDialogueLine {
  /** Unique key for React lists */
  id: string;
  /** Handler's message text */
  text: string;
}

export interface PrologueNodeDef {
  id: PrologueNodeId;
  /** Display label */
  label: string;
  /** Player Pokemon IDs for this node (used to build custom PokemonData) */
  playerIds: string[];
  /** Enemy Pokemon configs for this node */
  enemies: PrologueEnemyConfig[];
  /** Player positions on the grid */
  playerPositions: Position[];
  /** Enemy positions on the grid */
  enemyPositions: Position[];
  /** Custom player decks (one per player Pokemon, in order) */
  playerDecks: string[][];
  /** In-battle tutorial tooltip steps (shown during combat via TutorialOverlay) */
  battleSteps: TutorialStep[];
  /** Post-victory handler dialogue line */
  postVictoryDialogue: string;
  /** HP overrides: map of "side-slotIndex" to hp value (e.g., "player-0" → 25) */
  hpOverrides?: Record<string, number>;
  /** Enemy passives: map of slot index to passive IDs */
  enemyPassives?: Record<number, string[]>;
}

export interface PrologueEnemyConfig {
  /** Base Pokemon ID to look up in pokemon.json */
  pokemonId: string;
  /** Override stats */
  maxHp: number;
  baseSpeed: number;
  energyPerTurn: number;
  handSize: number;
  /** Custom deck */
  deck: string[];
  /** Override types (optional, defaults to base Pokemon types) */
  types?: string[];
}

// ---------------------------------------------------------------------------
// Handler dialogue for the spawn node (no combat)
// ---------------------------------------------------------------------------

export const SPAWN_DIALOGUE: PrologueDialogueLine[] = [
  {
    id: "spawn-1",
    text: "We've got a Rocket relay northeast of Celadon. Small crew. Clear it out and you're on the facility op.",
  },
  {
    id: "spawn-2",
    text: "I'm sending Growlithe with you first — he's reliable.",
  },
];

// ---------------------------------------------------------------------------
// Node 1: "First Steps" — 1v1 vs Rattata
// ---------------------------------------------------------------------------

const NODE1_GROWLITHE_DECK = [
  "fire-spin", "fire-spin", "defend", "defend", "defend",
  "flame-wheel", "fire-spin", "defend", "fire-fang", "roar",
];

const NODE1_RATTATA_DECK = [
  "tackle", "tackle", "tackle", "tackle", "tackle", "tackle",
];

export const NODE1: PrologueNodeDef = {
  id: "node1",
  label: "First Steps",
  playerIds: ["growlithe"],
  enemies: [{
    pokemonId: "rattata",
    maxHp: 20,
    baseSpeed: 8,
    energyPerTurn: 2,
    handSize: 4,
    deck: NODE1_RATTATA_DECK,
  }],
  playerPositions: [{ row: "front", column: 0 }],
  enemyPositions: [{ row: "front", column: 0 }],
  playerDecks: [NODE1_GROWLITHE_DECK],
  battleSteps: [
    {
      id: 1, highlight: "battlefield",
      text: () => "Your Growlithe vs a Rattata. Knock it out!",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 2, highlight: "hand",
      text: () => "These are your cards — your moves for this turn.",
      advanceCondition: "manual", zone: "bottom",
    },
    {
      id: 3, highlight: "energy",
      text: () => "Each card costs energy. You start with 3.",
      advanceCondition: "manual", zone: "bottom",
    },
    {
      id: 4, highlight: "attack_cards",
      text: () => "Play an attack card! Click it to send it at the Rattata.",
      advanceCondition: "play_attack", zone: "bottom", allowInteraction: true,
    },
    {
      id: 5, highlight: null,
      text: () => "Nice hit! Play more cards while you have energy.",
      advanceCondition: "play_any_card", zone: "bottom", allowInteraction: true,
    },
    {
      id: 6, highlight: "defend_cards",
      text: () => "Tip: Protect gives Block, which absorbs damage.",
      advanceCondition: "play_defend", zone: "bottom", allowSkip: true, allowInteraction: true,
    },
    {
      id: 7, highlight: "end_turn",
      text: () => "You can end your turn early. Energy rolls over to next turn — unused cards don't.",
      advanceCondition: "end_turn", zone: "bottom", allowInteraction: true,
    },
    {
      id: 8, highlight: null,
      text: () => "Now the enemy attacks. Watch your HP.",
      advanceCondition: "enemy_turn_done", zone: "bottom", allowInteraction: true,
    },
    {
      id: 9, highlight: null,
      text: () => "You've got the basics. Finish this fight!",
      advanceCondition: "manual", zone: "bottom",
    },
  ],
  postVictoryDialogue: "Good. Moving on.",
};

// ---------------------------------------------------------------------------
// Node 2: "Know Your Enemy" — 2v1 vs Zubat
// ---------------------------------------------------------------------------

const NODE2_GASTLY_DECK = [
  "shadow-punch", "shadow-punch", "defend", "confuse-ray",
  "confuse-ray", "lick", "shadow-punch", "shadow-punch",
];

const NODE2_GROWLITHE_DECK = NODE1_GROWLITHE_DECK; // Same deck

const NODE2_ZUBAT_DECK = [
  "bite", "gust", "gust", "defend", "gust", "defend", "gust", "gust",
];

export const NODE2: PrologueNodeDef = {
  id: "node2",
  label: "Know Your Enemy",
  playerIds: ["growlithe", "gastly"],
  enemies: [{
    pokemonId: "zubat",
    maxHp: 35,
    baseSpeed: 10,
    energyPerTurn: 2,
    handSize: 4,
    deck: NODE2_ZUBAT_DECK,
    types: ["poison", "flying"],
  }],
  playerPositions: [
    { row: "front", column: 0 },
    { row: "front", column: 1 },
  ],
  enemyPositions: [{ row: "front", column: 0 }],
  playerDecks: [NODE2_GROWLITHE_DECK, NODE2_GASTLY_DECK],
  battleSteps: [
    {
      id: 1, highlight: "intents",
      text: () => "See those icons under the enemy? That's what they're planning this turn.",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 2, highlight: null,
      text: () => "Zubat's targeting Gastly — lowest HP and type advantage. Keep an eye on intent targets.",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 3, highlight: null,
      text: () => "Your turn. Use what you've learned.",
      advanceCondition: "play_any_card", zone: "bottom", allowInteraction: true,
    },
  ],
  postVictoryDialogue: "You're reading them. Good.",
};

// ---------------------------------------------------------------------------
// Node 3: "Formations" — 3v2 vs 2x Paras
// Paras (Bug/Grass) uses Absorb: equally NVE on all targets,
// so AI targets lowest-HP Gastly (22 HP).
// ---------------------------------------------------------------------------

const NODE3_ODDISH_DECK = [
  "vine-whip", "vine-whip", "absorb", "defend", "poison-powder",
  "vine-whip", "absorb", "defend", "mega-drain", "acid",
];

const NODE3_GASTLY_DECK = NODE2_GASTLY_DECK; // Same deck
const NODE3_GROWLITHE_DECK = NODE1_GROWLITHE_DECK; // Same deck

const NODE3_PARAS_DECK = [
  "vine-whip", "vine-whip", "vine-whip", "vine-whip", "vine-whip", "vine-whip",
];

export const NODE3: PrologueNodeDef = {
  id: "node3",
  label: "Formations",
  playerIds: ["growlithe", "gastly", "oddish"],
  enemies: [
    {
      pokemonId: "paras",
      maxHp: 40,
      baseSpeed: 13,
      energyPerTurn: 2,
      handSize: 4,
      deck: NODE3_PARAS_DECK,
    },
    {
      pokemonId: "paras",
      maxHp: 40,
      baseSpeed: 10,
      energyPerTurn: 2,
      handSize: 4,
      deck: NODE3_PARAS_DECK,
    },
  ],
  playerPositions: [
    { row: "front", column: 0 },  // Growlithe
    { row: "front", column: 1 },  // Gastly
    { row: "back", column: 1 },   // Oddish (behind Gastly's column)
  ],
  enemyPositions: [
    { row: "front", column: 0 },
    { row: "front", column: 1 },
  ],
  playerDecks: [NODE3_GROWLITHE_DECK, NODE3_GASTLY_DECK, NODE3_ODDISH_DECK],
  battleSteps: [
    {
      id: 1, highlight: "intents",
      text: () => "Both Paras are targeting Gastly — one hit will KO it.",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 2, highlight: "switch_button",
      text: () => "Swap Gastly with Oddish behind it. Oddish takes the front, and Gastly is shielded in back — front-line attacks can't reach it there.",
      advanceCondition: "manual", zone: "bottom",
    },
    {
      id: 3, highlight: null,
      text: () => "Good. Play your cards.",
      advanceCondition: "play_any_card", zone: "bottom", allowInteraction: true,
    },
  ],
  postVictoryDialogue: "Formation matters. Keep your fragile ones behind the front line.",
  hpOverrides: { "player-1": 3 }, // Gastly at 3 HP — Vine Whip KOs, so AI targets it
};

// ---------------------------------------------------------------------------
// Node 4: "The Relay Room" — 3v1 vs Wartortle (crisis)
// ---------------------------------------------------------------------------

const NODE4_GASTLY_DECK = [
  "confuse-ray", "potion", "shadow-punch", "shadow-punch",
  "confuse-ray", "lick", "shadow-punch", "shadow-punch",
];

const NODE4_GROWLITHE_DECK = [
  "brace", "fire-fang", "fire-fang", "fire-spin", "defend",
  "flame-wheel", "fire-spin", "defend", "fire-fang", "roar",
];

const NODE4_ODDISH_DECK = [
  "vine-whip", "vine-whip", "absorb", "defend", "mega-drain",
  "vine-whip", "absorb", "defend", "poison-powder", "acid",
];

const NODE4_WARTORTLE_DECK = [
  "waterfall", "defend", "bubble", "water-gun", "tackle",
  "waterfall", "defend", "water-gun", "bubble", "tackle",
];

export const NODE4: PrologueNodeDef = {
  id: "node4",
  label: "The Relay Room",
  playerIds: ["growlithe", "gastly", "oddish"],
  enemies: [{
    pokemonId: "wartortle",
    maxHp: 55,
    baseSpeed: 9,
    energyPerTurn: 2,
    handSize: 5,
    deck: NODE4_WARTORTLE_DECK,
  }],
  playerPositions: [
    { row: "front", column: 0 },  // Growlithe front
    { row: "back", column: 1 },   // Gastly back (covered by Oddish)
    { row: "front", column: 1 },  // Oddish front (covers Gastly, resists Water)
  ],
  enemyPositions: [{ row: "front", column: 0 }],
  playerDecks: [NODE4_GROWLITHE_DECK, NODE4_GASTLY_DECK, NODE4_ODDISH_DECK],
  battleSteps: [
    {
      id: 1, highlight: "intents",
      text: () => "Wartortle's Waterfall will KO Growlithe. See the KO icon?",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 2, highlight: null,
      text: () => "It has Adaptability — boosting Water STAB. Click Wartortle to inspect its stats.",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 3, highlight: null,
      text: () => "You've got options: Confuse Ray, switching Oddish in, Brace for block, or the Potion.",
      advanceCondition: "manual", zone: "top",
    },
    {
      id: 4, highlight: null,
      text: () => "Your call.",
      advanceCondition: "play_any_card", zone: "bottom", allowInteraction: true,
    },
  ],
  postVictoryDialogue: "Four different ways to save your Growlithe, and you found one. That's the job — always look for options.",
  hpOverrides: { "player-0": 25 }, // Growlithe starts at 25/45 HP
  enemyPassives: { 0: ["adaptability"] },
};

// ---------------------------------------------------------------------------
// Completion dialogue
// ---------------------------------------------------------------------------

export const COMPLETION_DIALOGUE: PrologueDialogueLine[] = [
  {
    id: "complete-1",
    text: "You're cleared for the facility op.",
  },
];

// ---------------------------------------------------------------------------
// All nodes in order
// ---------------------------------------------------------------------------

export const PROLOGUE_NODES: PrologueNodeDef[] = [NODE1, NODE2, NODE3, NODE4];

// ---------------------------------------------------------------------------
// Helper: Build custom PokemonData for a tutorial node
// ---------------------------------------------------------------------------

/** Build player PokemonData with custom deck for a tutorial node. */
export function buildProloguePlayerData(node: PrologueNodeDef): PokemonData[] {
  return node.playerIds.map((id, i) => {
    const base = getPokemon(id);
    return {
      ...base,
      deck: [...node.playerDecks[i]],
    };
  });
}

/** Build enemy PokemonData from tutorial config. */
export function buildPrologueEnemyData(node: PrologueNodeDef): PokemonData[] {
  return node.enemies.map((cfg) => {
    const base = getPokemon(cfg.pokemonId);
    return {
      ...base,
      maxHp: cfg.maxHp,
      baseSpeed: cfg.baseSpeed,
      energyPerTurn: cfg.energyPerTurn,
      handSize: cfg.handSize,
      deck: [...cfg.deck],
      ...(cfg.types ? { types: cfg.types as PokemonData["types"] } : {}),
    };
  });
}
