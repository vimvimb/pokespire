import { useState, useCallback, useMemo } from 'react';
import type { RunState, RunPokemon } from '../../run/types';
import type { Row, Column } from '../../engine/types';
import { getPokemon } from '../../data/loaders';
import { ITEM_DEFS, RARITY_COLORS, STARTER_ITEM_IDS } from '../../data/items';
import { HeldItemMotif } from '../components/HeldItemMotif';
import { ScreenShell } from '../components/ScreenShell';
import { Flourish } from '../components/Flourish';
import { TYPE_COLORS } from '../components/PokemonTile';
import { THEME } from '../theme';
import { getSpriteUrl } from '../utils/sprites';

const MAX_ITEMS = 4;

interface Props {
  run: RunState;
  onComplete: (run: RunState) => void;
  onBack: () => void;
}

export function StarterItemScreen({ run, onComplete, onBack }: Props) {
  // Map: partyIndex → itemId
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const assignedItemIds = useMemo(
    () => new Set(Object.values(assignments)),
    [assignments],
  );

  const assignmentCount = assignedItemIds.size;
  const atMax = assignmentCount >= MAX_ITEMS;

  const handleItemClick = useCallback((itemId: string) => {
    setSelectedItemId(prev => (prev === itemId ? null : itemId));
  }, []);

  const handlePokemonClick = useCallback((index: number) => {
    if (!selectedItemId) return;
    setAssignments(prev => {
      const next = { ...prev };
      // Remove any previous assignment of this item
      for (const [k, v] of Object.entries(next)) {
        if (v === selectedItemId) delete next[Number(k)];
      }
      next[index] = selectedItemId;
      return next;
    });
    setSelectedItemId(null);
  }, [selectedItemId]);

  const handleUnassign = useCallback((index: number) => {
    setAssignments(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const updatedParty = run.party.map((p, i) => ({
      ...p,
      heldItemIds: assignments[i] ? [...p.heldItemIds, assignments[i]] : p.heldItemIds,
    }));
    onComplete({ ...run, party: updatedParty });
  }, [run, assignments, onComplete]);

  // ── Header ──
  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: `1px solid ${THEME.border.subtle}`,
      background: 'rgba(0,0,0,0.4)',
    }}>
      <button onClick={onBack} style={{ ...THEME.button.secondary, padding: '6px 16px', fontSize: 12 }}>
        Back
      </button>
      <div style={{ ...THEME.heading, fontSize: 16, color: THEME.accent, letterSpacing: '0.12em' }}>
        Starter Items
      </div>
      <button
        onClick={handleConfirm}
        style={{
          ...THEME.button.primary,
          padding: '6px 20px',
          fontSize: 12,
        }}
      >
        Confirm
      </button>
    </div>
  );

  return (
    <ScreenShell
      header={header}
      bodyStyle={{ padding: '28px 16px 48px' }}
      ambient
      ambientTint="rgba(250,204,21,0.02)"
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Instructions */}
        <div style={{
          textAlign: 'center', fontSize: 13, color: THEME.text.secondary,
          marginBottom: 8, lineHeight: 1.4,
        }}>
          {selectedItemId
            ? 'Now tap a party member to equip the selected item.'
            : `Select up to ${MAX_ITEMS} items for your party. Each grants a unique passive in battle.`}
        </div>
        <Flourish />
        <div style={{ height: 20 }} />

        {/* ── Starter Item Grid (2×5) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
          marginBottom: 36,
        }}>
          {STARTER_ITEM_IDS.map(itemId => {
            const item = ITEM_DEFS[itemId];
            const color = RARITY_COLORS[item.rarity];
            const isAssigned = assignedItemIds.has(itemId);
            const isSelected = selectedItemId === itemId;
            const isDisabled = isAssigned || (atMax && !isSelected);

            return (
              <button
                key={itemId}
                onClick={() => !isDisabled && handleItemClick(itemId)}
                className="si-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                  padding: '14px 8px 12px',
                  background: isSelected
                    ? `linear-gradient(180deg, ${color}12, ${THEME.bg.panelDark})`
                    : THEME.bg.panelDark,
                  border: isSelected
                    ? `1.5px solid ${color}`
                    : `1.5px solid ${THEME.border.subtle}`,
                  borderRadius: 10,
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.3 : 1,
                  color: THEME.text.primary,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isSelected
                    ? `0 0 16px ${color}20, inset 0 0 24px ${color}08`
                    : 'none',
                }}
              >
                {/* Icon */}
                <HeldItemMotif itemId={itemId} size={44} />

                {/* Name */}
                <div style={{
                  fontSize: 11, fontWeight: 'bold',
                  color,
                  ...THEME.heading,
                  lineHeight: 1.2,
                  marginTop: 8,
                }}>
                  {item.name}
                </div>

                {/* Category */}
                <div style={{
                  fontSize: 8, fontWeight: 'bold',
                  color: THEME.text.tertiary,
                  ...THEME.heading,
                  letterSpacing: '0.12em',
                  marginTop: 2,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}>
                  {item.rarity}
                </div>

                {/* Separator */}
                <div style={{
                  width: '80%',
                  height: 1,
                  background: `linear-gradient(to right, transparent, ${color}50, transparent)`,
                  marginBottom: 6,
                }} />

                {/* Description */}
                <div style={{ fontSize: 10, color: THEME.text.secondary, lineHeight: 1.3 }}>
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Section divider ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: THEME.border.subtle }} />
          <div style={{
            fontSize: 11, fontWeight: 'bold', color: THEME.text.tertiary,
            ...THEME.heading, letterSpacing: '0.12em',
          }}>
            Your Formation
          </div>
          <div style={{ flex: 1, height: 1, background: THEME.border.subtle }} />
        </div>

        {/* ── Formation Grid (2 cols × 3 rows) ── */}
        <FormationGrid
          party={run.party}
          assignments={assignments}
          selectedItemId={selectedItemId}
          onSlotClick={(index) => {
            if (selectedItemId) handlePokemonClick(index);
            else if (assignments[index]) handleUnassign(index);
          }}
        />
      </div>

      <style>{`
        .si-card {
          transition: all 0.2s;
        }
        .si-card:hover:not([style*="opacity: 0.3"]) {
          transform: translateY(-2px);
        }
      `}</style>
    </ScreenShell>
  );
}

