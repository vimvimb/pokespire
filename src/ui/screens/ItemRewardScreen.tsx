import { useCallback } from 'react';
import type { RunState } from '../../run/types';
import type { ItemDefinition } from '../../data/items';
import { RARITY_COLORS } from '../../data/items';
import { getPokemon } from '../../data/loaders';
import { HeldItemMotif } from '../components/HeldItemMotif';
import { HeldItemBadge } from '../components/HeldItemBadge';
import { ScreenShell } from '../components/ScreenShell';
import { Flourish } from '../components/Flourish';
import { TYPE_COLORS } from '../components/PokemonTile';
import { THEME } from '../theme';
import { getSpriteUrl } from '../utils/sprites';

interface Props {
  run: RunState;
  rewardItem: ItemDefinition;
  onAssign: (pokemonIndex: number) => void;
  onSkip: () => void;
}

export function ItemRewardScreen({ run, rewardItem, onAssign, onSkip }: Props) {
  const rarityColor = RARITY_COLORS[rewardItem.rarity];

  const handleAssign = useCallback((index: number) => {
    onAssign(index);
  }, [onAssign]);

  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '12px 20px',
      borderBottom: `1px solid ${THEME.border.subtle}`,
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{ ...THEME.heading, fontSize: 16, color: rarityColor, letterSpacing: '0.12em' }}>
        Item Found!
      </div>
    </div>
  );

  return (
    <ScreenShell
      header={header}
      bodyStyle={{ padding: '28px 16px 48px' }}
      ambient
      ambientTint={`${rarityColor}04`}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Item Card */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 20px',
          background: `linear-gradient(180deg, ${rarityColor}08, ${THEME.bg.panelDark})`,
          border: `1.5px solid ${rarityColor}40`,
          borderRadius: 12,
          marginBottom: 8,
        }}>
          <HeldItemMotif itemId={rewardItem.id} size={64} />
          <div style={{
            fontSize: 18, fontWeight: 'bold', color: rarityColor,
            ...THEME.heading, letterSpacing: '0.08em', marginTop: 12,
          }}>
            {rewardItem.name}
          </div>
          <div style={{
            display: 'flex', gap: 8, marginTop: 6, alignItems: 'center',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 'bold', color: rarityColor,
              ...THEME.heading, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {rewardItem.rarity}
            </span>
          </div>
          <div style={{
            fontSize: 13, color: THEME.text.secondary, marginTop: 10,
            textAlign: 'center', lineHeight: 1.4, maxWidth: 360,
          }}>
            {rewardItem.description}
          </div>
        </div>

        <Flourish />

        {/* Section divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: THEME.border.subtle }} />
          <div style={{
            fontSize: 11, fontWeight: 'bold', color: THEME.text.tertiary,
            ...THEME.heading, letterSpacing: '0.12em',
          }}>
            Choose a Pokemon
          </div>
          <div style={{ flex: 1, height: 1, background: THEME.border.subtle }} />
        </div>

        {/* Party list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {run.party.map((pokemon, index) => {
            if (pokemon.knockedOut) return null;
            const data = getPokemon(pokemon.formId);
            const typeColor = TYPE_COLORS[data.types[0]];

            return (
              <button
                key={index}
                onClick={() => handleAssign(index)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 16px 10px 10px',
                  background: `linear-gradient(90deg, ${typeColor}06, transparent)`,
                  border: `1.5px solid ${THEME.border.subtle}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: THEME.text.primary,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                {/* Sprite */}
                <div style={{
                  width: 48, height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${typeColor}15, transparent)`,
                  borderRadius: 8,
                  border: `1px solid ${typeColor}20`,
                }}>
                  <img
                    src={getSpriteUrl(pokemon.formId)}
                    alt={data.name}
                    style={{
                      width: 40, height: 40,
                      imageRendering: 'pixelated',
                      objectFit: 'contain',
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>

                {/* Pokemon info */}
                <div style={{ minWidth: 80, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 'bold', color: THEME.text.primary,
                    ...THEME.heading, letterSpacing: '0.08em',
                  }}>
                    {data.name}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.text.secondary, marginTop: 2 }}>
                    {pokemon.currentHp}/{pokemon.maxHp} HP
                  </div>
                </div>

                {/* Existing items */}
                <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
                  {pokemon.heldItemIds.map(itemId => (
                    <HeldItemBadge key={itemId} itemId={itemId} size={22} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip button */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={onSkip}
            style={{
              ...THEME.button.secondary,
              padding: '8px 28px',
              fontSize: 12,
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
