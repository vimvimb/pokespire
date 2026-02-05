import { useState } from 'react';
import type { Combatant } from '../../engine/types';
import { HealthBar } from './HealthBar';
import { EnergyBar } from './EnergyBar';
import { StatusIcons } from './StatusIcons';
import { getSpriteSize } from '../../data/heights';

interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
  onInspect?: () => void;
}

export function PokemonSprite({ combatant, isCurrentTurn, isTargetable, onSelect, onInspect }: Props) {
  const [imgError, setImgError] = useState(false);
  const isEnemy = combatant.side === 'enemy';

  const spriteUrl = isEnemy
    ? `https://img.pokemondb.net/sprites/black-white/anim/normal/${combatant.pokemonId}.gif`
    : `https://img.pokemondb.net/sprites/black-white/anim/back-normal/${combatant.pokemonId}.gif`;

  const opacity = combatant.alive ? 1 : 0.3;

  // Scale sprite based on Pokemon height (Pikachu = 80px reference)
  const spriteSize = getSpriteSize(combatant.pokemonId);

  // Handle click: target if targetable, otherwise inspect if available
  const handleClick = () => {
    if (isTargetable && combatant.alive && onSelect) {
      onSelect();
    } else if (onInspect) {
      onInspect();
    }
  };

  const isClickable = (isTargetable && combatant.alive) || !!onInspect;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 12,
        cursor: isClickable ? 'pointer' : 'default',
        opacity,
        transition: 'all 0.2s',
        minWidth: 140,
      }}
    >
      {/* Current turn / targetable indicator - subtle glow instead of box */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: isCurrentTurn
          ? 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.8))'
          : isTargetable && combatant.alive
            ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))'
            : 'none',
      }}>
        <div style={{ fontSize: 17, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 4 }}>
          {combatant.name}
        </div>

        {!imgError ? (
          <img
            src={spriteUrl}
            alt={combatant.name}
            onError={() => setImgError(true)}
            style={{
              width: spriteSize,
              height: spriteSize,
              imageRendering: 'pixelated',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{
            width: spriteSize,
            height: spriteSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
          }}>
            {isEnemy ? '👾' : '🔮'}
          </div>
        )}
      </div>

      {combatant.block > 0 && (
        <div style={{
          fontSize: 15,
          color: '#60a5fa',
          fontWeight: 'bold',
        }}>
          🛡️ {combatant.block}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 120 }}>
        <HealthBar current={combatant.hp} max={combatant.maxHp} />
      </div>

      {combatant.side === 'player' && (
        <div style={{ width: '100%', maxWidth: 120 }}>
          <EnergyBar current={combatant.energy} max={combatant.energyCap} />
        </div>
      )}

      <StatusIcons statuses={combatant.statuses} />

      {!combatant.alive && (
        <div style={{ fontSize: 15, color: '#ef4444', fontWeight: 'bold' }}>FAINTED</div>
      )}
    </div>
  );
}
