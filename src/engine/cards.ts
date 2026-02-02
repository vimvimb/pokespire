import type { BattleState, PokemonCombatState } from './types';
import type { CardDefinition, CardEffect } from '../config/cards';
import { getCardDefinition } from '../config/cards';
import { applyStatus, applyBuff, getAttackUpBonus } from './status';

export function resolveCardEffect(
  card: CardDefinition,
  caster: PokemonCombatState,
  targets: PokemonCombatState[],
  battleState: BattleState
): BattleState {
  let newBattleState = { ...battleState };
  let newPlayerParty = [...battleState.playerParty];
  let newEnemies = [...battleState.enemies];

  const attackBonus = getAttackUpBonus(caster);

  switch (card.effect.type) {
    case 'damage': {
      const amount = card.effect.amount + attackBonus;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:20',message:'Applying damage',data:{amount,attackBonus,targetsCount:targets.length,targetIds:targets.map(t=>t.pokemonId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      for (const target of targets) {
        const targetParty = target.playerId ? newPlayerParty : newEnemies;
        const targetIndex = targetParty.findIndex(p => p.pokemonId === target.pokemonId);
        if (targetIndex >= 0) {
          const targetPokemon = targetParty[targetIndex];
          const damageAfterBlock = Math.max(0, amount - targetPokemon.block);
          const newBlock = Math.max(0, targetPokemon.block - amount);
          const newHp = Math.max(0, targetPokemon.currentHp - damageAfterBlock);
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:28',message:'Damage calculation',data:{targetId:target.pokemonId,oldHp:targetPokemon.currentHp,oldBlock:targetPokemon.block,damageAmount:amount,damageAfterBlock,newBlock,newHp},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          targetParty[targetIndex] = {
            ...targetPokemon,
            currentHp: newHp,
            block: newBlock,
          };
        }
      }
      break;
    }
    case 'heal': {
      for (const target of targets) {
        const targetParty = target.playerId ? newPlayerParty : newEnemies;
        const targetIndex = targetParty.findIndex(p => p.pokemonId === target.pokemonId);
        if (targetIndex >= 0) {
          const targetPokemon = targetParty[targetIndex];
          const newHp = Math.min(targetPokemon.maxHp, targetPokemon.currentHp + card.effect.amount);
          
          targetParty[targetIndex] = {
            ...targetPokemon,
            currentHp: newHp,
          };
        }
      }
      break;
    }
    case 'block': {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:52',message:'Applying block',data:{target:card.effect.target,amount:card.effect.amount,casterId:caster.pokemonId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (card.effect.target === 'self') {
        const casterParty = caster.playerId ? newPlayerParty : newEnemies;
        const casterIndex = casterParty.findIndex(p => p.pokemonId === caster.pokemonId);
        if (casterIndex >= 0) {
          const oldBlock = casterParty[casterIndex].block;
          const newBlock = oldBlock + card.effect.amount;
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:58',message:'Block applied to self',data:{casterId:caster.pokemonId,oldBlock,newBlock,amount:card.effect.amount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          casterParty[casterIndex] = {
            ...casterParty[casterIndex],
            block: newBlock,
          };
        }
      } else if (card.effect.target === 'all') {
        // Apply to all allies
        for (let i = 0; i < newPlayerParty.length; i++) {
          const oldBlock = newPlayerParty[i].block;
          const newBlock = oldBlock + card.effect.amount;
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/052177c7-b559-47bb-b50f-ee17a791e993',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cards.ts:70',message:'Block applied to all',data:{pokemonId:newPlayerParty[i].pokemonId,oldBlock,newBlock,amount:card.effect.amount},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          newPlayerParty[i] = {
            ...newPlayerParty[i],
            block: newBlock,
          };
        }
      }
      break;
    }
    case 'status': {
      for (const target of targets) {
        const targetParty = target.playerId ? newPlayerParty : newEnemies;
        const targetIndex = targetParty.findIndex(p => p.pokemonId === target.pokemonId);
        if (targetIndex >= 0) {
          targetParty[targetIndex] = applyStatus(
            targetParty[targetIndex],
            card.effect.status,
            card.effect.stacks
          );
        }
      }
      break;
    }
    case 'buff': {
      if (card.effect.target === 'self') {
        const casterParty = caster.playerId ? newPlayerParty : newEnemies;
        const casterIndex = casterParty.findIndex(p => p.pokemonId === caster.pokemonId);
        if (casterIndex >= 0) {
          casterParty[casterIndex] = applyBuff(
            casterParty[casterIndex],
            card.effect.buff,
            card.effect.stacks
          );
        }
      } else if (card.effect.target === 'all') {
        // Apply to all allies
        for (let i = 0; i < newPlayerParty.length; i++) {
          newPlayerParty[i] = applyBuff(
            newPlayerParty[i],
            card.effect.buff,
            card.effect.stacks
          );
        }
      }
      break;
    }
  }

  return {
    ...newBattleState,
    playerParty: newPlayerParty,
    enemies: newEnemies,
  };
}

export function getCardTargets(
  card: CardDefinition,
  caster: PokemonCombatState,
  battleState: BattleState,
  explicitTargetIds?: string[]
): PokemonCombatState[] {
  const effect = card.effect;

  // If explicit targets provided, use them
  if (explicitTargetIds && explicitTargetIds.length > 0) {
    // Check if targets are in uniqueId format (pokemonId-index) or just pokemonId
    const targets: PokemonCombatState[] = [];
    for (const id of explicitTargetIds) {
      if (id.includes('-')) {
        // Unique ID format: "pokemonId-index"
        const [pokemonId, indexStr] = id.split('-');
        const index = parseInt(indexStr, 10);
        
        // Find in appropriate array based on card effect
        if (effect.type === 'heal') {
          // Heal targets allies (player party)
          if (index >= 0 && index < battleState.playerParty.length && battleState.playerParty[index].pokemonId === pokemonId) {
            targets.push(battleState.playerParty[index]);
          }
        } else if (effect.side === 'enemy') {
          // Look in enemies
          if (index >= 0 && index < battleState.enemies.length && battleState.enemies[index].pokemonId === pokemonId) {
            targets.push(battleState.enemies[index]);
          }
        } else if (effect.side === 'ally') {
          // Look in player party
          if (index >= 0 && index < battleState.playerParty.length && battleState.playerParty[index].pokemonId === pokemonId) {
            targets.push(battleState.playerParty[index]);
          }
        }
      } else {
        // Just pokemonId - find first matching (legacy behavior)
        const allCombatants = [...battleState.playerParty, ...battleState.enemies];
        const found = allCombatants.find(p => p.pokemonId === id);
        if (found) {
          targets.push(found);
        }
      }
    }
    return targets;
  }

  // Determine targets based on effect
  if (effect.type === 'damage' || effect.type === 'status') {
    if (effect.target === 'all') {
      return effect.side === 'enemy' ? battleState.enemies : battleState.playerParty;
    } else {
      // Single target - should be provided explicitly, but fallback to first enemy
      return effect.side === 'enemy' 
        ? battleState.enemies.filter(e => e.currentHp > 0).slice(0, 1)
        : battleState.playerParty.filter(p => p.currentHp > 0).slice(0, 1);
    }
  } else if (effect.type === 'heal' || effect.type === 'block') {
    if (effect.target === 'all') {
      return battleState.playerParty;
    } else {
      // Single target - should be provided explicitly
      return battleState.playerParty.filter(p => p.currentHp > 0).slice(0, 1);
    }
  } else if (effect.type === 'buff') {
    if (effect.target === 'all') {
      return battleState.playerParty;
    } else {
      return [caster];
    }
  }

  return [];
}
