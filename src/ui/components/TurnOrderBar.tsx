import { useRef, useState, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import type { CombatState, Combatant } from '../../engine/types';
import { getCombatant } from '../../engine/combat';
import { getEffectiveSpeed } from '../../engine/status';
import type { EnemyIntent } from '../../engine/intentPreview';
import { MOVE_TYPE_COLORS } from './CardDisplay';
import { IntentCardPreview } from './IntentCardPreview';
import { getSpriteUrl } from '../utils/sprites';
import { THEME } from '../theme';

interface Props {
  state: CombatState;
  enemyIntents?: Map<string, EnemyIntent[]>;
  allCombatants?: Combatant[];
  intentsVisible?: boolean;
}

// Duration of the shuffle animation in ms
const ANIM_DURATION = 400;

function TurnOrderBarInner({ state, enemyIntents, allCombatants, intentsVisible = true }: Props) {
  // Track DOM elements by combatantId
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Previous order snapshot (combatantIds in order)
  const prevOrderRef = useRef<string[]>([]);
  // Previous positions from the last render (for "from" on first reorder)
  const prevLeftRef = useRef<Map<string, number>>(new Map());
  // Track active animations
  const activeAnimsRef = useRef<Set<string>>(new Set());

  // Start collapsed so intents fold-out on first appearance
  const [intentsReady, setIntentsReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIntentsReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      entryRefs.current.set(id, el);
    } else {
      entryRefs.current.delete(id);
    }
  }, []);

  // Interruption-safe FLIP animation
  const frameIdRef = useRef<number | null>(null);
  const outerFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const currentOrder = state.turnOrder.map(e => e.combatantId);
    const prevOrder = prevOrderRef.current;

    // Only animate when the actual ID sequence changed (real reorder),
    // not when entries just shifted pixels due to styling changes.
    const orderChanged = prevOrder.length > 0 &&
      (currentOrder.length !== prevOrder.length ||
       currentOrder.some((id, i) => id !== prevOrder[i]));

    if (orderChanged) {
      // Build "from" positions:
      // - Mid-animation entries: use getBoundingClientRect (visual position with transforms)
      // - Resting entries: use prevLeftRef (position from before React updated the DOM)
      const fromLeft = new Map<string, number>();
      for (const [id, el] of entryRefs.current) {
        if (activeAnimsRef.current.has(id)) {
          // Mid-animation: capture current visual position (includes transform)
          fromLeft.set(id, el.getBoundingClientRect().left);
        } else {
          // At rest: use stored position from previous render
          const stored = prevLeftRef.current.get(id);
          if (stored !== undefined) {
            fromLeft.set(id, stored);
          } else {
            // Fallback: entry completed animation but prevLeftRef was replaced
            // before its position was captured. Use current DOM position
            // (this is the NEW position, so deltaX will be ~0 — but it prevents
            // the entry from being silently skipped entirely).
            fromLeft.set(id, el.getBoundingClientRect().left);
          }
        }
      }

      // Cancel any in-progress animation and clear all transforms
      if (outerFrameRef.current !== null) {
        cancelAnimationFrame(outerFrameRef.current);
        outerFrameRef.current = null;
      }
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      for (const id of activeAnimsRef.current) {
        const el = entryRefs.current.get(id);
        if (el) {
          el.style.transform = '';
          el.style.transition = '';
        }
      }
      activeAnimsRef.current.clear();

      // Measure "to" positions (DOM positions without transforms)
      const toLeft = new Map<string, number>();
      for (const [id, el] of entryRefs.current) {
        toLeft.set(id, el.getBoundingClientRect().left);
      }

      // Find entries that moved
      const movedEntries: { id: string; deltaX: number; el: HTMLDivElement }[] = [];
      for (const id of currentOrder) {
        const el = entryRefs.current.get(id);
        const from = fromLeft.get(id);
        const to = toLeft.get(id);
        if (el && from !== undefined && to !== undefined) {
          const deltaX = from - to;
          if (Math.abs(deltaX) > 2) {
            movedEntries.push({ id, deltaX, el });
          }
        }
      }

      if (movedEntries.length > 0) {
        // FLIP Invert: position entries at their "from" spot
        for (const { id, deltaX, el } of movedEntries) {
          el.style.transform = `translate(${deltaX}px, 0px)`;
          el.style.transition = 'none';
          activeAnimsRef.current.add(id);
        }

        // FLIP Play: animate drop → slide → rise
        outerFrameRef.current = requestAnimationFrame(() => {
          outerFrameRef.current = null;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / ANIM_DURATION, 1);

            for (const { deltaX, el } of movedEntries) {
              const dropT = Math.min(t / 0.25, 1);
              const slideT = Math.max(0, Math.min((t - 0.15) / 0.7, 1));
              const riseT = Math.max(0, (t - 0.75) / 0.25);

              const dropEase = 1 - Math.pow(1 - dropT, 2);
              const slideEase = slideT < 0.5 ? 2 * slideT * slideT : 1 - Math.pow(-2 * slideT + 2, 2) / 2;
              const riseEase = riseT * riseT;

              const offsetX = deltaX * (1 - slideEase);
              const offsetY = dropEase * 20 - riseEase * 20;

              el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            }

            if (t < 1) {
              frameIdRef.current = requestAnimationFrame(animate);
            } else {
              frameIdRef.current = null;
              for (const { id, el } of movedEntries) {
                el.style.transform = '';
                el.style.transition = '';
                activeAnimsRef.current.delete(id);
                // Store final resting position so subsequent reorders
                // have a valid "from" even if no render happens in between
                prevLeftRef.current.set(id, el.getBoundingClientRect().left);
              }
            }
          };

          frameIdRef.current = requestAnimationFrame(animate);
        });
      }
    }

    // Store positions for next render (only non-animating entries, since
    // animating entries have transforms that skew getBoundingClientRect).
    // Merge into a new map so that positions stored by animation-complete
    // callbacks (for entries that finished between renders) are preserved.
    const currentLeft = new Map<string, number>(prevLeftRef.current);
    for (const [id, el] of entryRefs.current) {
      if (!activeAnimsRef.current.has(id)) {
        currentLeft.set(id, el.getBoundingClientRect().left);
      }
    }
    prevLeftRef.current = currentLeft;
    prevOrderRef.current = currentOrder;
  });

  const combatantMap = allCombatants
    ? new Map(allCombatants.map(c => [c.id, c]))
    : undefined;

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '8px 16px',
      background: 'transparent',
      borderRadius: 8,
      flexWrap: 'wrap',
      position: 'relative',
    }}>
      {/* Threading line behind entries — fixed at name pill vertical center */}
      <div style={{
        position: 'absolute',
        top: 21,
        left: 0,
        right: 0,
        height: 1,
        background: THEME.text.tertiary + '44',
        zIndex: 0,
      }} />
      <span style={{ fontSize: 12, color: THEME.text.tertiary, marginRight: 4, position: 'relative', zIndex: 1, padding: '4px 0' }}>
        Round {state.round}
      </span>
      <span style={{ color: THEME.border.bright, marginRight: 8, fontSize: 14, position: 'relative', zIndex: 1, padding: '4px 0' }}>·</span>
      {state.turnOrder.map((entry, idx) => {
        const c = getCombatant(state, entry.combatantId);
        const isCurrent = idx === state.currentTurnIndex;
        const hasActed = entry.hasActed;
        const intents = enemyIntents?.get(entry.combatantId);
        // Show intents for enemies that haven't acted yet; when hidden (enemy turn),
        // still render for layout stability since we're using cached intents
        const hasIntents = intents && intents.length > 0 && c.side === 'enemy' &&
          (intentsVisible ? !hasActed : true);

        return (
          <div
            key={entry.combatantId}
            ref={setRef(entry.combatantId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Name pill */}
            <div
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: isCurrent ? 'bold' : 'normal',
                background: isCurrent
                  ? THEME.accent + '22'
                  : hasActed
                    ? THEME.bg.panelDark
                    : c.side === 'player'
                      ? THEME.side.player
                      : THEME.side.enemy,
                color: isCurrent ? THEME.accent : hasActed ? THEME.text.tertiary : THEME.text.primary,
                opacity: hasActed ? 0.5 : 1,
                border: isCurrent
                  ? `1px solid ${THEME.accent}`
                  : hasActed
                    ? '1px solid transparent'
                    : c.side === 'player'
                      ? '1px solid rgba(42,74,110,0.6)'
                      : '1px solid rgba(110,42,42,0.6)',
                boxShadow: isCurrent
                  ? 'inset 0 0 8px rgba(250,204,21,0.15)'
                  : 'inset 0 0 4px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 12, color: THEME.text.tertiary, opacity: 0.7 }}>{getEffectiveSpeed(c)}</span>
              {' '}{c.name}
            </div>

            {/* Intent bracket — height:0 + overflow:visible means it reserves WIDTH
                (pushing siblings apart) but contributes zero HEIGHT (no bar jitter).
                Inner content folds in/out via scaleY so layout stays stable. */}
            {hasIntents && combatantMap && (
              <div style={{ height: 0, minHeight: 0, overflow: 'visible' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'auto',
                  transformOrigin: 'top center',
                  transform: (intentsVisible && intentsReady) ? 'scaleY(1)' : 'scaleY(0)',
                  opacity: (intentsVisible && intentsReady) ? 1 : 0,
                  transition: 'transform 150ms ease-out, opacity 150ms ease-out',
                }}>
                  {/* Vertical connector */}
                  <div style={{
                    width: 1,
                    height: 5,
                    background: THEME.text.tertiary + '66',
                  }} />
                  {/* Intent chips row */}
                  <div style={{
                    display: 'flex',
                    gap: 2,
                    padding: '2px 3px',
                    borderRadius: 4,
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: `1px solid ${THEME.border.subtle}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {intents.map((intent) => (
                      <IntentChip
                        key={intent.sequenceNumber}
                        intent={intent}
                        combatantMap={combatantMap}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IntentChip({
  intent,
  combatantMap,
}: {
  intent: EnemyIntent;
  combatantMap: Map<string, Combatant>;
}) {
  const typeColor = MOVE_TYPE_COLORS[intent.moveType] || MOVE_TYPE_COLORS.normal;
  const [hovered, setHovered] = useState(false);
  const [popoverReady, setPopoverReady] = useState(false);

  // Fold-out animation: mount at scaleY(0), flip to scaleY(1) via rAF
  useEffect(() => {
    if (!hovered) {
      setPopoverReady(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPopoverReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [hovered]);

  const primaryTargetId = intent.targetIds[0];
  const primaryTarget = primaryTargetId ? combatantMap.get(primaryTargetId) : undefined;
  const wouldKOPrimary = primaryTargetId ? intent.wouldKO[primaryTargetId] ?? false : false;

  // Determine preview targets
  const getPreviewTargets = (): Combatant[] => {
    if (intent.isSelfTarget) {
      const source = combatantMap.get(intent.sourceId);
      return source ? [source] : [];
    }
    return intent.targetIds
      .map(id => combatantMap.get(id))
      .filter((c): c is Combatant => c !== undefined);
  };

  return (
    <div
      title={!hovered ? intent.cardName : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '1px 4px',
        borderRadius: 3,
        background: `${typeColor}18`,
        borderLeft: `2px solid ${typeColor}`,
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* Sequence number */}
      <span style={{
        fontSize: 8,
        fontWeight: 700,
        color: typeColor,
        lineHeight: 1,
        minWidth: 8,
        textAlign: 'center',
      }}>
        {intent.sequenceNumber}
      </span>

      {/* Card name */}
      <span style={{
        fontSize: 9,
        color: THEME.text.secondary,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 48,
        lineHeight: 1.2,
      }}>
        {intent.cardName}
      </span>

      {/* Target indicator */}
      {intent.isSelfTarget ? (
        <span style={{ fontSize: 10, lineHeight: 1 }}>🛡</span>
      ) : intent.isAoE ? (
        <span style={{
          fontSize: 8,
          color: '#ff6b6b',
          fontWeight: 700,
          lineHeight: 1,
        }}>
          ×{intent.targetIds.length}
        </span>
      ) : primaryTarget ? (
        <span style={{ position: 'relative', display: 'inline-flex', width: 16, height: 16 }}>
          <img
            src={getSpriteUrl(primaryTarget.pokemonId, 'back')}
            alt={primaryTarget.name}
            style={{
              width: 16,
              height: 16,
              imageRendering: 'pixelated',
              objectFit: 'contain',
              opacity: wouldKOPrimary ? 0.35 : 1,
            }}
          />
          {wouldKOPrimary && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 800,
              color: '#ff4444',
              textShadow: '0 0 2px #000, 0 0 2px #000',
            }}>
              KO
            </span>
          )}
        </span>
      ) : null}

      {/* Hover popover — card preview(s) */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: `translateX(-50%) scaleY(${popoverReady ? 1 : 0})`,
          transformOrigin: 'top center',
          transition: 'transform 150ms ease-out, opacity 150ms ease-out',
          opacity: popoverReady ? 1 : 0,
          zIndex: 100,
          display: 'flex',
          gap: 4,
          marginTop: 4,
          pointerEvents: 'none',
        }}>
          {getPreviewTargets().map(target => (
            <IntentCardPreview
              key={target.id}
              intent={intent}
              target={target}
              damagePreview={intent.damageByTarget[target.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const TurnOrderBar = memo(TurnOrderBarInner);
