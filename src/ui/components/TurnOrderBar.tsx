import type { PokemonCombatState } from '../../engine/types';
import { getPokemonStats } from '../../config/pokemon';

interface TurnOrderBarProps {
  turnOrder: PokemonCombatState[];
  currentTurnIndex: number;
}

export function TurnOrderBar({ turnOrder, currentTurnIndex }: TurnOrderBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        overflowX: 'auto',
      }}
    >
      {turnOrder.map((pokemon, index) => {
        const stats = getPokemonStats(pokemon.pokemonId);
        const isCurrent = index === currentTurnIndex;
        const isDead = pokemon.currentHp <= 0;
        
        return (
          <div
            key={`${pokemon.pokemonId}-${index}`}
            style={{
              padding: '8px 12px',
              backgroundColor: isCurrent ? '#fbbf24' : isDead ? '#6b7280' : '#374151',
              borderRadius: '6px',
              minWidth: '100px',
              textAlign: 'center',
              border: isCurrent ? '2px solid #f59e0b' : '1px solid #4b5563',
              opacity: isDead ? 0.5 : 1,
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{stats.name}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
              {pokemon.playerId ? `Player` : 'Enemy'}
            </div>
            <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
              Speed: {pokemon.speed}
            </div>
            {isCurrent && <div style={{ fontSize: '10px', marginTop: '4px' }}>→</div>}
          </div>
        );
      })}
    </div>
  );
}
