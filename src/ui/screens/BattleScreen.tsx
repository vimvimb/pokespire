import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type {
  CombatState,
  LogEntry,
  Combatant,
  Column,
  MoveRange,
  MoveType,
  Position,
  MoveDefinition,
} from "../../engine/types";
import { getCurrentCombatant } from "../../engine/combat";
import { getMove, MOVES } from "../../data/loaders";
import {
  getValidTargets,
  getCardValidTargets,
  requiresTargetSelection,
  isAoERange,
  getValidSwitchTargets,
} from "../../engine/position";
import { getSwitchCost, getMaxSwitches } from "../../engine/turns";
import { getPlayableCards } from "../../engine/cards";
import { shouldConsumingFlameVanish } from "../../engine/passives";
import { calculateDamagePreview } from "../../engine/preview";
import type { DamagePreview } from "../../engine/preview";
import { PokemonSprite } from "../components/PokemonSprite";
import { HandDisplay, type HandDisplayRef } from "../components/HandDisplay";
import { TurnOrderBar } from "../components/TurnOrderBar";
import { BattleLog } from "../components/BattleLog";
import { PileButton } from "../components/PileButton";
import { PileModal } from "../components/PileModal";
import { TutorialOverlay } from "../components/TutorialOverlay";
import { EnergyPips } from "../components/EnergyPips";
import { PokemonDetailsPanel } from "../components/PokemonDetailsPanel";
import { EnemyHandPreview } from "../components/EnemyHandPreview";
import {
  useBattleEffects,
  BattleEffectsLayer,
} from "../components/BattleEffects";
import type { BattlePhase } from "../hooks/useBattle";
import type {
  TutorialHighlightTarget,
  TutorialZone,
} from "../../data/tutorial";
import type { RunState } from "../../run/types";
import { getBattleSpriteScale } from "../../data/heights";
import { Flourish } from "../components/Flourish";
import { simulateEnemyIntents } from "../../engine/intentPreview";
import type { EnemyIntent } from "../../engine/intentPreview";
import { THEME } from "../theme";
import { HeldItemsSidebar } from "../components/HeldItemsSidebar";
import { checkItemPlayRestriction } from "../../engine/itemEffects";
import battleBgAct1 from "../../../assets/backgrounds/rocket_lab_act_1_v4.png";
import { getRunActMapConfig } from "../../data/campaigns";
import { playSound, type SoundEffect } from "../utils/sound";

/**
 * Returns `ms` in normal play, or 0 when the Playwright test server sets
 * VITE_E2E_FAST=1.  Keeps the call site clean while keeping the env-var
 * check in one place.  This var is never set in production or regular dev.
 */
const makeDelay = (ms: number) =>
  import.meta.env.VITE_E2E_FAST === "1" ? 0 : ms;

export type BattleResult = "victory" | "defeat";

interface Props {
  state: CombatState;
  phase: BattlePhase;
  logs: LogEntry[];
  pendingCardIndex: number | null;
  onSelectCard: (index: number | null) => void;
  onSelectTarget: (targetId: string) => void;
  onPlayCard?: (cardIndex: number, targetId?: string) => void;
  onEndTurn: () => void;
  onSwitchPosition?: (targetPosition: Position) => void;
  onRestart: () => void;
  onBattleEnd?: (
    result: BattleResult,
    combatants: Combatant[],
    goldEarned?: number,
  ) => void;
  runState?: RunState;
  onBackToSandboxConfig?: () => void; // Only present in sandbox mode
  /** Whether this is a recruit battle (enables capture mechanic) */
  isRecruitBattle?: boolean;
  /** Tutorial overlay config when in tutorial battle */
  tutorial?: {
    isActive: boolean;
    highlightTarget: TutorialHighlightTarget;
    stepText: string;
    advance: () => void;
    skip: () => void;
    canSkip: boolean;
    allowInteraction: boolean;
    zone: TutorialZone;
  };
}

/** Render a 2-row grid for one side of the battle */

// Fixed cell dimensions — ensures grid never collapses when cells are empty
const CELL_W = 200; // px, wide enough for largest sprite at MAX_BATTLE_SPRITE_SIZE
const CELL_H = 260; // px, tall enough for sprite + name + health bar + energy pips
const TILT_PX = 36; // isometric horizontal offset per column slot
const SLOT_GAP = 4; // vertical gap between rows
const ROW_GAP = 50; // horizontal gap between front and back columns


