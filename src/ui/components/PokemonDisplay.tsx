import type { PokemonCombatState } from '../../engine/types';
import { getPokemonStats } from '../../config/pokemon';
import { HealthBar } from './HealthBar';
import { ManaBar } from './ManaBar';
import { StatusIcon } from './StatusIcon';

interface PokemonDisplayProps {
  pokemon: PokemonCombatState;
  isEnemy?: boolean;
  isCurrentTurn?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PokemonDisplay({ pokemon, isEnemy = false, isCurrentTurn = false, isSelected = false, onClick }: PokemonDisplayProps) {
  const stats = getPokemonStats(pokemon.pokemonId);
  const spriteUrl = isEnemy
    ? `https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.pokemonId}.gif`
    : `https://img.pokemondb.net/sprites/black-white/anim/back-normal/${pokemon.pokemonId}.gif`;

  // Determine border color: selected > current turn > default
  const borderColor = isSelected ? '#3b82f6' : isCurrentTurn ? '#fbbf24' : '#4b5563';
  const borderWidth = isSelected ? '3px' : isCurrentTurn ? '3px' : '2px';
  const backgroundColor = isSelected ? '#1e3a5f' : isCurrentTurn ? '#1f2937' : '#111827';

  return (
    <div
      style={{
        border: `${borderWidth} solid ${borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: backgroundColor,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        opacity: pokemon.currentHp <= 0 ? 0.5 : 1,
        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
      }}
      onClick={onClick}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <img
          src={spriteUrl}
          alt={stats.name}
          style={{
            width: '80px',
            height: '80px',
            imageRendering: 'pixelated',
          }}
          onError={(e) => {
            // Fallback if sprite doesn't exist
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{stats.name}</div>
        {pokemon.playerId && (
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Player: {pokemon.playerId}</div>
        )}
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
          Speed: {pokemon.speed}
        </div>
      </div>
      <HealthBar current={pokemon.currentHp} max={pokemon.maxHp} />
      {!isEnemy && <ManaBar current={pokemon.currentMana} max={pokemon.maxMana} />}
      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {pokemon.statuses.map((status, i) => (
          <StatusIcon key={i} type={status.type} stacks={status.stacks} />
        ))}
        {pokemon.buffs.map((buff, i) => (
          <StatusIcon key={`buff-${i}`} type={buff.type} stacks={buff.stacks} />
        ))}
      </div>
      {pokemon.block > 0 && (
        <div style={{ 
          marginTop: '4px', 
          fontSize: '12px', 
          fontWeight: 'bold',
          color: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.2)',
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          🛡️ Block: {pokemon.block}
        </div>
      )}
      {isSelected && (
        <div style={{
          marginTop: '4px',
          fontSize: '11px',
          color: '#3b82f6',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          ✓ Selected as Target
        </div>
      )}
    </div>
  );
}
