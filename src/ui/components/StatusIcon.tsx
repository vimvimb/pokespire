import type { StatusType, BuffType } from '../../config/cards';

interface StatusIconProps {
  type: StatusType | BuffType;
  stacks: number;
}

const statusColors: Record<StatusType | BuffType, string> = {
  poison: '#a855f7',
  burn: '#f97316',
  freeze: '#06b6d4',
  paralyze: '#eab308',
  attackUp: '#22c55e',
};

const statusNames: Record<StatusType | BuffType, string> = {
  poison: 'Poison',
  burn: 'Burn',
  freeze: 'Freeze',
  paralyze: 'Paralyze',
  attackUp: 'Atk+',
};

export function StatusIcon({ type, stacks }: StatusIconProps) {
  if (stacks <= 0) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        backgroundColor: statusColors[type],
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'white',
        margin: '2px',
      }}
      title={`${statusNames[type]} x${stacks}`}
    >
      <span>{statusNames[type]}</span>
      <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0 4px', borderRadius: '2px' }}>
        {stacks}
      </span>
    </div>
  );
}
