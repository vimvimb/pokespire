import { useMemo, useState, useEffect, useRef } from 'react';
import type { CombatState, LogEntry, Combatant, Column } from '../../engine/types';
import { getCurrentCombatant } from '../../engine/combat';
import { getMove } from '../../data/loaders';
import { getValidTargets, requiresTargetSelection } from '../../engine/position';
import { PokemonSprite } from '../components/PokemonSprite';
import { HandDisplay } from '../components/HandDisplay';
import { TurnOrderBar } from '../components/TurnOrderBar';
import { BattleLog } from '../components/BattleLog';
import { PileViewer } from '../components/PileViewer';
import { ProgressionPanel } from '../components/ProgressionPanel';
import type { BattlePhase } from '../hooks/useBattle';
import type { RunState } from '../../run/types';
import battleBackground from '../../../assets/backgrounds/rocket_lab_act_1_v4.png';

export type BattleResult = 'victory' | 'defeat';

interface Props {
  state: CombatState;
  phase: BattlePhase;
  logs: LogEntry[];
  pendingCardIndex: number | null;
  onSelectCard: (index: number | null) => void;
  onSelectTarget: (targetId: string) => void;
  onEndTurn: () => void;
  onRestart: () => void;
  onBattleEnd?: (result: BattleResult, combatants: Combatant[]) => void;
  runState?: RunState;
}

