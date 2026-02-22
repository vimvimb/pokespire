import { useState, useMemo } from 'react';
import type { RunState, RecruitNode } from '../../run/types';
import { getPokemon } from '../../data/loaders';
import { getRecruitLevel, createRecruitPokemon } from '../../run/state';
import { STARTER_ITEM_IDS, ITEM_DEFS, RARITY_COLORS } from '../../data/items';
import { HeldItemMotif } from '../components/HeldItemMotif';

// Legendary beasts fight the full party, not 1v1
const LEGENDARY_BEAST_IDS = new Set(['raikou', 'entei', 'suicune']);
import { ScreenShell } from '../components/ScreenShell';
import { THEME } from '../theme';
import { getSpriteUrl } from '../utils/sprites';

interface Props {
  run: RunState;
  node: RecruitNode;
  battleResult: 'pending' | 'victory' | 'defeat' | null;
  onStartFight: (partyIndex: number) => void;
  onRecruit: (itemId?: string) => void;
  onDecline: () => void;
  onRestart: () => void;
}

export function RecruitScreen({ run, node, battleResult, onStartFight, onRecruit, onDecline, onRestart }: Props) {
  const recruitLevel = getRecruitLevel(run);
  // Determine actual form (may be evolved if level is high enough) — Fix #5
  const recruitMon = createRecruitPokemon(node.pokemonId, recruitLevel);
  const wildPokemon = getPokemon(recruitMon.formId);
  const isLegendaryBeast = LEGENDARY_BEAST_IDS.has(node.pokemonId);
  const benchFull = run.bench.length >= 4;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Starter items not held by any party or bench member
  const availableItems = useMemo(() => {
    const heldIds = new Set<string>();
    for (const p of run.party) for (const id of p.heldItemIds) heldIds.add(id);
    for (const p of run.bench) for (const id of p.heldItemIds) heldIds.add(id);
    return STARTER_ITEM_IDS.filter(id => !heldIds.has(id));
  }, [run.party, run.bench]);

  const header = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
    }}>
      <h1 style={{
        fontSize: 24,
        margin: 0,
        color: '#f97316',
        letterSpacing: THEME.heading.letterSpacing,
        textTransform: THEME.heading.textTransform,
      }}>
        Wild Encounter
      </h1>
      <button
        onClick={onRestart}
        style={{
          ...THEME.button.secondary,
          padding: '6px 14px',
          fontSize: 12,
        }}
      >
        Main Menu
      </button>
    </div>
  );

  return (
    <ScreenShell header={header} ambient>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '32px 16px 48px',
      }}>
        {/* Wild Pokemon display */}
        <div style={{
          textAlign: 'center',
          padding: 24,
          background: '#f9731622',
          border: '2px solid #f9731644',
          borderRadius: 16,
        }}>
          <img
            src={getSpriteUrl(recruitMon.formId)}
            alt={wildPokemon.name}
            style={{
              width: 120,
              height: 120,
              imageRendering: 'pixelated',
              objectFit: 'contain',
            }}
          />
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316', marginTop: 8 }}>
            {wildPokemon.name}
          </div>
          <div style={{ fontSize: 14, color: THEME.text.secondary, marginTop: 4 }}>
            Level {recruitLevel} | {recruitMon.maxHp} HP
          </div>
          <div style={{ fontSize: 12, color: THEME.text.tertiary, marginTop: 2 }}>
            Type: {wildPokemon.types.join(' / ')}
          </div>
        </div>

        {/* Phase: Select fighter */}
        {!battleResult && (
          <>
            <p style={{ color: THEME.text.secondary, margin: 0, textAlign: 'center', maxWidth: 450 }}>
              {isLegendaryBeast
                ? `A legendary ${wildPokemon.name} awaits. Your entire party will face it — only a full team can challenge a beast of this power.`
                : `A wild ${wildPokemon.name} appears! Choose one of your Pokemon to fight it 1-on-1. Win to recruit it to your bench.`
              }
            </p>

            {/* Legendary beast: single full-party challenge button */}
            {isLegendaryBeast && (
              <button
                onClick={() => onStartFight(-1)}
                style={{
                  padding: '14px 40px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 20px rgba(249,115,22,0.4)',
                }}
              >
                Challenge {wildPokemon.name}
              </button>
            )}

            {/* Individual fighter picker — only for non-legendary Pokemon */}
            {!isLegendaryBeast && <div style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {run.party.map((pokemon, i) => {
                const basePokemon = getPokemon(pokemon.formId);
                const isDead = pokemon.knockedOut || pokemon.currentHp <= 0;
                const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;

                return (
                  <div
                    key={i}
                    onClick={() => !isDead && onStartFight(i)}
                    style={{
                      width: 150,
                      padding: 14,
                      borderRadius: 14,
                      border: isDead ? '3px solid ' + THEME.border.subtle : '3px solid #f97316',
                      background: '#1e1e2e',
                      cursor: isDead ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      opacity: isDead ? 0.4 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDead) {
                        e.currentTarget.style.boxShadow = '0 0 16px #f9731644';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <img
                      src={getSpriteUrl(pokemon.formId)}
                      alt={basePokemon.name}
                      style={{
                        width: 64,
                        height: 64,
                        imageRendering: 'pixelated',
                        objectFit: 'contain',
                        filter: isDead ? 'grayscale(100%)' : 'none',
                      }}
                    />
                    <div style={{ fontSize: 15, fontWeight: 'bold', marginTop: 4 }}>
                      {basePokemon.name}
                    </div>
                    <div style={{
                      width: '100%',
                      height: 6,
                      background: THEME.border.subtle,
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginTop: 6,
                    }}>
                      <div style={{
                        width: `${hpPercent}%`,
                        height: '100%',
                        background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444',
                        borderRadius: 3,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: THEME.text.tertiary, marginTop: 2 }}>
                      {pokemon.currentHp}/{pokemon.maxHp} HP
                    </div>
                  </div>
                );
              })}
            </div>}
          </>
        )}

        {/* Phase: Victory */}
        {battleResult === 'victory' && (
          <>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#4ade80',
            }}>
              {wildPokemon.name} wants to join your team!
            </div>

            {/* Item picker */}
            {!benchFull && availableItems.length > 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                width: '100%', maxWidth: 600,
              }}>
                <div style={{
                  fontSize: 13, color: THEME.text.secondary, textAlign: 'center',
                }}>
                  Give {wildPokemon.name} a starter item? <span style={{ color: THEME.text.tertiary, fontStyle: 'italic' }}>(optional)</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 8,
                  width: '100%',
                }}>
                  {availableItems.map(itemId => {
                    const item = ITEM_DEFS[itemId];
                    const color = RARITY_COLORS[item.rarity];
                    const isSelected = selectedItemId === itemId;
                    return (
                      <button
                        key={itemId}
                        onClick={() => setSelectedItemId(prev => prev === itemId ? null : itemId)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                          padding: '12px 8px 10px',
                          background: isSelected
                            ? `linear-gradient(180deg, ${color}12, ${THEME.bg.panelDark})`
                            : THEME.bg.panelDark,
                          border: isSelected
                            ? `1.5px solid ${color}`
                            : `1.5px solid ${THEME.border.subtle}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          color: THEME.text.primary,
                          textAlign: 'center',
                          transition: 'all 0.15s',
                          boxShadow: isSelected
                            ? `0 0 16px ${color}20, inset 0 0 24px ${color}08`
                            : 'none',
                        }}
                      >
                        <HeldItemMotif itemId={itemId} size={36} />
                        <div style={{
                          fontSize: 11, fontWeight: 'bold',
                          color,
                          ...THEME.heading,
                          lineHeight: 1.2,
                          marginTop: 6,
                        }}>
                          {item.name}
                        </div>
                        <div style={{
                          fontSize: 8, fontWeight: 'bold',
                          color: THEME.text.tertiary,
                          ...THEME.heading,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          marginTop: 2, marginBottom: 5,
                        }}>
                          {item.rarity}
                        </div>
                        <div style={{
                          width: '80%', height: 1,
                          background: `linear-gradient(to right, transparent, ${color}50, transparent)`,
                          marginBottom: 5,
                        }} />
                        <div style={{
                          fontSize: 10, color: THEME.text.secondary,
                          lineHeight: 1.3,
                        }}>
                          {item.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={() => onRecruit(selectedItemId ?? undefined)}
                disabled={benchFull}
                style={{
                  padding: '14px 36px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  border: 'none',
                  background: benchFull ? '#333' : '#f97316',
                  color: benchFull ? '#666' : '#000',
                  cursor: benchFull ? 'not-allowed' : 'pointer',
                }}
              >
                {benchFull ? 'Bench Full' : 'Add to Bench'}
              </button>
              <button
                onClick={onDecline}
                style={{
                  padding: '14px 36px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  borderRadius: 10,
                  border: `2px solid ${THEME.border.bright}`,
                  background: 'transparent',
                  color: THEME.text.secondary,
                  cursor: 'pointer',
                }}
              >
                Decline
              </button>
            </div>

            {benchFull && (
              <div style={{ fontSize: 13, color: '#ef4444' }}>
                Your bench is full (4/4). Decline to continue.
              </div>
            )}
          </>
        )}

        {/* Phase: Defeat */}
        {battleResult === 'defeat' && (
          <>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#ef4444',
            }}>
              The wild {wildPokemon.name} fled!
            </div>
            <button
              onClick={onDecline}
              style={{
                padding: '14px 36px',
                fontSize: 16,
                fontWeight: 'bold',
                borderRadius: 10,
                border: 'none',
                background: THEME.accent,
                color: '#000',
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
