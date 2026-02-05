import { useState } from 'react';
import type { RunState } from '../../run/types';
import { getPokemon } from '../../data/loaders';

interface Props {
  run: RunState;
  onHeal: (pokemonIndex: number) => void;
  onMaxHpBoost: (pokemonIndex: number) => void;
}

type RestChoice = 'heal' | 'maxhp';

const HEAL_PERCENT = 0.3; // 30%
const MAX_HP_BOOST = 10;

export function RestScreen({ run, onHeal, onMaxHpBoost }: Props) {
  const [selectedChoice, setSelectedChoice] = useState<RestChoice>('heal');

  const handleSelectPokemon = (pokemonIndex: number) => {
    if (selectedChoice === 'heal') {
      onHeal(pokemonIndex);
    } else {
      onMaxHpBoost(pokemonIndex);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: 32,
      color: '#e2e8f0',
      minHeight: '100vh',
      background: '#0f0f17',
    }}>
      <h1 style={{ fontSize: 30, margin: 0, color: '#facc15' }}>
        Rest Point
      </h1>

      <p style={{ color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: 400 }}>
        Choose a benefit for one of your Pokemon
      </p>

      {/* Choice Selection */}
      <div style={{
        display: 'flex',
        gap: 16,
      }}>
        <button
          onClick={() => setSelectedChoice('heal')}
          style={{
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            borderRadius: 12,
            border: selectedChoice === 'heal' ? '3px solid #4ade80' : '3px solid #444',
            background: selectedChoice === 'heal' ? '#4ade8022' : '#1e1e2e',
            color: selectedChoice === 'heal' ? '#4ade80' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: 150,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>+30%</div>
          <div>Heal HP</div>
        </button>

        <button
          onClick={() => setSelectedChoice('maxhp')}
          style={{
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            borderRadius: 12,
            border: selectedChoice === 'maxhp' ? '3px solid #60a5fa' : '3px solid #444',
            background: selectedChoice === 'maxhp' ? '#60a5fa22' : '#1e1e2e',
            color: selectedChoice === 'maxhp' ? '#60a5fa' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: 150,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>+{MAX_HP_BOOST}</div>
          <div>Max HP</div>
        </button>
      </div>

      <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
        {selectedChoice === 'heal'
          ? 'Heal 30% of max HP'
          : `Permanently increase max HP by ${MAX_HP_BOOST} (also heals ${MAX_HP_BOOST})`
        }
      </p>

      {/* Pokemon Selection */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
      }}>
        {run.party.map((pokemon, i) => {
          const basePokemon = getPokemon(pokemon.formId);
          const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;
          const isDead = pokemon.currentHp <= 0;

          // Calculate preview values
          const healAmount = Math.floor(pokemon.maxHp * HEAL_PERCENT);
          const previewHealHp = Math.min(pokemon.currentHp + healAmount, pokemon.maxHp);
          const previewMaxHp = pokemon.maxHp + MAX_HP_BOOST;
          const previewBoostHp = Math.min(pokemon.currentHp + MAX_HP_BOOST, previewMaxHp);

          return (
            <div
              key={i}
              onClick={() => !isDead && handleSelectPokemon(i)}
              style={{
                width: 160,
                padding: 16,
                borderRadius: 12,
                border: isDead
                  ? '3px solid #333'
                  : selectedChoice === 'heal'
                    ? '3px solid #4ade80'
                    : '3px solid #60a5fa',
                background: isDead ? '#1a1a24' : '#1e1e2e',
                cursor: isDead ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                opacity: isDead ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
            >
              <img
                src={`https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.formId}.gif`}
                alt={basePokemon.name}
                style={{
                  width: 80,
                  height: 80,
                  imageRendering: 'pixelated',
                  objectFit: 'contain',
                  filter: isDead ? 'grayscale(100%)' : 'none',
                }}
              />

              <div style={{ fontSize: 17, fontWeight: 'bold', marginTop: 8 }}>
                {basePokemon.name}
              </div>

              {/* Current HP */}
              <div style={{
                width: '100%',
                height: 8,
                background: '#333',
                borderRadius: 4,
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444',
                  borderRadius: 4,
                }} />
              </div>

              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {pokemon.currentHp}/{pokemon.maxHp} HP
              </div>

              {/* Preview */}
              {!isDead && (
                <div style={{
                  marginTop: 12,
                  padding: 8,
                  background: selectedChoice === 'heal' ? '#4ade8022' : '#60a5fa22',
                  borderRadius: 8,
                  fontSize: 13,
                }}>
                  <div style={{
                    color: selectedChoice === 'heal' ? '#4ade80' : '#60a5fa',
                    fontWeight: 'bold',
                  }}>
                    After:
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {selectedChoice === 'heal'
                      ? `${previewHealHp}/${pokemon.maxHp} HP`
                      : `${previewBoostHp}/${previewMaxHp} HP`
                    }
                  </div>
                  {selectedChoice === 'heal' && (
                    <div style={{ color: '#4ade80', fontSize: 12 }}>
                      +{previewHealHp - pokemon.currentHp} HP
                    </div>
                  )}
                  {selectedChoice === 'maxhp' && (
                    <div style={{ color: '#60a5fa', fontSize: 12 }}>
                      +{MAX_HP_BOOST} Max HP
                    </div>
                  )}
                </div>
              )}

              {isDead && (
                <div style={{
                  marginTop: 12,
                  padding: 8,
                  background: '#ef444422',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#ef4444',
                }}>
                  FAINTED
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