/** Render a 2-row grid for one side of the battle */
function BattleGrid({
  combatants,
  currentCombatant,
  targetableIds,
  onSelectTarget,
  onInspect,
  side,
}: {
  combatants: Combatant[];
  currentCombatant: Combatant | null;
  targetableIds: Set<string>;
  onSelectTarget: (id: string) => void;
  onInspect?: (combatant: Combatant) => void;
  side: 'player' | 'enemy';
}) {
  const frontRow = combatants.filter(c => c.position.row === 'front');
  const backRow = combatants.filter(c => c.position.row === 'back');

  // Swapped: front row on top, back row on bottom for player
  // Swapped: back row on top, front row on bottom for enemy
  const topRow = side === 'player' ? frontRow : backRow;
  const bottomRow = side === 'player' ? backRow : frontRow;
  const topLabel = side === 'player' ? 'Front' : 'Back';
  const bottomLabel = side === 'player' ? 'Back' : 'Front';

  // Back rows are offset: player's back (bottom) shifts left, enemy's back (top) shifts right
  const topOffset = side === 'enemy' ? 80 : 0;
  const bottomOffset = side === 'player' ? -80 : 0;

  // Tilt: both sides tilt down to the right, creating diagonal depth
  const getTiltOffset = (col: number) => {
    const tiltAmount = 15; // pixels per column
    // Column 0 highest, column 2 lowest (both sides tilt same direction)
    return col * tiltAmount;
  };

  const renderRow = (row: Combatant[], _label: string, offsetX: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'flex-end',
        minHeight: 160,
        transform: offsetX !== 0 ? `translateX(${offsetX}px)` : undefined,
      }}>
        {([0, 1, 2] as Column[]).map(col => {
          const combatant = row.find(c => c.position.column === col);
          const tiltY = getTiltOffset(col);
          return (
            <div key={col} style={{
              width: 160,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              transform: `translateY(${tiltY}px)`,
            }}>
              {combatant && (
                <PokemonSprite
                  combatant={combatant}
                  isCurrentTurn={currentCombatant?.id === combatant.id}
                  isTargetable={targetableIds.has(combatant.id)}
                  onSelect={() => onSelectTarget(combatant.id)}
                  onInspect={onInspect ? () => onInspect(combatant) : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {renderRow(topRow, topLabel, topOffset)}
      {renderRow(bottomRow, bottomLabel, bottomOffset)}
    </div>
  );
}

export function BattleScreen({
  state, phase, logs, pendingCardIndex,
  onSelectCard, onSelectTarget, onEndTurn, onRestart, onBattleEnd, runState,
}: Props) {
  const isPlayerTurn = phase === 'player_turn';
  const currentCombatant = state.phase === 'ongoing'
    ? getCurrentCombatant(state)
    : null;

  const players = state.combatants.filter(c => c.side === 'player');
  const enemies = state.combatants.filter(c => c.side === 'enemy');

  // Inspection state - track which combatant is being inspected
  const [inspectedCombatantId, setInspectedCombatantId] = useState<string | null>(null);

  // Find the RunPokemon for an inspected player combatant
  const getRunPokemonForCombatant = (combatant: Combatant) => {
    if (!runState || combatant.side !== 'player') return null;
    // Match by slotIndex (party position)
    return runState.party[combatant.slotIndex] ?? null;
  };

  const inspectedCombatant = inspectedCombatantId
    ? state.combatants.find(c => c.id === inspectedCombatantId) ?? null
    : null;
  const inspectedRunPokemon = inspectedCombatant
    ? getRunPokemonForCombatant(inspectedCombatant)
    : null;

  // Handle Pokemon inspection
  const handleInspect = (combatant: Combatant) => {
    // Only allow inspection of player Pokemon with runState available
    if (combatant.side === 'player' && runState) {
      setInspectedCombatantId(combatant.id);
    }
  };

  const handleCloseInspection = () => {
    setInspectedCombatantId(null);
  };

  // Navigate to a different player Pokemon in inspection
  const handleNavigateInspection = (newIndex: number) => {
    // Find the player combatant at this slot index
    const targetCombatant = players.find(c => c.slotIndex === newIndex);
    if (targetCombatant) {
      setInspectedCombatantId(targetCombatant.id);
    }
  };

  // Calculate targetable combatants based on pending card's range
  const { needsTarget, targetableIds, rangeLabel } = useMemo(() => {
    if (pendingCardIndex === null || !isPlayerTurn || !currentCombatant) {
      return { needsTarget: false, targetableIds: new Set<string>(), rangeLabel: '' };
    }

    const cardId = currentCombatant.hand[pendingCardIndex];
    const card = getMove(cardId);
    const validTargets = getValidTargets(state, currentCombatant, card.range);

    // Check if this range requires manual target selection
    if (!requiresTargetSelection(card.range)) {
      // AoE or self - no target needed, auto-play
      return { needsTarget: false, targetableIds: new Set<string>(), rangeLabel: '' };
    }

    // Auto-select if only one valid target
    if (validTargets.length === 1) {
      // Will be handled in useEffect or callback
      return { needsTarget: false, targetableIds: new Set<string>(), rangeLabel: '' };
    }

    if (validTargets.length === 0) {
      return { needsTarget: false, targetableIds: new Set<string>(), rangeLabel: 'No valid targets!' };
    }

    // Create label based on range
    let label = 'Select a target';
    if (card.range === 'front_enemy') label = 'Select front row target';
    else if (card.range === 'back_enemy') label = 'Select back row target';
    else if (card.range === 'column') label = 'Select target (hits column)';

    return {
      needsTarget: true,
      targetableIds: new Set(validTargets.map(t => t.id)),
      rangeLabel: label,
    };
  }, [pendingCardIndex, isPlayerTurn, currentCombatant, state]);

  // Handle auto-target selection for single valid target or AoE
  useEffect(() => {
    if (pendingCardIndex === null || !isPlayerTurn || !currentCombatant) return;

    const cardId = currentCombatant.hand[pendingCardIndex];
    const card = getMove(cardId);
    const validTargets = getValidTargets(state, currentCombatant, card.range);

    // AoE or self - auto-play without target
    if (!requiresTargetSelection(card.range)) {
      onSelectTarget('');
      return;
    }

    // Auto-select if only one valid target
    if (validTargets.length === 1) {
      onSelectTarget(validTargets[0].id);
    }
  }, [pendingCardIndex, isPlayerTurn, currentCombatant, state, onSelectTarget]);

  const handleCardClick = (index: number) => {
    if (!isPlayerTurn) return;
    if (pendingCardIndex === index) {
      onSelectCard(null); // deselect
    } else {
      onSelectCard(index);
    }
  };

  const gameOver = phase === 'victory' || phase === 'defeat';

  // Track if we've already called onBattleEnd for this game over state
  const battleEndCalledRef = useRef(false);

  // Call onBattleEnd when battle ends
  useEffect(() => {
    if (gameOver && onBattleEnd && !battleEndCalledRef.current) {
      battleEndCalledRef.current = true;
      const result: BattleResult = phase === 'victory' ? 'victory' : 'defeat';
      onBattleEnd(result, state.combatants);
    }
    // Reset ref when game is not over (for next battle)
    if (!gameOver) {
      battleEndCalledRef.current = false;
    }
  }, [gameOver, phase, state.combatants, onBattleEnd]);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      backgroundImage: `url(${battleBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 72%',
      color: '#e2e8f0',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Top bar: turn order + reset */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(18, 18, 26, 0.4)',
        padding: 8,
        zIndex: 10,
      }}>
        <div style={{ flex: 1 }}>
          <TurnOrderBar state={state} />
        </div>
        <button
          onClick={onRestart}
          style={{
            padding: '6px 14px',
            fontSize: 15,
            fontWeight: 'bold',
            borderRadius: 6,
            border: '1px solid #555',
            background: '#333',
            color: '#ccc',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            marginRight: 8,
          }}
        >
          Reset
        </button>
      </div>

      {/* Targeting hint */}
      {needsTarget && (
        <div style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: 8,
          background: '#ef444433',
          color: '#fca5a5',
          fontSize: 15,
          fontWeight: 'bold',
          zIndex: 10,
        }}>
          {rangeLabel}
          <button
            onClick={() => onSelectCard(null)}
            style={{
              marginLeft: 12,
              padding: '2px 8px',
              background: '#333',
              border: '1px solid #555',
              color: '#ccc',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Battlefield - Grid Layout */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 20,
        padding: '16px 16px 8px 16px',
      }}>
        {/* Player side */}
        <div style={{ transform: 'translateY(-150px)' }}>
          <BattleGrid
            combatants={players}
            currentCombatant={currentCombatant}
            targetableIds={new Set()} // Players targeting allies not implemented yet
            onSelectTarget={onSelectTarget}
            onInspect={runState ? handleInspect : undefined}
            side="player"
          />
        </div>

        {/* VS divider */}
        <div style={{
          fontSize: 26,
          fontWeight: 'bold',
          color: '#facc1555',
        }}>
          VS
        </div>

        {/* Enemy side */}
        <div style={{ transform: 'translateY(-370px)' }}>
          <BattleGrid
            combatants={enemies}
            currentCombatant={currentCombatant}
            targetableIds={targetableIds}
            onSelectTarget={onSelectTarget}
            side="enemy"
          />
        </div>

        {/* Game over overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            gap: 16,
          }}>
            <div style={{
              fontSize: 52,
              fontWeight: 'bold',
              color: phase === 'victory' ? '#facc15' : '#ef4444',
            }}>
              {phase === 'victory' ? 'VICTORY!' : 'DEFEAT'}
            </div>
            <button
              onClick={onRestart}
              style={{
                padding: '12px 32px',
                fontSize: 17,
                fontWeight: 'bold',
                borderRadius: 8,
                border: 'none',
                background: '#facc15',
                color: '#000',
                cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom panel: hand + controls + log */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid #222',
        background: 'rgba(18, 18, 26, 0.4)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}>
        {/* Enemy thinking indicator */}
        {phase === 'enemy_turn' && (
          <div style={{
            textAlign: 'center',
            fontSize: 15,
            color: '#fca5a5',
            fontWeight: 'bold',
          }}>
            Enemy is thinking...
          </div>
        )}

        {/* Hand + pile viewer (only during player turn) */}
        {isPlayerTurn && currentCombatant && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            {/* Energy + Pile viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(96, 165, 250, 0.2)',
                borderRadius: 8,
                border: '1px solid #60a5fa',
              }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#60a5fa' }}>
                  {currentCombatant.energy}
                </span>
              </div>
              <PileViewer combatant={currentCombatant} />
            </div>
            <HandDisplay
              combatant={currentCombatant}
              selectedIndex={pendingCardIndex}
              onSelectCard={handleCardClick}
            />
            <button
              onClick={onEndTurn}
              style={{
                padding: '10px 20px',
                fontSize: 15,
                fontWeight: 'bold',
                borderRadius: 8,
                border: '2px solid #facc15',
                background: 'transparent',
                color: '#facc15',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              End Turn
            </button>
          </div>
        )}

        {/* Battle log */}
        <BattleLog logs={logs} />
      </div>

      {/* Pokemon inspection panel */}
      {inspectedRunPokemon && inspectedCombatant && runState && (
        <ProgressionPanel
          pokemon={inspectedRunPokemon}
          pokemonIndex={inspectedCombatant.slotIndex}
          partySize={runState.party.length}
          onClose={handleCloseInspection}
          onLevelUp={() => {}} // No-op during battle
          onNavigate={handleNavigateInspection}
          readOnly
        />
      )}
    </div>
  );
}
