interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
}

export function HealthBar({ current, max, label }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const color = percentage > 50 ? '#4ade80' : percentage > 25 ? '#fbbf24' : '#ef4444';

  return (
    <div style={{ width: '100%' }}>
      {label && <div style={{ fontSize: '12px', marginBottom: '4px' }}>{label}</div>}
      <div
        style={{
          width: '100%',
          height: '20px',
          backgroundColor: '#374151',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #4b5563',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ fontSize: '11px', marginTop: '2px', textAlign: 'center' }}>
        {current} / {max}
      </div>
    </div>
  );
}
