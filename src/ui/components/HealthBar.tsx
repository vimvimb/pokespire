import { THEME } from '../theme';

interface Props {
  current: number;
  max: number;
}

export function HealthBar({ current, max }: Props) {
  const pct = Math.max(0, (current / max) * 100);

  // Warmed color palette: emerald-teal, amber, warm red
  const fill = pct > 50
    ? 'linear-gradient(to bottom, #4ec9a0, #2a9d6e)'
    : pct > 25
      ? 'linear-gradient(to bottom, #e0b840, #c49520)'
      : 'linear-gradient(to bottom, #d45050, #a83030)';

  const shineColor = pct > 50
    ? 'rgba(140, 230, 200, 0.35)'
    : pct > 25
      ? 'rgba(240, 210, 120, 0.35)'
      : 'rgba(230, 140, 140, 0.30)';

  // Tick marks every 25% of max HP
  const tickInterval = 0.25;
  const ticks: number[] = [];
  for (let frac = tickInterval; frac < 1; frac += tickInterval) {
    ticks.push(frac * 100);
  }

  return (
    <div style={{
      width: '100%',
      height: 14,
      background: '#1a1a24',
      borderRadius: 4,
      overflow: 'hidden',
      border: `1.5px solid ${THEME.border.subtle}`,
      position: 'relative',
    }}>
      {/* HP fill */}
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: fill,
        transition: 'width 0.3s ease',
        position: 'relative',
      }}>
        {/* Top-edge shine */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(to bottom, ${shineColor}, transparent)`,
          borderRadius: '3px 3px 0 0',
        }} />
      </div>

      {/* Tick marks at 25% intervals */}
      {ticks.map(tickPct => (
        <div
          key={tickPct}
          style={{
            position: 'absolute',
            left: `${tickPct}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      ))}

      {/* Numeric readout */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 11,
        lineHeight: '14px',
        color: THEME.text.primary,
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}>
        {current}/{max}
      </span>
    </div>
  );
}
