import type { CombatState } from '../../engine/types';
import { getCombatant } from '../../engine/combat';
import { getEffectiveSpeed } from '../../engine/status';

interface Props {
  state: CombatState;
}

export function TurnOrderBar({ state }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      justifyContent: 'center',
      padding: '8px 16px',
      background: 'transparent',
      borderRadius: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center', marginRight: 8 }}>
        Round {state.round}
      </span>
      {state.turnOrder.map((entry, idx) => {
        const c = getCombatant(state, entry.combatantId);
        const isCurrent = idx === state.currentTurnIndex;
        const hasActed = entry.hasActed;

        return (
          <div
            key={entry.combatantId}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: isCurrent ? 'bold' : 'normal',
              background: isCurrent
                ? '#facc15'
                : hasActed
                  ? '#1e1e2e'
                  : c.side === 'player'
                    ? '#1e3a5f'
                    : '#5f1e1e',
              color: isCurrent ? '#000' : hasActed ? '#555' : '#e2e8f0',
              opacity: hasActed ? 0.5 : 1,
              border: isCurrent ? '1px solid #facc15' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.6 }}>{getEffectiveSpeed(c)}</span>
            {' '}{c.name}
          </div>
        );
      })}
    </div>
  );
}
