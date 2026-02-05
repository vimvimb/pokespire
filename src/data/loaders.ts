import type { MoveDefinition, PokemonData, MoveType, MoveRange, CardEffect } from '../engine/types';
import movesData from './moves.json';
import pokemonData from './pokemon.json';

// ============================================================
// Data Loaders — Load JSON data and export typed objects
// ============================================================

// Type for raw move data from JSON (without id)
interface RawMoveData {
  name: string;
  type: string;
  cost: number;
  range: string;
  vanish: boolean;
  effects: CardEffect[];
  description: string;
  rarity?: string;
}

// Type for raw pokemon data from JSON (without id)
interface RawPokemonData {
  name: string;
  types: string[];
  maxHp: number;
  baseSpeed: number;
  energyPerTurn: number;
  energyCap: number;
  handSize: number;
  deck: string[];
  abilities: string[];
}

/** All move definitions, keyed by move ID */
export const MOVES: Record<string, MoveDefinition> = Object.fromEntries(
  Object.entries(movesData as Record<string, RawMoveData>).map(([id, move]) => [
    id,
    {
      id,
      name: move.name,
      type: move.type as MoveType,
      cost: move.cost,
      range: move.range as MoveRange,
      vanish: move.vanish,
      effects: move.effects,
      description: move.description,
      rarity: move.rarity as MoveDefinition['rarity'],
    },
  ])
);

/** All Pokemon definitions, keyed by Pokemon ID */
export const POKEMON: Record<string, PokemonData> = Object.fromEntries(
  Object.entries(pokemonData as Record<string, RawPokemonData>).map(([id, poke]) => [
    id,
    {
      id,
      name: poke.name,
      types: poke.types as MoveType[],
      maxHp: poke.maxHp,
      baseSpeed: poke.baseSpeed,
      energyPerTurn: poke.energyPerTurn,
      energyCap: poke.energyCap,
      handSize: poke.handSize,
      deck: poke.deck,
      abilities: poke.abilities,
    },
  ])
);

/** Starter Pokemon (player-selectable) */
export const STARTER_POKEMON: Record<string, PokemonData> = {
  bulbasaur: POKEMON.bulbasaur,
  squirtle: POKEMON.squirtle,
  charmander: POKEMON.charmander,
  pikachu: POKEMON.pikachu,
};

/** Enemy Pokemon */
export const ENEMY_POKEMON: Record<string, PokemonData> = {
  rattata: POKEMON.rattata,
  pidgey: POKEMON.pidgey,
  ekans: POKEMON.ekans,
};

/**
 * Get a move definition by ID.
 * @throws Error if move not found
 */
export function getMove(id: string): MoveDefinition {
  const move = MOVES[id];
  if (!move) throw new Error(`Move not found: ${id}`);
  return move;
}

/**
 * Get a Pokemon definition by ID.
 * @throws Error if Pokemon not found
 */
export function getPokemon(id: string): PokemonData {
  const pokemon = POKEMON[id];
  if (!pokemon) throw new Error(`Pokemon not found: ${id}`);
  return pokemon;
}

// Legacy alias for backward compatibility during migration
export const getCard = getMove;
