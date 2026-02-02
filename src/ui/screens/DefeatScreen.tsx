interface DefeatScreenProps {
  onReturnToMenu: () => void;
}

export function DefeatScreen({ onReturnToMenu }: DefeatScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#0f172a',
        color: 'white',
      }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#ef4444' }}>Defeat</h1>
      
      <div
        style={{
          maxWidth: '600px',
          padding: '24px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          marginBottom: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '16px' }}>
          Your party has been defeated. The run has ended.
        </p>
        <p style={{ fontSize: '16px', color: '#9ca3af' }}>
          Mewtwo continues to wreak havoc. Try again to stop the chaos!
        </p>
      </div>

      <button
        onClick={onReturnToMenu}
        style={{
          padding: '16px 32px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Return to Menu
      </button>
    </div>
  );
}
