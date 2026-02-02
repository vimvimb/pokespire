import type { PokemonCombatState, StatusEffect, BuffEffect } from './types';
import type { StatusType, BuffType } from '../config/cards';

export function applyStatus(
  pokemon: PokemonCombatState,
  statusType: StatusType,
  stacks: number
): PokemonCombatState {
  const newStatuses = [...pokemon.statuses];
  const existingIndex = newStatuses.findIndex(s => s.type === statusType);
  
  if (existingIndex >= 0) {
    newStatuses[existingIndex] = {
      ...newStatuses[existingIndex],
      stacks: newStatuses[existingIndex].stacks + stacks,
    };
  } else {
    newStatuses.push({ type: statusType, stacks });
  }

  return {
    ...pokemon,
    statuses: newStatuses,
  };
}

export function applyBuff(
  pokemon: PokemonCombatState,
  buffType: BuffType,
  stacks: number
): PokemonCombatState {
  const newBuffs = [...pokemon.buffs];
  const existingIndex = newBuffs.findIndex(b => b.type === buffType);
  
  if (existingIndex >= 0) {
    newBuffs[existingIndex] = {
      ...newBuffs[existingIndex],
      stacks: newBuffs[existingIndex].stacks + stacks,
    };
  } else {
    newBuffs.push({ type: buffType, stacks });
  }

  return {
    ...pokemon,
    buffs: newBuffs,
  };
}

export function processEndOfTurnStatuses(
  pokemon: PokemonCombatState
): PokemonCombatState {
  let newHp = pokemon.currentHp;
  const newStatuses: StatusEffect[] = [];

  // Process each status effect
  for (const status of pokemon.statuses) {
    // Apply damage equal to stacks
    newHp = Math.max(0, newHp - status.stacks);
    
    // Decay stacks by 1 (minimum 0)
    const newStacks = Math.max(0, status.stacks - 1);
    if (newStacks > 0) {
      newStatuses.push({ ...status, stacks: newStacks });
    }
  }

  // Buffs don't decay, they persist
  return {
    ...pokemon,
    currentHp: newHp,
    statuses: newStatuses,
  };
}

export function getAttackUpBonus(pokemon: PokemonCombatState): number {
  const attackUp = pokemon.buffs.find(b => b.type === 'attackUp');
  return attackUp ? attackUp.stacks : 0;
}

export function resetBlock(pokemon: PokemonCombatState): PokemonCombatState {
  return {
    ...pokemon,
    block: 0,
  };
}
