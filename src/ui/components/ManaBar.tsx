interface ManaBarProps {
  current: number;
  max: number;
}

export function ManaBar({ current, max }: ManaBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '16px',
          backgroundColor: '#1e3a5f',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #3b82f6',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ fontSize: '10px', marginTop: '2px', textAlign: 'center', color: '#93c5fd' }}>
        {current} / {max}
      </div>
    </div>
  );
}