/* ── Formation Grid sub-component ── */

const ROWS: Row[] = ['back', 'front'];
const COLUMNS: Column[] = [0, 1, 2];

interface FormationGridProps {
  party: RunPokemon[];
  assignments: Record<number, string>;
  selectedItemId: string | null;
  onSlotClick: (partyIndex: number) => void;
}

function FormationGrid({ party, assignments, selectedItemId, onSlotClick }: FormationGridProps) {
  // Build a lookup: "row-col" → { pokemon, partyIndex }
  const slotMap = useMemo(() => {
    const map: Record<string, { pokemon: RunPokemon; index: number }> = {};
    party.forEach((p, i) => {
      map[`${p.position.row}-${p.position.column}`] = { pokemon: p, index: i };
    });
    return map;
  }, [party]);

  const isTarget = selectedItemId !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {ROWS.map(row => (
          <div key={row} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 'bold',
            color: THEME.text.tertiary, ...THEME.heading,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            {row}
          </div>
        ))}
      </div>

      {/* Grid: 3 rows × 2 columns */}
      {COLUMNS.map(col => (
        <div key={col} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ROWS.map(row => {
            const slot = slotMap[`${row}-${col}`];
            if (!slot) return <EmptySlot key={`${row}-${col}`} />;

            const { pokemon, index } = slot;
            const data = getPokemon(pokemon.formId);
            const typeColor = TYPE_COLORS[data.types[0]];
            const itemId = assignments[index];
            const item = itemId ? ITEM_DEFS[itemId] : undefined;
            const catColor = item ? RARITY_COLORS[item.rarity] : undefined;
            const hasAction = isTarget || !!item;

            return (
              <button
                key={`${row}-${col}`}
                onClick={() => hasAction && onSlotClick(index)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px 10px',
                  background: isTarget
                    ? `linear-gradient(180deg, ${THEME.accent}08, transparent)`
                    : item
                      ? `linear-gradient(180deg, ${catColor}08, transparent)`
                      : THEME.bg.panelDark,
                  border: isTarget
                    ? `1.5px solid ${THEME.accent}50`
                    : item
                      ? `1.5px solid ${catColor}30`
                      : `1.5px solid ${THEME.border.subtle}`,
                  borderRadius: 10,
                  cursor: hasAction ? 'pointer' : 'default',
                  color: THEME.text.primary,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isTarget
                    ? `inset 0 0 20px ${THEME.accent}06`
                    : 'none',
                }}
              >
                {/* Sprite */}
                <img
                  src={getSpriteUrl(pokemon.formId)}
                  alt={data.name}
                  style={{
                    width: 48, height: 48,
                    imageRendering: 'pixelated',
                    objectFit: 'contain',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />

                {/* Name */}
                <div style={{
                  fontSize: 12, fontWeight: 'bold',
                  color: typeColor,
                  ...THEME.heading,
                  letterSpacing: '0.06em',
                  lineHeight: 1.2,
                }}>
                  {data.name}
                </div>

                {/* Item badge or empty indicator */}
                {item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <HeldItemMotif itemId={item.id} size={28} />
                    <div style={{
                      fontSize: 9, fontWeight: 'bold',
                      color: catColor,
                      ...THEME.heading,
                      lineHeight: 1.2,
                    }}>
                      {item.name}
                    </div>
                    {!selectedItemId && (
                      <div style={{
                        fontSize: 8, color: THEME.text.tertiary,
                        ...THEME.heading, letterSpacing: '0.08em',
                      }}>
                        TAP TO REMOVE
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      border: `1.5px dashed ${isTarget ? THEME.accent + '60' : THEME.border.medium}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s',
                    }}>
                      <span style={{
                        fontSize: 14, color: isTarget ? THEME.accent + '80' : THEME.border.bright,
                        transition: 'color 0.2s',
                      }}>
                        +
                      </span>
                    </div>
                    <div style={{
                      fontSize: 9,
                      color: isTarget ? THEME.accent : THEME.text.tertiary,
                      fontStyle: 'italic',
                      transition: 'color 0.2s',
                    }}>
                      {isTarget ? 'Tap to equip' : 'No item'}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EmptySlot() {
  return (
    <div style={{
      padding: '10px 6px',
      border: `1.5px dashed ${THEME.border.subtle}`,
      borderRadius: 10,
      opacity: 0.3,
      minHeight: 100,
    }} />
  );
}