function BattleGrid({
  combatants,
  allCombatants,
  currentCombatant,
  targetableIds,
  onSelectTarget,
  onInspect,
  side,
  onDragEnterTarget,
  onDragLeaveTarget,
  onDropOnTarget,
  hoveredTargetIds,
  damagePreviews,
  spriteScale,
  onMouseEnterSprite,
  onMouseLeaveSprite,
  switchTargetPositions,
  onSwitchSelect,
  futureSightColumns,
  linkedHoverId,
  onHoverCombatant,
  captureThresholdPercent,
}: {
  combatants: Combatant[];
  allCombatants: Combatant[];
  currentCombatant: Combatant | null;
  targetableIds: Set<string>;
  onSelectTarget: (id: string) => void;
  onInspect?: (combatant: Combatant) => void;
  side: "player" | "enemy";
  onDragEnterTarget?: (id: string) => void;
  onDragLeaveTarget?: () => void;
  onDropOnTarget?: (id: string) => void;
  hoveredTargetIds?: Set<string>;
  damagePreviews?: Map<string, DamagePreview | null>;
  spriteScale: number;
  onMouseEnterSprite?: (combatant: Combatant) => void;
  onMouseLeaveSprite?: () => void;
  switchTargetPositions?: Position[];
  onSwitchSelect?: (position: Position) => void;
  futureSightColumns?: Set<Column>;
  linkedHoverId?: string | null;
  onHoverCombatant?: (id: string | null) => void;
  captureThresholdPercent?: number;
}) {
  // Position fingerprint so useMemo recomputes after swaps (positions are mutated in place)
  const posKey = combatants
    .map((c) => `${c.id}:${c.position.row}:${c.position.column}`)
    .join(",");
  const frontRow = useMemo(
    () => combatants.filter((c) => c.position.row === "front"),
    [combatants, posKey],
  );
  const backRow = useMemo(
    () => combatants.filter((c) => c.position.row === "back"),
    [combatants, posKey],
  );

  // Layout: 3×2 CSS grid — 3 position rows, 2 depth columns (front/back).
  // CSS Grid ensures each row shares height across both columns, so a back-row
  // Pokemon at column N always aligns vertically with front-row column N.
  // Player: back row on LEFT, front row on RIGHT (front faces enemy)
  // Enemy: front row on LEFT (faces player), back row on RIGHT
  const leftCol = side === "player" ? backRow : frontRow;
  const rightCol = side === "player" ? frontRow : backRow;

  // Front row renders on top (z-index) for depth layering
  const leftZIndex = side === "player" ? 1 : 2;
  const rightZIndex = side === "player" ? 2 : 1;

  // Compute arrow character pointing from source toward target cell
  // Player grid: back row on LEFT, front row on RIGHT
  // Enemy grid: front row on LEFT, back row on RIGHT
  const getSwitchArrow = (from: Position, to: Position): string => {
    if (from.row !== to.row) {
      const movingToFront = to.row === "front";
      // Player: front is RIGHT, back is LEFT. Enemy: front is LEFT, back is RIGHT.
      if (side === "player") return movingToFront ? "\u2192" : "\u2190";
      return movingToFront ? "\u2190" : "\u2192";
    }
    if (to.column < from.column) return "\u2191";
    return "\u2193";
  };

  const renderCell = (
    combatant: Combatant | undefined,
    zIndex: number,
    tiltX: number,
    cellPosition: Position,
  ) => {
    // Check if this cell is a valid switch target
    const isSwitchTarget =
      switchTargetPositions?.some(
        (p) => p.row === cellPosition.row && p.column === cellPosition.column,
      ) ?? false;

    const arrow =
      isSwitchTarget && currentCombatant
        ? getSwitchArrow(currentCombatant.position, cellPosition)
        : "\u2192";

    return (
      <div
        style={{
          transform: `translateX(${tiltX}px)`,
          position: "relative",
          zIndex,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: CELL_W,
          height: CELL_H,
        }}
      >
        {/* Ground marker for empty cells only — occupied cells render their own in PokemonSprite */}
        {!combatant && !isSwitchTarget && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: CELL_H * 0.24,
              transform: "translateX(-50%)",
              width: 140,
              height: 18,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(240, 230, 211, 0.28) 0%, rgba(240, 230, 211, 0.08) 60%, transparent 100%)",
              border: "1.5px solid rgba(240, 230, 211, 0.28)",
              pointerEvents: "none",
            }}
          />
        )}
        {combatant ? (
          <div
            onClick={
              isSwitchTarget && onSwitchSelect
                ? () => onSwitchSelect(cellPosition)
                : undefined
            }
            onMouseEnter={() => onHoverCombatant?.(combatant.id)}
            onMouseLeave={() => onHoverCombatant?.(null)}
            style={{
              cursor: isSwitchTarget ? "pointer" : undefined,
              borderRadius: 8,
              boxShadow: isSwitchTarget
                ? "0 0 12px 4px rgba(56, 189, 248, 0.6)"
                : undefined,
            }}
          >
            <PokemonSprite
              combatant={combatant}
              combatants={allCombatants}
              isCurrentTurn={currentCombatant?.id === combatant.id}
              isTargetable={!isSwitchTarget && targetableIds.has(combatant.id)}
              isLinkedHover={linkedHoverId === combatant.id}
              onSelect={
                isSwitchTarget
                  ? () => onSwitchSelect?.(cellPosition)
                  : () => onSelectTarget(combatant.id)
              }
              onInspect={
                !isSwitchTarget && onInspect
                  ? () => onInspect(combatant)
                  : undefined
              }
              onDragEnter={
                !isSwitchTarget && onDragEnterTarget
                  ? () => onDragEnterTarget(combatant.id)
                  : undefined
              }
              onDragLeave={!isSwitchTarget ? onDragLeaveTarget : undefined}
              onDrop={
                !isSwitchTarget && onDropOnTarget
                  ? () => onDropOnTarget(combatant.id)
                  : undefined
              }
              isDragHovered={hoveredTargetIds?.has(combatant.id) ?? false}
              damagePreview={damagePreviews?.get(combatant.id)}
              spriteScale={spriteScale}
              onMouseEnter={
                onMouseEnterSprite
                  ? () => onMouseEnterSprite(combatant)
                  : undefined
              }
              onMouseLeave={onMouseLeaveSprite}
              captureThresholdPercent={captureThresholdPercent}
            />
          </div>
        ) : isSwitchTarget && onSwitchSelect ? (
          <div
            onClick={() => onSwitchSelect(cellPosition)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              border: "2px dashed rgba(56, 189, 248, 0.6)",
              background: "rgba(56, 189, 248, 0.12)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "rgba(56, 189, 248, 0.7)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(56, 189, 248, 0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(56, 189, 248, 0.12)";
            }}
          >
            {arrow}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Ground markers are rendered inside each cell via renderCell */}

      {/* Grid content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${CELL_W}px ${CELL_W}px`,
          gridTemplateRows: `repeat(3, ${CELL_H}px)`,
          columnGap: ROW_GAP,
          rowGap: SLOT_GAP,
        }}
      >
        {([0, 1, 2] as Column[]).flatMap((col) => {
          const leftCombatant = leftCol.find((c) => c.position.column === col);
          const rightCombatant = rightCol.find(
            (c) => c.position.column === col,
          );
          const tiltX = col * TILT_PX;
          // Left column row depends on side: player left=back, enemy left=front
          const leftRow = side === "player" ? "back" : "front";
          const rightRow = side === "player" ? "front" : "back";
          return [
            <div key={`${col}-l`}>
              {renderCell(leftCombatant, leftZIndex, tiltX, {
                row: leftRow,
                column: col,
              })}
            </div>,
            <div key={`${col}-r`}>
              {renderCell(rightCombatant, rightZIndex, tiltX, {
                row: rightRow,
                column: col,
              })}
            </div>,
          ];
        })}
      </div>

      {/* Future Sight column markers — pulsing psychic overlays on targeted columns */}
      {futureSightColumns &&
        futureSightColumns.size > 0 &&
        ([0, 1, 2] as Column[])
          .filter((col) => futureSightColumns.has(col))
          .map((col) => {
            const tiltX = col * TILT_PX;
            // Each column spans both depth columns (front + back) across one row slot
            const topY = col * (CELL_H + SLOT_GAP);
            return (
              <div
                key={`fs-col-${col}`}
                className="future-sight-marker"
                style={{
                  position: "absolute",
                  top: topY,
                  left: tiltX,
                  width: 2 * CELL_W + ROW_GAP,
                  height: CELL_H,
                  pointerEvents: "none",
                  zIndex: 3,
                }}
              >
                {/* Psychic shimmer overlay */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${2 * CELL_W + ROW_GAP} ${CELL_H}`}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <defs>
                    <radialGradient
                      id={`fs-glow-${col}`}
                      cx="50%"
                      cy="50%"
                      r="60%"
                    >
                      <stop offset="0%" stopColor="#f85888" stopOpacity="0.18">
                        <animate
                          attributeName="stopOpacity"
                          values="0.18;0.28;0.18"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </stop>
                      <stop offset="70%" stopColor="#a855f7" stopOpacity="0.08">
                        <animate
                          attributeName="stopOpacity"
                          values="0.08;0.15;0.08"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </stop>
                      <stop offset="100%" stopColor="#7038f8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Background glow */}
                  <rect
                    width="100%"
                    height="100%"
                    fill={`url(#fs-glow-${col})`}
                    rx="12"
                  />

                  {/* Concentric rings — pulsing outward */}
                  {[0.25, 0.45, 0.65].map((r, i) => (
                    <ellipse
                      key={i}
                      cx={(2 * CELL_W + ROW_GAP) / 2}
                      cy={CELL_H / 2}
                      rx={(r * (2 * CELL_W + ROW_GAP)) / 2}
                      ry={(r * CELL_H) / 2}
                      fill="none"
                      stroke="#f85888"
                      strokeWidth="1.2"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="rx"
                        values={`${(r * (2 * CELL_W + ROW_GAP)) / 2};${((r + 0.08) * (2 * CELL_W + ROW_GAP)) / 2};${(r * (2 * CELL_W + ROW_GAP)) / 2}`}
                        dur={`${2.2 + i * 0.4}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="ry"
                        values={`${(r * CELL_H) / 2};${((r + 0.08) * CELL_H) / 2};${(r * CELL_H) / 2}`}
                        dur={`${2.2 + i * 0.4}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.3;0.5;0.3"
                        dur={`${2.2 + i * 0.4}s`}
                        repeatCount="indefinite"
                      />
                    </ellipse>
                  ))}

                  {/* Small floating particles */}
                  {[0.2, 0.5, 0.8].map((frac, i) => (
                    <circle
                      key={`p${i}`}
                      cx={frac * (2 * CELL_W + ROW_GAP)}
                      cy={CELL_H / 2}
                      r="2.5"
                      fill="#f85888"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="cy"
                        values={`${CELL_H / 2 + 20};${CELL_H / 2 - 20};${CELL_H / 2 + 20}`}
                        dur={`${2 + i * 0.7}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.7;0.4"
                        dur={`${2 + i * 0.7}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                </svg>

                {/* Bottom label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#f85888",
                    textShadow: "0 0 8px #f85888, 0 0 16px #a855f7",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    opacity: 0.8,
                    whiteSpace: "nowrap",
                  }}
                >
                  Future Sight
                </div>
              </div>
            );
          })}
    </div>
  );
}

export function BattleScreen({
  state,
  phase,
  logs,
  pendingCardIndex,
  onSelectCard,
  onSelectTarget,
  onPlayCard,
  onEndTurn,
  onSwitchPosition,
  onRestart,
  onBattleEnd,
  runState,
  onBackToSandboxConfig,
  tutorial: tutorialConfig,
  isRecruitBattle,
}: Props) {
  const isPlayerTurn = phase === "player_turn";
  const currentCombatant =
    state.phase === "ongoing" ? getCurrentCombatant(state) : null;

  const players = useMemo(
    () => state.combatants.filter((c) => c.side === "player"),
    [state.combatants],
  );
  const enemies = useMemo(
    () => state.combatants.filter((c) => c.side === "enemy"),
    [state.combatants],
  );

  // Future Sight column markers: split by which side gets targeted.
  // Player-sourced Future Sight hits enemies → marker on enemy grid.
  // Enemy-sourced Future Sight hits players → marker on player grid.
  const { playerFutureSightCols, enemyFutureSightCols } = useMemo(() => {
    const playerCols = new Set<Column>();  // markers shown on player grid (enemy sources)
    const enemyCols = new Set<Column>();   // markers shown on enemy grid (player sources)

    const addSource = (sourceId: string) => {
      const source = state.combatants.find(c => c.id === sourceId && c.alive);
      if (!source) return;
      if (source.side === 'player') {
        enemyCols.add(source.position.column);
      } else {
        playerCols.add(source.position.column);
      }
    };

    // Queued entries (not yet injected into turn order)
    if (state.pendingFutureSights) {
      for (const entry of state.pendingFutureSights) {
        addSource(entry.sourceId);
      }
    }
    // Injected phantom turns that haven't resolved yet
    for (const entry of state.turnOrder) {
      if (entry.futureSight && !entry.hasActed) {
        addSource(entry.combatantId);
      }
    }

    return {
      playerFutureSightCols: playerCols.size > 0 ? playerCols : undefined,
      enemyFutureSightCols: enemyCols.size > 0 ? enemyCols : undefined,
    };
  }, [state.pendingFutureSights, state.combatants, state.turnOrder]);

  // Simulate enemy intents during player turn for the preview display
  const enemyIntents = useMemo(() => {
    if (phase !== "player_turn" || state.phase !== "ongoing") return null;
    return simulateEnemyIntents(state);
  }, [state, phase]);

  // Cache last intents so the turn order bar layout stays stable during enemy turns
  // (visibility toggles instead of DOM removal → no width jitter)
  const cachedIntentsRef = useRef<Map<string, EnemyIntent[]> | null>(null);
  if (enemyIntents !== null) {
    cachedIntentsRef.current = enemyIntents;
  } else if (state.phase !== "ongoing") {
    cachedIntentsRef.current = null;
  }
  const intentsForLayout = enemyIntents ?? cachedIntentsRef.current;
  const intentsVisible = phase === "player_turn";

  // ── Capture mechanic (recruit battles) ──────────────────────────────
  const [capturePhase, setCapturePhase] = useState<'idle' | 'animating' | 'done'>('idle');
  const captureGlowRef = useRef<HTMLDivElement>(null);
  // Track if we've already called onBattleEnd for this game over state
  // (shared by capture flow, victory flow, and defeat flow)
  const battleEndCalledRef = useRef(false);

  // Capture availability — computed every render (not memoized) because the
  // engine mutates combatant HP in place, so memo deps like `enemies` don't
  // change reference and would produce stale results.
  const captureEnemy = isRecruitBattle
    ? state.combatants.find(c => c.side === 'enemy' && c.alive)
    : null;
  const captureAvailable =
    isRecruitBattle &&
    capturePhase === 'idle' &&
    state.phase === 'ongoing' &&
    !!captureEnemy &&
    captureEnemy.hp / captureEnemy.maxHp < 0.4;
  const captureTargetId = captureEnemy?.id ?? null;

  const handleCapture = useCallback(() => {
    if (!captureAvailable) return;
    setCapturePhase('animating');
    playSound('win_battle');
  }, [captureAvailable]);

  // Capture animation: brighten → shrink → fire onBattleEnd
  useEffect(() => {
    if (capturePhase !== 'animating' || !captureTargetId) return;

    const spriteEl = document.querySelector(
      `[data-sprite-id="${captureTargetId}"]`,
    ) as HTMLElement | null;

    let rafId: number;
    const start = performance.now();
    const duration = makeDelay(1500) || 1; // avoid /0 in E2E

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);

      if (spriteEl) {
        if (t < 0.6) {
          // Phase 1: brighten + slight scale up
          const brightness = 1 + (t / 0.6) * 3;
          const scale = 1 + (t / 0.6) * 0.05;
          spriteEl.style.filter = `brightness(${brightness})`;
          spriteEl.style.transform = `scale(${scale})`;
          spriteEl.style.opacity = '1';
        } else {
          // Phase 2: shrink + fade out, brightness eases back
          const p = (t - 0.6) / 0.4;
          const brightness = 4 - p * 2;
          const scale = 1.05 * (1 - p);
          const opacity = 1 - p;
          spriteEl.style.filter = `brightness(${brightness})`;
          spriteEl.style.transform = `scale(${scale})`;
          spriteEl.style.opacity = `${opacity}`;
        }
      }

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Animation complete — trigger victory
        setCapturePhase('done');
        if (onBattleEnd && !battleEndCalledRef.current) {
          battleEndCalledRef.current = true;
          onBattleEnd('victory', state.combatants, state.goldEarned);
        }
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      // Reset sprite styles on cleanup
      if (spriteEl) {
        spriteEl.style.filter = '';
        spriteEl.style.transform = '';
        spriteEl.style.opacity = '';
      }
    };
  }, [capturePhase, captureTargetId, onBattleEnd, state.combatants, state.goldEarned]);

  // Compute global sprite scale: if any Pokemon exceeds the cap, ALL scale down proportionally
  const spriteScale = useMemo(
    () => getBattleSpriteScale(state.combatants.map((c) => c.pokemonId)),
    [state.combatants],
  );

  // Inspection state - track which combatant is being inspected
  const [inspectedCombatantId, setInspectedCombatantId] = useState<
    string | null
  >(null);

  // Pile viewer state: store combatantId so pile auto-closes when combatant changes (derived, no effect)
  const [openPileState, setOpenPileState] = useState<{
    combatantId: string;
    pile: "draw" | "discard" | "vanished";
  } | null>(null);
  const openPile =
    openPileState && openPileState.combatantId === currentCombatant?.id
      ? openPileState.pile
      : null;
  const togglePile = useCallback(
    (pile: "draw" | "discard" | "vanished") => {
      if (!currentCombatant) return;
      setOpenPileState((prev) =>
        prev && prev.combatantId === currentCombatant.id && prev.pile === pile
          ? null
          : { combatantId: currentCombatant.id, pile },
      );
    },
    [currentCombatant],
  );

  // Switch position mode: store combatantId so mode auto-cancels when combatant changes (derived, no effect)
  const [switchModeCombatantId, setSwitchModeCombatantId] = useState<
    string | null
  >(null);
  const switchMode =
    switchModeCombatantId !== null &&
    switchModeCombatantId === currentCombatant?.id;

  // Drag-and-drop state (declared early — referenced by enemy hover logic)
  const [draggingCardIndex, setDraggingCardIndex] = useState<number | null>(
    null,
  );
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  // Enemy hand preview state
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  // Bidirectional turn order ↔ sprite hover linking
  const [linkedHoverId, setLinkedHoverId] = useState<string | null>(null);

  const handleEnemySpriteEnter = useCallback(
    (combatant: Combatant) => {
      if (
        phase === "player_turn" &&
        pendingCardIndex === null &&
        draggingCardIndex === null &&
        !switchMode &&
        combatant.side === "enemy" &&
        combatant.alive &&
        combatant.hand.length > 0
      ) {
        setHoveredEnemyId(combatant.id);
      }
    },
    [phase, pendingCardIndex, draggingCardIndex, switchMode],
  );

  const handleEnemySpriteLeave = useCallback(() => {
    setHoveredEnemyId(null);
  }, []);

  // Derive displayed hover: only show when conditions allow (no effect needed)
  const displayHoveredEnemyId =
    phase === "player_turn" &&
    pendingCardIndex === null &&
    draggingCardIndex === null &&
    !switchMode
      ? hoveredEnemyId
      : null;

  // Compute valid switch targets when in switch mode
  const switchTargetPositions = useMemo(() => {
    if (!switchMode || !isPlayerTurn || !currentCombatant) return [];
    return getValidSwitchTargets(state, currentCombatant);
  }, [switchMode, isPlayerTurn, currentCombatant, state]);

  const handleSwitchSelect = useCallback(
    (pos: Position) => {
      onSwitchPosition?.(pos);
      setSwitchModeCombatantId(null);
    },
    [onSwitchPosition],
  );

  const handleDeselectCard = useCallback(
    () => onSelectCard(null),
    [onSelectCard],
  );

  const handleCancelSwitchMode = useCallback(
    () => setSwitchModeCombatantId(null),
    [],
  );

  const handleToggleDraw = useCallback(() => togglePile("draw"), [togglePile]);
  const handleToggleDiscard = useCallback(
    () => togglePile("discard"),
    [togglePile],
  );
  const handleToggleVanished = useCallback(
    () => togglePile("vanished"),
    [togglePile],
  );

  const handleSwitchButtonClick = useCallback(() => {
    if (switchMode) {
      setSwitchModeCombatantId(null);
    } else {
      setSwitchModeCombatantId(currentCombatant?.id ?? null);
      onSelectCard(null);
    }
  }, [switchMode, currentCombatant?.id, onSelectCard]);

  const unplayableCardIndices = useMemo(() => {
    if (!currentCombatant) return new Set<number>();
    const indices = new Set<number>();
    currentCombatant.hand.forEach((cardId, idx) => {
      const card = getMove(cardId);
      if (
        getCardValidTargets(state, currentCombatant, card).length === 0 ||
        !checkItemPlayRestriction(currentCombatant, card)
      ) {
        indices.add(idx);
      }
    });
    return indices;
  }, [state, currentCombatant]);

  const shouldFlashEndTurn =
    isPlayerTurn &&
    !!currentCombatant &&
    getPlayableCards(currentCombatant).length === 0;

  // Cancel switch mode on Escape
  useEffect(() => {
    if (!switchMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwitchModeCombatantId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [switchMode]);

  // Battlefield scaling: measure the content and scale to fit the available area
  const PLAYER_OFFSET_Y = 60; // player grid pushed down relative to enemy
  const battlefieldContentRef = useRef<HTMLDivElement>(null);
  const battlefieldContainerRef = useRef<HTMLDivElement>(null);
  const [battlefieldScale, setBattlefieldScale] = useState(1);

  useEffect(() => {
    const content = battlefieldContentRef.current;
    const container = battlefieldContainerRef.current;
    if (!content || !container) return;

    const measure = () => {
      content.style.transform = "none";
      requestAnimationFrame(() => {
        const contentHeight = content.scrollHeight + PLAYER_OFFSET_Y;
        const contentWidth = content.scrollWidth;
        const availableHeight = container.clientHeight;
        const availableWidth = container.clientWidth;
        const scale = Math.min(
          1,
          availableHeight / contentHeight,
          availableWidth / contentWidth,
        );
        setBattlefieldScale(scale);
        content.style.transform = scale < 1 ? `scale(${scale})` : "none";
      });
    };

    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Ref to hand display for capturing card positions
  const handDisplayRef = useRef<HandDisplayRef>(null);

  // Battle effects for visual feedback (moved up to be available in handlers)
  const battleEffects = useBattleEffects();
  // Destructure stable callbacks for use in effect dependency arrays.
  // Using the whole `battleEffects` object as a dep causes effects to re-run every
  // render because the object contains state arrays that change on each animation event.
  const {
    addEvent,
    showCardPlayed,
    triggerCardFly,
    triggerStatusApplied,
    triggerRewind,
    triggerSandStream,
  } = battleEffects;
  const processedLogsRef = useRef<number>(0);

  // Status diff tracking: detect new/increased statuses by comparing snapshots
  type StatusSnapshot = Map<string, Map<string, number>>; // combatantId → (statusType → stacks)
  const prevStatusRef = useRef<StatusSnapshot>(new Map());
  const prevAliveRef = useRef<Map<string, boolean>>(new Map());

  // Get screen position for a combatant (for floating numbers and card fly animations)
  // Uses actual DOM element positions via data-sprite-id attributes for accuracy
  const getPositionForCombatant = useCallback(
    (combatantId: string): { x: number; y: number } | null => {
      // Try to get actual DOM position from the sprite element
      const spriteEl = document.querySelector(
        `[data-sprite-id="${combatantId}"]`,
      );
      if (spriteEl) {
        const rect = spriteEl.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      // Fallback to approximate calculation if DOM element not found
      const combatant = state.combatants.find((c) => c.id === combatantId);
      if (!combatant) return null;

      const isPlayer = combatant.side === "player";
      const col = combatant.position.column;
      const row = combatant.position.row;

      const centerX = window.innerWidth / 2;
      const colOffset = (col - 1) * 170;
      const sideOffset = isPlayer ? -250 : 250;

      const baseY = isPlayer ? 320 : 180;
      const rowOffset = row === "back" ? (isPlayer ? 60 : -40) : 0;

      return {
        x: centerX + sideOffset + colOffset,
        y: baseY + rowOffset + col * 15,
      };
    },
    [state.combatants],
  );

  // Find the RunPokemon for an inspected player combatant
  const getRunPokemonForCombatant = (combatant: Combatant) => {
    if (!runState || combatant.side !== "player") return null;
    // Match by formId + position to handle duplicates and recruit 1v1 battles
    return (
      runState.party.find(
        (p) =>
          p.formId === combatant.pokemonId &&
          p.position.row === combatant.position.row &&
          p.position.column === combatant.position.column,
      ) ??
      runState.party.find((p) => p.formId === combatant.pokemonId) ??
      null
    );
  };

  const inspectedCombatant = inspectedCombatantId
    ? (state.combatants.find((c) => c.id === inspectedCombatantId) ?? null)
    : null;
  const inspectedRunPokemon = inspectedCombatant
    ? getRunPokemonForCombatant(inspectedCombatant)
    : null;

  // Handle Pokemon inspection (both player and enemy)
  const handleInspect = (combatant: Combatant) => {
    setInspectedCombatantId(combatant.id);
  };

  const handleCloseInspection = () => {
    setInspectedCombatantId(null);
  };

  // Navigate to a different player Pokemon in inspection
  const handleNavigateInspection = (newIndex: number) => {
    // Find the player combatant at this slot index
    const targetCombatant = players.find((c) => c.slotIndex === newIndex);
    if (targetCombatant) {
      setInspectedCombatantId(targetCombatant.id);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = useCallback(
    (cardIndex: number) => {
      if (!isPlayerTurn || !currentCombatant) return;
      setDraggingCardIndex(cardIndex);
      // Clear any pending click selection
      onSelectCard(null);
    },
    [isPlayerTurn, currentCombatant, onSelectCard],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingCardIndex(null);
    setHoveredTargetId(null);
  }, []);

  const handleDragEnterTarget = useCallback((targetId: string) => {
    setHoveredTargetId(targetId);
  }, []);

  const handleDragLeaveTarget = useCallback(() => {
    setHoveredTargetId(null);
  }, []);

  const handleDropOnTarget = useCallback(
    (targetId: string) => {
      if (draggingCardIndex === null || !currentCombatant) return;

      // Capture card position BEFORE playing
      const cardPos =
        handDisplayRef.current?.getCardPosition(draggingCardIndex);
      const cardId = currentCombatant.hand[draggingCardIndex];
      const card = getMove(cardId);

      // Determine which targets to animate to based on card range
      let targetPositions: { x: number; y: number }[] = [];
      if (isAoERange(card.range)) {
        // AoE: resolve actual hit targets based on selected target's position
        const aliveEnemies = state.combatants.filter(
          (c) => c.alive && c.side !== currentCombatant.side,
        );
        const selectedTarget = aliveEnemies.find((e) => e.id === targetId);
        let actualTargets: typeof aliveEnemies;

        if (card.range === "column" && selectedTarget) {
          actualTargets = aliveEnemies.filter(
            (c) => c.position.column === selectedTarget.position.column,
          );
        } else if (card.range === "any_row" && selectedTarget) {
          actualTargets = aliveEnemies.filter(
            (c) => c.position.row === selectedTarget.position.row,
          );
        } else {
          actualTargets = getValidTargets(state, currentCombatant, card.range);
        }

        targetPositions = actualTargets
          .map((t) => getPositionForCombatant(t.id))
          .filter((p): p is { x: number; y: number } => p !== null);
      } else {
        // Single target: animate only to the selected target
        const pos = getPositionForCombatant(targetId);
        if (pos) targetPositions = [pos];
      }

      // Check if this is a pure block/defend card (no damage effects)
      const hasDamage = card.effects.some((e) =>
        [
          "damage",
          "multi_hit",
          "recoil",
          "heal_on_hit",
          "self_ko",
          "set_damage",
          "percent_hp",
        ].includes(e.type),
      );
      const isBlockCard =
        !hasDamage && card.effects.some((e) => e.type === "block");

      // Trigger card fly animation if we have positions
      if (cardPos && targetPositions.length > 0) {
        triggerCardFly({
          cardName: card.name,
          cardType: card.type,
          startPos: cardPos,
          targetPositions,
          isBlockCard,
        });
      }

      // Trigger vanish animation — must capture ghost BEFORE state update removes the card
      const isNativeVanish = card.vanish;
      const isConsumingFlame =
        !card.vanish && shouldConsumingFlameVanish(currentCombatant, card);
      if (isNativeVanish) {
        handDisplayRef.current?.triggerVanish(draggingCardIndex);
      } else if (isConsumingFlame) {
        handDisplayRef.current?.triggerVanish(draggingCardIndex, true);
      }

      // Directly play the card (bypasses two-step selection to avoid flash of "Select target" message)
      if (onPlayCard) {
        onPlayCard(draggingCardIndex, targetId);
      } else {
        // Fallback to two-step if onPlayCard not provided
        onSelectCard(draggingCardIndex);
        setTimeout(() => onSelectTarget(targetId), 0);
      }

      // Reset drag state
      setDraggingCardIndex(null);
      setHoveredTargetId(null);
    },
    [
      draggingCardIndex,
      currentCombatant,
      onPlayCard,
      onSelectCard,
      onSelectTarget,
      state,
      triggerCardFly,
      getPositionForCombatant,
    ],
  );

  // Calculate damage previews for all valid targets when dragging OR when a card is selected
  const { dragTargetableIds, damagePreviews, activeCardRange } = useMemo(() => {
    // Show previews for either dragging or click-selected card
    const activeCardIndex = draggingCardIndex ?? pendingCardIndex;

    if (activeCardIndex === null || !isPlayerTurn || !currentCombatant) {
      return {
        dragTargetableIds: new Set<string>(),
        damagePreviews: new Map<string, DamagePreview | null>(),
        activeCardRange: undefined as MoveRange | undefined,
      };
    }

    const cardId = currentCombatant.hand[activeCardIndex];
    const card = getMove(cardId);
    const validTargets = getCardValidTargets(state, currentCombatant, card);

    // Calculate damage preview for each valid target
    const previews = new Map<string, DamagePreview | null>();
    for (const target of validTargets) {
      const preview = calculateDamagePreview(
        state,
        currentCombatant,
        target,
        card,
      );
      previews.set(target.id, preview);
    }

    return {
      dragTargetableIds: new Set(validTargets.map((t) => t.id)),
      damagePreviews: previews,
      activeCardRange: card.range,
    };
  }, [
    draggingCardIndex,
    pendingCardIndex,
    isPlayerTurn,
    currentCombatant,
    state,
  ]);

  // For AoE cards, expand hover highlighting to all targets that would be hit
  const { affectedHoverIds, visibleDamagePreviews } = useMemo(() => {
    if (!hoveredTargetId) {
      return {
        affectedHoverIds: new Set<string>(),
        visibleDamagePreviews: damagePreviews,
      };
    }

    const hoveredTarget = state.combatants.find(
      (c) => c.id === hoveredTargetId,
    );
    if (!hoveredTarget) {
      return {
        affectedHoverIds: new Set([hoveredTargetId]),
        visibleDamagePreviews: damagePreviews,
      };
    }

    const enemies = state.combatants.filter(
      (c) => c.alive && c.side === "enemy",
    );
    let affectedIds: Set<string>;

    if (activeCardRange === "column") {
      affectedIds = new Set(
        enemies
          .filter((c) => c.position.column === hoveredTarget.position.column)
          .map((c) => c.id),
      );
    } else if (activeCardRange === "any_row") {
      affectedIds = new Set(
        enemies
          .filter((c) => c.position.row === hoveredTarget.position.row)
          .map((c) => c.id),
      );
    } else if (
      activeCardRange === "front_row" ||
      activeCardRange === "back_row" ||
      activeCardRange === "all_enemies"
    ) {
      // All valid targets are affected
      affectedIds = dragTargetableIds;
    } else {
      affectedIds = new Set([hoveredTargetId]);
    }

    // Filter damage previews to only affected targets
    const filtered = new Map<string, DamagePreview | null>();
    for (const id of affectedIds) {
      if (damagePreviews.has(id)) {
        filtered.set(id, damagePreviews.get(id)!);
      }
    }

    return { affectedHoverIds: affectedIds, visibleDamagePreviews: filtered };
  }, [
    hoveredTargetId,
    activeCardRange,
    state.combatants,
    damagePreviews,
    dragTargetableIds,
  ]);

  // Parse new logs to trigger visual effects and sound
  useEffect(() => {
    const newLogs = logs.slice(processedLogsRef.current);
    processedLogsRef.current = logs.length;

    // Track the current card being played so damage/heal/block sounds
    // can reference the card's contact flag for physical vs special
    let currentCardDef: MoveDefinition | undefined;

    // Deduplicate sounds within this batch — AoE hits and passive triggers
    // can produce many logs of the same type; play each sound at most once.
    const playedSounds = new Set<SoundEffect>();
    const playSoundOnce = (sound: SoundEffect) => {
      if (!playedSounds.has(sound)) {
        playedSounds.add(sound);
        playSound(sound);
      }
    };

    // Deduplicate Sand Stream animations — one per source per batch
    const sandStreamTriggered = new Set<string>();

    for (let i = 0; i < newLogs.length; i++) {
      const log = newLogs[i];

      // Parse card played first so currentCardDef is set before damage/heal/block
      const cardMatch = log.message.match(/^(.+?) plays (.+?) \(cost/i);
      if (cardMatch) {
        const sourceName = cardMatch[1];
        const cardName = cardMatch[2];
        // Track current card definition for sound categorization
        currentCardDef = Object.values(MOVES).find((m) => m.name === cardName);
        showCardPlayed(sourceName, cardName);

        // For enemy cards, trigger card fly animation
        const source = state.combatants.find((c) => c.id === log.combatantId);
        if (source && source.side === "enemy") {
          const sourcePos = getPositionForCombatant(source.id);
          if (sourcePos) {
            const hasDamage =
              currentCardDef?.effects.some((e) =>
                [
                  "damage",
                  "multi_hit",
                  "recoil",
                  "heal_on_hit",
                  "self_ko",
                  "set_damage",
                  "percent_hp",
                ].includes(e.type),
              ) ?? false;
            const isBlockCard =
              !hasDamage &&
              (currentCardDef?.effects.some((e) => e.type === "block") ??
                false);
            const cardType = currentCardDef?.type ?? "normal";

            if (isBlockCard) {
              // Shield animation at enemy's own position (no beam)
              triggerCardFly({
                cardName,
                cardType,
                startPos: sourcePos,
                targetPositions: [sourcePos],
                isBlockCard: true,
              });
            } else {
              // Attack: scan ahead for damage targets in this batch
              const targetIds = new Set<string>();
              for (let j = i + 1; j < newLogs.length; j++) {
                const futureLog = newLogs[j];
                // Stop at next card play
                if (futureLog.message.match(/plays .+? \(cost/i)) break;
                // Collect damage target combatant IDs
                if (
                  futureLog.message.match(/takes \d+.*damage/i) &&
                  futureLog.combatantId
                ) {
                  targetIds.add(futureLog.combatantId);
                }
              }

              const targetPositions = [...targetIds]
                .map((id) => getPositionForCombatant(id))
                .filter((p): p is { x: number; y: number } => p !== null);

              if (targetPositions.length > 0) {
                triggerCardFly({
                  cardName,
                  cardType,
                  startPos: sourcePos,
                  targetPositions,
                  isBlockCard: false,
                });
              }
            }
          }
        }
      }

      // Parse self-KO charging: "X is charging Card Name!"
      const chargingMatch = log.message.match(/^(.+?) is charging (.+?)!$/i);
      if (chargingMatch) {
        const sourceName = chargingMatch[1];
        const cardName = chargingMatch[2];
        showCardPlayed(sourceName, cardName, "CHARGING...");
      }

      // Parse self-KO detonation: "X's Card Name detonates!"
      const detonateMatch = log.message.match(/^(.+?)'s (.+?) detonates!$/i);
      if (detonateMatch) {
        const sourceName = detonateMatch[1];
        const cardName = detonateMatch[2];
        showCardPlayed(sourceName, cardName, "DETONATING!");
      }

      // Parse damage: "X takes Y damage" (most common pattern)
      const damageMatch = log.message.match(/takes (\d+)(?: \w+)? damage/i);
      // Also match multi-hit: "is hit X times for Y total damage"
      const multiHitMatch = log.message.match(
        /is hit \d+ times for (\d+) total damage/i,
      );
      // Also match status damage: "Burn/Poison/Leech deals X damage to Y"
      const statusDamageMatch = log.message.match(
        /deals (\d+) damage to (\w+)/i,
      );

      if (damageMatch || multiHitMatch) {
        const damage = parseInt(damageMatch?.[1] || multiHitMatch?.[1] || "0");
        // Target is in the log's combatantId
        const target = state.combatants.find((c) => c.id === log.combatantId);
        if (target && damage > 0) {
          addEvent({
            type: "damage",
            targetId: target.id,
            value: damage,
          });
          // Play attack sound — skip recoil self-damage (not a card effect hit)
          const isRecoil = log.message.includes("recoil");
          if (!isRecoil) {
            playSoundOnce(
              currentCardDef?.contact ? "physical_attack" : "special_attack",
            );
          }
        }
      } else if (statusDamageMatch) {
        const damage = parseInt(statusDamageMatch[1]);
        const targetName = statusDamageMatch[2];
        const target = state.combatants.find(
          (c) => c.name.toLowerCase() === targetName.toLowerCase(),
        );
        if (target && damage > 0) {
          addEvent({
            type: "damage",
            targetId: target.id,
            value: damage,
          });
          playSoundOnce("debuff");
        }
      }

      // Parse heal: "heals X HP" or "drains X HP"
      const healMatch = log.message.match(/(?:heals|drains) (\d+) HP/i);
      if (healMatch) {
        const heal = parseInt(healMatch[1]);
        const target = state.combatants.find((c) => c.id === log.combatantId);
        if (target && heal > 0) {
          addEvent({
            type: "heal",
            targetId: target.id,
            value: heal,
          });
          playSoundOnce("heal");
        }
      }

      // Parse block: "gains X Block"
      const blockMatch = log.message.match(/gains (\d+) Block/i);
      if (blockMatch) {
        const block = parseInt(blockMatch[1]);
        const target = state.combatants.find((c) => c.id === log.combatantId);
        if (target && block > 0) {
          addEvent({
            type: "block",
            targetId: target.id,
            value: block,
          });
          playSoundOnce("block");
        }
      }

      // Parse card draw: "draws X card"
      const drawMatch = log.message.match(/draws (\d+) card/i);
      if (drawMatch) {
        playSoundOnce("draw_card");
      }

      // Parse passive energy gain: "Moxie: X gains Y energy"
      const energyGainMatch = log.message.match(/gains (\d+) energy/i);
      if (energyGainMatch) {
        const energy = parseInt(energyGainMatch[1]);
        const source = state.combatants.find((c) => c.id === log.combatantId);
        if (source && energy > 0) {
          addEvent({
            type: "energy",
            targetId: source.id,
            value: energy,
          });
          playSoundOnce("raise_stat");
        }
      }

      // Parse Future Sight resolution: "Future Sight: X's foreseen attack strikes!"
      const fsStrikeMatch = log.message.match(
        /^Future Sight: (.+?)'s foreseen attack strikes!$/i,
      );
      if (fsStrikeMatch) {
        const sourceName = fsStrikeMatch[1];
        const source = state.combatants.find((c) => c.name === sourceName);
        if (source) {
          const sourcePos = getPositionForCombatant(source.id);
          if (sourcePos) {
            // Scan ahead for "Future Sight: Y takes Z damage!" to find targets
            const targetIds = new Set<string>();
            for (let j = i + 1; j < newLogs.length; j++) {
              const futureLog = newLogs[j];
              const fsDmg = futureLog.message.match(
                /^Future Sight: (.+?) takes \d+ damage!$/i,
              );
              if (fsDmg) {
                const targetName = fsDmg[1];
                const target = state.combatants.find(
                  (c) => c.name === targetName,
                );
                if (target) targetIds.add(target.id);
              } else if (
                !futureLog.message.startsWith("Future Sight:") &&
                !futureLog.message.match(/was KO'd by Future Sight/)
              ) {
                break; // End of Future Sight log cluster
              }
            }

            const targetPositions = [...targetIds]
              .map((id) => getPositionForCombatant(id))
              .filter((p): p is { x: number; y: number } => p !== null);

            if (targetPositions.length > 0) {
              showCardPlayed(sourceName, "Future Sight", "STRIKES!");
              triggerCardFly({
                cardName: "Future Sight",
                cardType: "psychic" as MoveType,
                startPos: sourcePos,
                targetPositions,
                isBlockCard: false,
              });
            }
          }
        }
      }

      // Parse Rewind: "Rewind: X reverts to their previous state!"
      const rewindMatch = log.message.match(/^Rewind: (.+?) reverts/i);
      if (rewindMatch) {
        // combatantId is the rewound ally (not the switcher)
        triggerRewind(log.combatantId);
      }

      // Parse Sand Stream: "Sand Stream: X's sandstorm deals N damage to Y!"
      // Only trigger the animation on the FIRST log for each source (scan ahead collects all targets)
      const sandStreamMatch = log.message.match(
        /^Sand Stream: (.+?)'s sandstorm deals (\d+) damage to (.+?)!$/i,
      );
      if (sandStreamMatch && !sandStreamTriggered.has(sandStreamMatch[1])) {
        const sourceName = sandStreamMatch[1];
        sandStreamTriggered.add(sourceName);
        const damage = parseInt(sandStreamMatch[2], 10);
        const source = state.combatants.find((c) => c.name === sourceName);
        if (source) {
          // Collect all Sand Stream damage targets from this batch of logs
          const targetIds = new Set<string>();
          const targetName = sandStreamMatch[3];
          const target = state.combatants.find((c) => c.name === targetName);
          if (target) targetIds.add(target.id);

          // Scan ahead for more Sand Stream hits from the same source
          for (let j = i + 1; j < newLogs.length; j++) {
            const nextSsMatch = newLogs[j].message.match(
              /^Sand Stream: (.+?)'s sandstorm deals \d+ damage to (.+?)!$/i,
            );
            if (nextSsMatch && nextSsMatch[1] === sourceName) {
              const nextTarget = state.combatants.find(
                (c) => c.name === nextSsMatch[2],
              );
              if (nextTarget) targetIds.add(nextTarget.id);
            } else if (!newLogs[j].message.startsWith("Sand Stream:")) {
              break;
            }
          }

          triggerSandStream(source.id, [...targetIds], damage);
        }
      }
    }
  }, [
    logs,
    state.combatants,
    addEvent,
    showCardPlayed,
    triggerCardFly,
    triggerRewind,
    triggerSandStream,
    getPositionForCombatant,
  ]);

  // Detect status changes via state diffing (handles ALL sources: moves, passives, etc.)
  useEffect(() => {
    const currentSnapshot: StatusSnapshot = new Map();
    for (const c of state.combatants) {
      const statusMap = new Map<string, number>();
      for (const s of c.statuses) {
        statusMap.set(s.type, s.stacks);
      }
      currentSnapshot.set(c.id, statusMap);
    }

    const prev = prevStatusRef.current;
    // Only diff if we have a previous snapshot (skip initial render)
    if (prev.size > 0) {
      const BUFF_STATUSES = new Set([
        "strength",
        "haste",
        "evasion",
        "mobile",
        "energize",
        "luck",
      ]);
      const STATUS_CONDITION_TYPES = new Set([
        "burn",
        "poison",
        "paralysis",
        "sleep",
        "leech",
      ]);
      const STAT_LOWER_TYPES = new Set([
        "enfeeble",
        "slow",
        "taunt",
        "provoke",
      ]);
      let statusSoundPlayed = false;
      for (const c of state.combatants) {
        const prevStatuses = prev.get(c.id);
        const currStatuses = currentSnapshot.get(c.id)!;

        for (const [statusType, stacks] of currStatuses) {
          const prevStacks = prevStatuses?.get(statusType) ?? 0;
          if (stacks > prevStacks) {
            // New status or stacks increased — fire animation
            triggerStatusApplied({
              targetId: c.id,
              statusType,
              stacks: stacks - prevStacks,
            });
            // Play one status sound per diff cycle: raise_stat for buffs, debuff for conditions, lower_stat for stat-lower
            if (!statusSoundPlayed) {
              if (BUFF_STATUSES.has(statusType)) {
                playSound("raise_stat");
                statusSoundPlayed = true;
              } else if (STATUS_CONDITION_TYPES.has(statusType)) {
                playSound("debuff");
                statusSoundPlayed = true;
              } else if (STAT_LOWER_TYPES.has(statusType)) {
                playSound("lower_stat");
                statusSoundPlayed = true;
              }
            }
          }
        }
      }
    }

    prevStatusRef.current = currentSnapshot;
  }, [state.combatants, triggerStatusApplied]);

  // Detect faints via combatant alive diffing (handles ALL defeat sources: cards, status, recoil, self-KO)
  useEffect(() => {
    const currentAlive = new Map<string, boolean>();
    for (const c of state.combatants) {
      currentAlive.set(c.id, c.alive);
    }
    const prev = prevAliveRef.current;
    if (prev.size > 0) {
      for (const c of state.combatants) {
        if (prev.get(c.id) === true && !c.alive) {
          playSound("lower_stat");
          break; // Play once per diff cycle
        }
      }
    }
    prevAliveRef.current = currentAlive;
  }, [state]);

  // Calculate targetable combatants based on pending card's range
  const { needsTarget, targetableIds, rangeLabel } = useMemo(() => {
    if (pendingCardIndex === null || !isPlayerTurn || !currentCombatant) {
      return {
        needsTarget: false,
        targetableIds: new Set<string>(),
        rangeLabel: "",
      };
    }

    const cardId = currentCombatant.hand[pendingCardIndex];
    if (!cardId)
      return {
        needsTarget: false,
        targetableIds: new Set<string>(),
        rangeLabel: "",
      };
    const card = getMove(cardId);
    const validTargets = getCardValidTargets(state, currentCombatant, card);

    // Check if this range requires manual target selection
    if (!requiresTargetSelection(card.range, currentCombatant)) {
      // AoE or self - no target needed, auto-play
      return {
        needsTarget: false,
        targetableIds: new Set<string>(),
        rangeLabel: "",
      };
    }

    // Auto-select if only one valid target
    if (validTargets.length === 1) {
      // Will be handled in useEffect or callback
      return {
        needsTarget: false,
        targetableIds: new Set<string>(),
        rangeLabel: "",
      };
    }

    if (validTargets.length === 0) {
      return {
        needsTarget: false,
        targetableIds: new Set<string>(),
        rangeLabel: "No valid targets!",
      };
    }

    // Create label based on range
    let label = "Select a target";
    if (card.range === "front_enemy") label = "Select front row target";
    else if (card.range === "back_enemy") label = "Select back row target";
    else if (card.range === "column") label = "Select target (hits column)";

    return {
      needsTarget: true,
      targetableIds: new Set(validTargets.map((t) => t.id)),
      rangeLabel: label,
    };
  }, [pendingCardIndex, isPlayerTurn, currentCombatant, state]);

  // Wrapper to trigger card fly animation before selecting target (click-to-play path)
  const triggerCardFlyAndSelectTarget = useCallback(
    (targetId: string) => {
      if (pendingCardIndex === null || !currentCombatant) {
        onSelectTarget(targetId);
        return;
      }

      // Capture card position BEFORE playing
      const cardPos = handDisplayRef.current?.getCardPosition(pendingCardIndex);
      const cardId = currentCombatant.hand[pendingCardIndex];
      if (!cardId) {
        onSelectTarget(targetId);
        return;
      }
      const card = getMove(cardId);

      // Determine which targets to animate to based on card range
      let targetPositions: { x: number; y: number }[] = [];
      if (isAoERange(card.range)) {
        // AoE: resolve actual hit targets based on selected target's position
        const enemies = state.combatants.filter(
          (c) => c.alive && c.side !== currentCombatant.side,
        );
        const selectedTarget = enemies.find((e) => e.id === targetId);
        let actualTargets: typeof enemies;

        if (card.range === "column" && selectedTarget) {
          // Column: enemies in same column as selected target
          actualTargets = enemies.filter(
            (c) => c.position.column === selectedTarget.position.column,
          );
        } else if (card.range === "any_row" && selectedTarget) {
          // Row: enemies in same row as selected target
          actualTargets = enemies.filter(
            (c) => c.position.row === selectedTarget.position.row,
          );
        } else {
          // front_row, back_row, all_enemies: use getValidTargets directly
          actualTargets = getValidTargets(state, currentCombatant, card.range);
        }

        targetPositions = actualTargets
          .map((t) => getPositionForCombatant(t.id))
          .filter((p): p is { x: number; y: number } => p !== null);
      } else if (card.range === "self") {
        // Self-targeting: animate to self
        const pos = getPositionForCombatant(currentCombatant.id);
        if (pos) targetPositions = [pos];
      } else if (targetId) {
        // Single target: animate only to the selected target
        const pos = getPositionForCombatant(targetId);
        if (pos) targetPositions = [pos];
      }

      // Check if this is a pure block/defend card (no damage effects)
      const hasDamage = card.effects.some((e) =>
        [
          "damage",
          "multi_hit",
          "recoil",
          "heal_on_hit",
          "self_ko",
          "set_damage",
          "percent_hp",
        ].includes(e.type),
      );
      const isBlockCard =
        !hasDamage && card.effects.some((e) => e.type === "block");

      // Trigger card fly animation if we have positions
      if (cardPos && targetPositions.length > 0) {
        triggerCardFly({
          cardName: card.name,
          cardType: card.type,
          startPos: cardPos,
          targetPositions,
          isBlockCard,
        });
      }

      // Trigger vanish animation — must capture ghost BEFORE state update removes the card
      const isNativeVanish = card.vanish;
      const isConsumingFlame =
        !card.vanish && shouldConsumingFlameVanish(currentCombatant, card);
      if (isNativeVanish && pendingCardIndex !== null) {
        handDisplayRef.current?.triggerVanish(pendingCardIndex);
      } else if (isConsumingFlame && pendingCardIndex !== null) {
        handDisplayRef.current?.triggerVanish(pendingCardIndex, true);
      }

      onSelectTarget(targetId);
    },
    [
      pendingCardIndex,
      currentCombatant,
      state,
      triggerCardFly,
      getPositionForCombatant,
      onSelectTarget,
    ],
  );

  // Handle auto-target selection for single valid target or AoE
  useEffect(() => {
    if (pendingCardIndex === null || !isPlayerTurn || !currentCombatant) return;

    const cardId = currentCombatant.hand[pendingCardIndex];
    if (!cardId) return; // Hand may have changed since pendingCardIndex was set
    const card = getMove(cardId);
    const validTargets = getCardValidTargets(state, currentCombatant, card);

    // AoE or self - auto-play without target
    if (!requiresTargetSelection(card.range, currentCombatant)) {
      triggerCardFlyAndSelectTarget("");
      return;
    }

    // Auto-select if only one valid target
    if (validTargets.length === 1) {
      triggerCardFlyAndSelectTarget(validTargets[0].id);
    }
  }, [
    pendingCardIndex,
    isPlayerTurn,
    currentCombatant,
    state,
    triggerCardFlyAndSelectTarget,
  ]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (!isPlayerTurn) return;
      if (pendingCardIndex === index) {
        onSelectCard(null); // deselect
      } else {
        onSelectCard(index);
      }
    },
    [isPlayerTurn, pendingCardIndex, onSelectCard],
  );

  const gameOver = phase === "victory" || phase === "defeat";

  // Victory celebration stages: 'celebrating' -> 'draft_message' -> 'transitioning'
  const [victoryStage, setVictoryStage] = useState<
    "celebrating" | "draft_message" | "transitioning" | null
  >(null);

  // Sync victory stage with phase during render (no effect; React allows setState when adjusting to prop/state change)
  if (phase === "victory" && victoryStage === null) {
    setVictoryStage("celebrating");
  } else if (phase !== "victory" && victoryStage !== null) {
    setVictoryStage(null);
  }

  // Progress through victory stages
  useEffect(() => {
    if (victoryStage === "celebrating") {
      playSound("win_battle");
      const timer = setTimeout(
        () => setVictoryStage("draft_message"),
        makeDelay(1000),
      );
      return () => clearTimeout(timer);
    }
    if (victoryStage === "draft_message") {
      const timer = setTimeout(
        () => setVictoryStage("transitioning"),
        makeDelay(1200),
      );
      return () => clearTimeout(timer);
    }
    if (
      victoryStage === "transitioning" &&
      onBattleEnd &&
      !battleEndCalledRef.current
    ) {
      battleEndCalledRef.current = true;
      // In recruit battles, KO = defeat (pokemon fled). Only capture counts.
      const result = isRecruitBattle ? "defeat" : "victory";
      onBattleEnd(result, state.combatants, state.goldEarned);
    }
  }, [victoryStage, onBattleEnd, state.combatants, state.goldEarned, isRecruitBattle]);

  // Handle defeat immediately (no celebration needed)
  useEffect(() => {
    if (phase === "defeat" && onBattleEnd && !battleEndCalledRef.current) {
      battleEndCalledRef.current = true;
      onBattleEnd("defeat", state.combatants, state.goldEarned);
    }
    // Reset ref when game is not over (for next battle)
    if (!gameOver) {
      battleEndCalledRef.current = false;
    }
  }, [gameOver, phase, state.combatants, state.goldEarned, onBattleEnd]);

  const act = runState?.currentAct ?? 1;
  const [battleBackground, setBattleBackground] = useState<string>(() => {
    // Use campaign-specific combat background if available, otherwise default to C1 act 1
    const campaignBg = runState
      ? getRunActMapConfig(runState).combatBackgroundImage
      : null;
    return campaignBg ?? battleBgAct1;
  });

  useEffect(() => {
    // Campaign-specific combat background takes priority (variant-aware via getRunActMapConfig)
    const campaignBg = runState
      ? getRunActMapConfig(runState).combatBackgroundImage
      : null;
    if (campaignBg) {
      setBattleBackground(campaignBg);
      return;
    }
    // Campaign 1 fallback — lazy-load act backgrounds to avoid bundling everything upfront
    if (act === 1) {
      setBattleBackground(battleBgAct1);
      return;
    }
    if (act === 2) {
      import("../../../assets/backgrounds/rocket_lab_act_2.png").then((m) =>
        setBattleBackground(m.default),
      );
      return;
    }
    import("../../../assets/backgrounds/rocket_lab_act_3.png").then((m) =>
      setBattleBackground(m.default),
    );
  }, [act, runState]);

  return (
    <div
      style={{
        position: "relative",
        height: "100dvh",
        backgroundImage: `url(${battleBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center 72%",
        color: THEME.text.primary,
        fontFamily: "'Kreon', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Top bar: turn order + reset */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          padding: 8,
          zIndex: 10,
        }}
      >
        <div style={{ flex: 1 }} data-tutorial-id="turn_order">
          <TurnOrderBar
            state={state}
            enemyIntents={intentsForLayout ?? undefined}
            allCombatants={state.combatants}
            intentsVisible={intentsVisible}
            linkedHoverId={linkedHoverId}
            onHoverCombatant={setLinkedHoverId}
          />
        </div>
        {onBackToSandboxConfig && (
          <button
            onClick={onBackToSandboxConfig}
            style={{
              ...THEME.button.secondary,
              padding: "6px 14px",
              fontSize: 14,
              whiteSpace: "nowrap",
              marginRight: 8,
            }}
          >
            ← Config
          </button>
        )}
        <button
          onClick={onRestart}
          style={{
            ...THEME.button.secondary,
            padding: "6px 14px",
            fontSize: 14,
            whiteSpace: "nowrap",
            marginRight: 8,
          }}
        >
          Main Menu
        </button>
      </div>

      {/* Targeting hint */}
      {needsTarget && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: 8,
            background: THEME.status.damage + "25",
            color: "#fca5a5",
            fontSize: 15,
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          {rangeLabel}
          <button
            onClick={handleDeselectCard}
            style={{
              ...THEME.button.secondary,
              marginLeft: 12,
              padding: "2px 8px",
              fontSize: 15,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Switch mode hint */}
      {switchMode && (
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: 8,
            background: "rgba(56, 189, 248, 0.15)",
            color: "#7dd3fc",
            fontSize: 15,
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          Select adjacent position
          <button
            onClick={handleCancelSwitchMode}
            style={{
              ...THEME.button.secondary,
              marginLeft: 12,
              padding: "2px 8px",
              fontSize: 15,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Battlefield - Grid Layout */}
      <div
        ref={battlefieldContainerRef}
        data-tutorial-id="battlefield"
        style={{
          position: "absolute",
          top: 20,
          left: 260,
          right: 0,
          bottom: 190,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Scaling wrapper: scales both grids together to fit the available area */}
        <div
          ref={battlefieldContentRef}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 40,
            transform:
              battlefieldScale < 1 ? `scale(${battlefieldScale})` : undefined,
            transformOrigin: "center center",
          }}
        >
          {/* Player side - shifted down so top Pokemon sit below enemy's top */}
          <div style={{ transform: `translateY(${PLAYER_OFFSET_Y}px)` }}>
            <BattleGrid
              combatants={players}
              allCombatants={state.combatants}
              currentCombatant={currentCombatant}
              targetableIds={
                dragTargetableIds.size > 0 ? dragTargetableIds : targetableIds
              }
              onSelectTarget={triggerCardFlyAndSelectTarget}
              onInspect={handleInspect}
              side="player"
              spriteScale={spriteScale}
              onDragEnterTarget={handleDragEnterTarget}
              onDragLeaveTarget={handleDragLeaveTarget}
              onDropOnTarget={handleDropOnTarget}
              hoveredTargetIds={affectedHoverIds}
              switchTargetPositions={
                switchMode ? switchTargetPositions : undefined
              }
              onSwitchSelect={switchMode ? handleSwitchSelect : undefined}
              futureSightColumns={playerFutureSightCols}
              linkedHoverId={linkedHoverId}
              onHoverCombatant={setLinkedHoverId}
            />
          </div>

          {/* Enemy side */}
          <div>
            <BattleGrid
              combatants={enemies}
              allCombatants={state.combatants}
              currentCombatant={currentCombatant}
              targetableIds={
                dragTargetableIds.size > 0 ? dragTargetableIds : targetableIds
              }
              onSelectTarget={triggerCardFlyAndSelectTarget}
              onInspect={handleInspect}
              side="enemy"
              spriteScale={spriteScale}
              onDragEnterTarget={handleDragEnterTarget}
              onDragLeaveTarget={handleDragLeaveTarget}
              onDropOnTarget={handleDropOnTarget}
              hoveredTargetIds={affectedHoverIds}
              damagePreviews={visibleDamagePreviews}
              onMouseEnterSprite={handleEnemySpriteEnter}
              onMouseLeaveSprite={handleEnemySpriteLeave}
              futureSightColumns={enemyFutureSightCols}
              linkedHoverId={linkedHoverId}
              onHoverCombatant={setLinkedHoverId}
              captureThresholdPercent={isRecruitBattle ? 0.4 : undefined}
            />
          </div>
        </div>
        {/* end scaling wrapper */}

        {/* Enemy hand preview on hover */}
        {displayHoveredEnemyId &&
          (() => {
            const hoveredEnemy = enemies.find(
              (c) => c.id === displayHoveredEnemyId,
            );
            if (
              !hoveredEnemy ||
              !hoveredEnemy.alive ||
              hoveredEnemy.hand.length === 0
            )
              return null;
            return <EnemyHandPreview combatant={hoveredEnemy} />;
          })()}
      </div>

      {/* Battle effects layer - full screen overlay for correct viewport positioning */}
      <BattleEffectsLayer
        events={battleEffects.events}
        cardBanner={battleEffects.cardBanner}
        cardFlyEvents={battleEffects.cardFlyEvents}
        statusAppliedEvents={battleEffects.statusAppliedEvents}
        rewindEvents={battleEffects.rewindEvents}
        sandStreamEvents={battleEffects.sandStreamEvents}
        getPositionForCombatant={getPositionForCombatant}
        onEventComplete={battleEffects.removeEvent}
        onBannerComplete={battleEffects.clearCardBanner}
        onCardFlyComplete={battleEffects.removeCardFlyEvent}
        onStatusAppliedComplete={battleEffects.removeStatusAppliedEvent}
        onRewindComplete={battleEffects.removeRewindEvent}
        onSandStreamComplete={battleEffects.removeSandStreamEvent}
      />

      {/* Capture button + glow overlay (recruit battles) */}
      {isRecruitBattle && captureTargetId && (captureAvailable || capturePhase === 'animating') && (() => {
        const pos = getPositionForCombatant(captureTargetId);
        if (!pos) return null;
        return (
          <>
            {/* Capture glow overlay behind sprite during animation */}
            {capturePhase === 'animating' && (
              <div
                ref={captureGlowRef}
                className="pks-capture-glow"
                style={{
                  position: 'fixed',
                  left: pos.x,
                  top: pos.y,
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(250,204,21,0.6) 0%, rgba(249,115,22,0.3) 40%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 160,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Converging light dots during animation */}
            {capturePhase === 'animating' && (
              <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 161 }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const startRadius = 120;
                  const startX = pos.x + Math.cos(angle) * startRadius;
                  const startY = pos.y + Math.sin(angle) * startRadius;
                  return (
                    <div
                      key={i}
                      className="pks-capture-dot"
                      style={{
                        position: 'absolute',
                        left: startX,
                        top: startY,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'rgba(250, 204, 21, 0.9)',
                        boxShadow: '0 0 12px rgba(250, 204, 21, 0.8)',
                        transform: 'translate(-50%, -50%)',
                        // CSS transition drives convergence to center
                        transition: `left 1.2s ease-in ${i * 50}ms, top 1.2s ease-in ${i * 50}ms, opacity 0.3s ease ${1.0}s`,
                      }}
                      ref={(el) => {
                        // Trigger convergence on next frame
                        if (el) {
                          requestAnimationFrame(() => {
                            el.style.left = `${pos.x}px`;
                            el.style.top = `${pos.y}px`;
                          });
                          // Fade out near end
                          setTimeout(() => { el.style.opacity = '0'; }, makeDelay(1100));
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* CAPTURE button above enemy sprite */}
            {captureAvailable && capturePhase === 'idle' && (
              <button
                onClick={handleCapture}
                className="pks-capture-btn-entrance pks-capture-pulse"
                style={{
                  ...THEME.heading,
                  position: 'fixed',
                  left: pos.x,
                  top: pos.y - 90,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 170,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 28px',
                  fontSize: 20,
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  border: '2px solid rgba(250, 204, 21, 0.7)',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {/* Pokeball SVG icon */}
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke="#fff" strokeWidth="2" fill="none" />
                  <line x1="2" y1="14" x2="26" y2="14" stroke="#fff" strokeWidth="2" />
                  <circle cx="14" cy="14" r="4" stroke="#fff" strokeWidth="2" fill="none" />
                  <circle cx="14" cy="14" r="2" fill="#fff" />
                </svg>
                CAPTURE
              </button>
            )}
          </>
        );
      })()}

      {/* Battle log - left side column */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          bottom: 0,
          width: 260,
          padding: 8,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {currentCombatant && currentCombatant.heldItemIds.length > 0 && (
          <HeldItemsSidebar
            itemIds={currentCombatant.heldItemIds}
            ownerName={currentCombatant.name}
          />
        )}
        <BattleLog logs={logs} />
      </div>

      {/* Bottom panel: hand + controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 260,
          right: 0,
          borderTop: "1px solid " + THEME.border.subtle,
          background: THEME.chrome.backdrop,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10,
        }}
      >
        {/* Enemy thinking indicator */}
        {phase === "enemy_turn" && (
          <div
            style={{
              textAlign: "center",
              fontSize: 15,
              color: "#fca5a5",
              fontWeight: "bold",
            }}
          >
            Enemy is thinking...
          </div>
        )}

        {/* Flow layout: Deck → Hand → Energy+EndTurn → Discard → Vanished */}
        {isPlayerTurn && currentCombatant && capturePhase === 'idle' && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "center",
            }}
          >
            {/* Deck button (left) */}
            <PileButton
              label="Deck"
              count={currentCombatant.drawPile.length}
              isActive={openPile === "draw"}
              onClick={handleToggleDraw}
            />

            {/* Hand cards (center) */}
            <div data-tutorial-id="hand">
              <HandDisplay
                ref={handDisplayRef}
                combatant={currentCombatant}
                selectedIndex={pendingCardIndex}
                onSelectCard={handleCardClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                draggingIndex={draggingCardIndex}
                unplayableCardIndices={unplayableCardIndices}
                tutorialHighlightCardType={
                  tutorialConfig?.highlightTarget === "attack_cards"
                    ? "attack"
                    : tutorialConfig?.highlightTarget === "defend_cards"
                      ? "defend"
                      : undefined
                }
              />
            </div>

            {/* Energy vessel + Switch + End Turn (right of hand) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div data-tutorial-id="energy">
                <EnergyPips
                  energy={currentCombatant.energy}
                  energyCap={currentCombatant.energyCap}
                  variant="vessel"
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Switch button — ornate with cost badge */}
                {onSwitchPosition &&
                  (() => {
                    const swCost = getSwitchCost(currentCombatant);
                    const maxSw = getMaxSwitches(currentCombatant);
                    const switchesLeft =
                      maxSw - currentCombatant.turnFlags.switchesThisTurn;
                    const canSwitch =
                      switchesLeft > 0 &&
                      currentCombatant.energy >= swCost &&
                      getValidSwitchTargets(state, currentCombatant).length > 0;
                    const enabled = canSwitch || switchMode;
                    const teal = "#38bdf8";
                    const tealDim = "#1e6a9a";
                    const accent = enabled ? teal : tealDim;
                    return (
                      <button
                        data-tutorial-id="switch_button"
                        onClick={handleSwitchButtonClick}
                        disabled={!enabled}
                        title={
                          switchesLeft <= 0
                            ? "No switches remaining"
                            : currentCombatant.energy < swCost
                              ? `Need ${swCost} energy`
                              : `Switch position (${swCost} energy, ${switchesLeft} left)`
                        }
                        style={{
                          position: "relative",
                          border: "none",
                          background: "transparent",
                          cursor: enabled ? "pointer" : "default",
                          padding: 0,
                          opacity: enabled ? 1 : 0.45,
                        }}
                      >
                        <svg
                          width="82"
                          height="38"
                          viewBox="0 0 82 38"
                          fill="none"
                        >
                          {/* Button body */}
                          <path
                            d="M8 2 L74 2 Q80 2 80 8 L80 30 Q80 36 74 36 L8 36 Q2 36 2 30 L2 8 Q2 2 8 2 Z"
                            fill={switchMode ? `${teal}20` : THEME.bg.panelDark}
                            stroke={switchMode ? `${teal}88` : `${accent}55`}
                            strokeWidth="1.2"
                          />
                          {/* Inner border */}
                          <path
                            d="M10 5 L72 5 Q76 5 76 9 L76 29 Q76 33 72 33 L10 33 Q6 33 6 29 L6 9 Q6 5 10 5 Z"
                            fill="none"
                            stroke={switchMode ? `${teal}33` : `${accent}18`}
                            strokeWidth="0.6"
                          />
                          {/* Inset glow fill when active */}
                          {switchMode && (
                            <path
                              d="M10 5 L72 5 Q76 5 76 9 L76 29 Q76 33 72 33 L10 33 Q6 33 6 29 L6 9 Q6 5 10 5 Z"
                              fill={`${teal}0a`}
                            />
                          )}
                          {/* Corner notch accents */}
                          <line
                            x1="4"
                            y1="11"
                            x2="8"
                            y2="11"
                            stroke={`${accent}44`}
                            strokeWidth="0.7"
                          />
                          <line
                            x1="4"
                            y1="27"
                            x2="8"
                            y2="27"
                            stroke={`${accent}44`}
                            strokeWidth="0.7"
                          />
                          <line
                            x1="74"
                            y1="11"
                            x2="78"
                            y2="11"
                            stroke={`${accent}44`}
                            strokeWidth="0.7"
                          />
                          <line
                            x1="74"
                            y1="27"
                            x2="78"
                            y2="27"
                            stroke={`${accent}44`}
                            strokeWidth="0.7"
                          />
                          {/* Left swap arrow */}
                          <path
                            d="M16 15 L20 12 L20 18 Z"
                            fill={enabled ? `${teal}88` : `${tealDim}55`}
                          />
                          <line
                            x1="20"
                            y1="15"
                            x2="26"
                            y2="15"
                            stroke={enabled ? `${teal}44` : `${tealDim}28`}
                            strokeWidth="0.8"
                          />
                          {/* Right swap arrow */}
                          <path
                            d="M66 23 L62 20 L62 26 Z"
                            fill={enabled ? `${teal}88` : `${tealDim}55`}
                          />
                          <line
                            x1="56"
                            y1="23"
                            x2="62"
                            y2="23"
                            stroke={enabled ? `${teal}44` : `${tealDim}28`}
                            strokeWidth="0.8"
                          />
                          {/* Text */}
                          <text
                            x="41"
                            y="20.5"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={enabled ? teal : tealDim}
                            fontSize="13"
                            fontWeight="bold"
                            fontFamily="'Kreon', Georgia, serif"
                          >
                            Switch
                          </text>
                        </svg>
                        {/* Cost badge — diamond notch, top-right */}
                        <div
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -6,
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 22 22"
                            style={{ position: "absolute" }}
                          >
                            <path
                              d="M11 1 L20 11 L11 21 L2 11 Z"
                              fill={THEME.bg.panelDark}
                              stroke={enabled ? teal : tealDim}
                              strokeWidth="1"
                            />
                            <path
                              d="M11 4 L17.5 11 L11 18 L4.5 11 Z"
                              fill={enabled ? `${teal}18` : "transparent"}
                              stroke={enabled ? `${teal}33` : "transparent"}
                              strokeWidth="0.6"
                            />
                          </svg>
                          <span
                            style={{
                              position: "relative",
                              fontSize: 11,
                              fontWeight: "bold",
                              color: enabled ? "#7dd3fc" : tealDim,
                              textShadow: enabled
                                ? `0 0 5px ${teal}66`
                                : "none",
                              lineHeight: 1,
                            }}
                          >
                            {swCost}
                          </span>
                        </div>
                      </button>
                    );
                  })()}

                {/* End Turn button — ornate gold */}
                <style>{`
                  @keyframes pksFlash {
                    0%, 100% { filter: brightness(1) drop-shadow(0 0 0px transparent); }
                    50% { filter: brightness(1.3) drop-shadow(0 0 6px ${THEME.accent}88); }
                  }
                  .pks-flash { animation: pksFlash 1.2s ease-in-out infinite; }
                `}</style>
                <button
                  data-tutorial-id="end_turn"
                  className={shouldFlashEndTurn ? "pks-flash" : undefined}
                  onClick={onEndTurn}
                  style={{
                    position: "relative",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <svg width="96" height="38" viewBox="0 0 96 38" fill="none">
                    {/* Button body */}
                    <path
                      d="M10 2 L86 2 Q94 2 94 10 L94 28 Q94 36 86 36 L10 36 Q2 36 2 28 L2 10 Q2 2 10 2 Z"
                      fill={THEME.bg.panelDark}
                      stroke={THEME.accent}
                      strokeWidth="1.2"
                    />
                    {/* Inner border */}
                    <path
                      d="M12 5 L84 5 Q90 5 90 11 L90 27 Q90 33 84 33 L12 33 Q6 33 6 27 L6 11 Q6 5 12 5 Z"
                      fill="none"
                      stroke={`${THEME.accent}20`}
                      strokeWidth="0.6"
                    />
                    {/* Inset glow fill */}
                    <path
                      d="M12 5 L84 5 Q90 5 90 11 L90 27 Q90 33 84 33 L12 33 Q6 33 6 27 L6 11 Q6 5 12 5 Z"
                      fill={`${THEME.accent}08`}
                    />
                    {/* Corner notch accents */}
                    <line
                      x1="4"
                      y1="12"
                      x2="8"
                      y2="12"
                      stroke={`${THEME.accent}55`}
                      strokeWidth="0.7"
                    />
                    <line
                      x1="4"
                      y1="26"
                      x2="8"
                      y2="26"
                      stroke={`${THEME.accent}55`}
                      strokeWidth="0.7"
                    />
                    <line
                      x1="88"
                      y1="12"
                      x2="92"
                      y2="12"
                      stroke={`${THEME.accent}55`}
                      strokeWidth="0.7"
                    />
                    <line
                      x1="88"
                      y1="26"
                      x2="92"
                      y2="26"
                      stroke={`${THEME.accent}55`}
                      strokeWidth="0.7"
                    />
                    {/* Left scroll flourish */}
                    <path
                      d="M16 19 Q16 14 21 14 L28 14"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                    <path
                      d="M16 19 Q16 24 21 24 L28 24"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                    <circle
                      cx="16"
                      cy="19"
                      r="1.5"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.7"
                      fill="none"
                    />
                    {/* Right scroll flourish */}
                    <path
                      d="M80 19 Q80 14 75 14 L68 14"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                    <path
                      d="M80 19 Q80 24 75 24 L68 24"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.8"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="19"
                      r="1.5"
                      stroke={`${THEME.accent}44`}
                      strokeWidth="0.7"
                      fill="none"
                    />
                    {/* Center diamond accent */}
                    <path
                      d="M48 13 L51 19 L48 25 L45 19 Z"
                      stroke={`${THEME.accent}33`}
                      strokeWidth="0.6"
                      fill={`${THEME.accent}11`}
                    />
                    {/* Text */}
                    <text
                      x="48"
                      y="21"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={THEME.accent}
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="'Kreon', Georgia, serif"
                      style={
                        {
                          textShadow: `0 0 8px ${THEME.accent}44`,
                        } as React.CSSProperties
                      }
                    >
                      End Turn
                    </text>
                  </svg>
                </button>
              </div>
            </div>

            {/* Discard button */}
            <PileButton
              label="Discard"
              count={currentCombatant.discardPile.length}
              isActive={openPile === "discard"}
              onClick={handleToggleDiscard}
            />

            {/* Vanished button (conditional) */}
            {currentCombatant.vanishedPile.length > 0 && (
              <PileButton
                label="Vanished"
                count={currentCombatant.vanishedPile.length}
                isActive={openPile === "vanished"}
                onClick={handleToggleVanished}
              />
            )}
          </div>
        )}
      </div>

      {/* Pile modal (rendered outside bottom panel for correct overlay stacking) */}
      {openPile &&
        currentCombatant &&
        (() => {
          let cards: string[] = [];
          let title = "";
          if (openPile === "draw") {
            cards = [...currentCombatant.drawPile].sort(
              () => Math.random() - 0.5,
            );
            title = `Draw Pile (${currentCombatant.drawPile.length})`;
          } else if (openPile === "discard") {
            cards = [...currentCombatant.discardPile].reverse();
            title = `Discard Pile (${currentCombatant.discardPile.length})`;
          } else if (openPile === "vanished") {
            cards = [...currentCombatant.vanishedPile];
            title = `Vanished (${currentCombatant.vanishedPile.length})`;
          }
          if (cards.length === 0) return null;
          return (
            <PileModal
              title={title}
              cards={cards}
              combatant={currentCombatant}
              onClose={() => setOpenPileState(null)}
            />
          );
        })()}

      {/* Pokemon inspection panel - works for both player and enemy */}
      {inspectedCombatant &&
        (inspectedCombatant.side === "player" &&
        inspectedRunPokemon &&
        runState ? (
          // Player Pokemon with full RunPokemon data
          <PokemonDetailsPanel
            pokemon={inspectedRunPokemon}
            pokemonIndex={inspectedCombatant.slotIndex}
            partySize={runState.party.length}
            onClose={handleCloseInspection}
            onNavigate={handleNavigateInspection}
            readOnly
          />
        ) : (
          // Enemy Pokemon or sandbox mode - use combatant data only
          <PokemonDetailsPanel
            combatant={inspectedCombatant}
            onClose={handleCloseInspection}
            readOnly
          />
        ))}

      {/* Victory celebration overlay - root level for full-screen coverage (skipped for capture wins) */}
      {phase === "victory" && victoryStage && capturePhase !== 'done' && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0)",
            gap: 20,
            zIndex: 50,
          }}
        >
          {/* Dark backdrop that fades in */}
          <div
            className="battle-victory-backdrop"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(2, 4, 8, 0.8)",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              className="battle-victory-title"
              style={{
                fontSize: 56,
                fontWeight: "bold",
                color: THEME.accent,
                textShadow:
                  "0 0 30px rgba(250, 204, 21, 0.4), 0 0 60px rgba(250, 204, 21, 0.15)",
                ...THEME.heading,
                letterSpacing: "0.2em",
              }}
            >
              VICTORY
            </div>

            <div className="battle-victory-flourish">
              <Flourish variant="divider" width={200} color={THEME.accent} />
            </div>

            {/* Draft message — appears after title settles */}
            {(victoryStage === "draft_message" ||
              victoryStage === "transitioning") && (
              <div
                className="battle-victory-draft-msg"
                style={{
                  fontSize: 18,
                  color: THEME.text.secondary,
                  textAlign: "center",
                  letterSpacing: "0.05em",
                  marginTop: 4,
                }}
              >
                Choose a new card for each Pokemon...
              </div>
            )}
          </div>

          <style>{`
            .battle-victory-backdrop {
              animation: bvBackdropIn 0.6s ease-out forwards;
              opacity: 0;
            }
            @keyframes bvBackdropIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .battle-victory-title {
              animation: bvTitleIn 0.7s ease-out forwards;
              opacity: 0;
            }
            @keyframes bvTitleIn {
              from {
                opacity: 0;
                transform: translateY(-8px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .battle-victory-flourish {
              animation: bvFadeIn 0.4s ease-out 0.3s forwards;
              opacity: 0;
            }
            .battle-victory-draft-msg {
              animation: bvFadeIn 0.4s ease-out forwards;
              opacity: 0;
            }
            @keyframes bvFadeIn {
              from {
                opacity: 0;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Defeat overlay - root level for full-screen coverage */}
      {phase === "defeat" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="battle-defeat-backdrop"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(2, 4, 8, 0.8)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              className="battle-defeat-title"
              style={{
                fontSize: 56,
                fontWeight: "bold",
                color: THEME.status.damage,
                textShadow:
                  "0 0 30px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.15)",
                ...THEME.heading,
                letterSpacing: "0.2em",
              }}
            >
              DEFEAT
            </div>
            <Flourish
              variant="heading"
              width={100}
              color={THEME.status.damage}
            />
            <button
              onClick={onRestart}
              style={{
                padding: "12px 32px",
                fontSize: 16,
                ...THEME.button.secondary,
                marginTop: 8,
              }}
            >
              Main Menu
            </button>
          </div>
          <style>{`
            .battle-defeat-backdrop {
              animation: bvBackdropIn 0.6s ease-out forwards;
              opacity: 0;
            }
            .battle-defeat-title {
              animation: bvTitleIn 0.7s ease-out forwards;
              opacity: 0;
            }
          `}</style>
        </div>
      )}

      {/* Tutorial overlay */}
      {tutorialConfig?.isActive && (
        <TutorialOverlay
          highlightTarget={tutorialConfig.highlightTarget}
          stepText={tutorialConfig.stepText}
          onGotIt={tutorialConfig.advance}
          onSkip={tutorialConfig.canSkip ? tutorialConfig.skip : undefined}
          allowInteraction={tutorialConfig.allowInteraction}
          canSkip={tutorialConfig.canSkip}
          zone={tutorialConfig.zone}
        />
      )}

      {/* Capture mechanic CSS keyframes */}
      <style>{`
        @keyframes pksCaptureEntrance {
          0% { transform: translate(-50%, -100%) scale(0.3); opacity: 0; }
          60% { transform: translate(-50%, -100%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
        }
        .pks-capture-btn-entrance {
          animation: pksCaptureEntrance 0.4s ease-out forwards;
        }
        @keyframes pksCapturePulse {
          0%, 100% { box-shadow: 0 0 24px rgba(249,115,22,0.5); }
          50% { box-shadow: 0 0 32px rgba(249,115,22,0.7), 0 0 64px rgba(249,115,22,0.3); }
        }
        .pks-capture-pulse {
          animation: pksCapturePulse 1.5s ease-in-out infinite;
        }
        @keyframes pksCaptureGlow {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
        }
        .pks-capture-glow {
          animation: pksCaptureGlow 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
