import type { PokemonId } from '../../config/pokemon';
import { getPokemonStats } from '../../config/pokemon';

interface VictoryScreenProps {
  isFinalVictory: boolean;
  evolutions?: Array<{ from: PokemonId; to: PokemonId }>;
  onContinue: () => void;
}

export function VictoryScreen({ isFinalVictory, evolutions, onContinue }: VictoryScreenProps) {
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
      <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#22c55e' }}>
        {isFinalVictory ? '🎉 VICTORY! 🎉' : 'Battle Won!'}
      </h1>
      
      {isFinalVictory ? (
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
            You have successfully stopped Mewtwo and saved the day!
          </p>
          <p style={{ fontSize: '16px', color: '#9ca3af' }}>
            The Team Rocket lab is secure, and peace has been restored.
          </p>
        </div>
      ) : (
        <div
          style={{
            maxWidth: '600px',
            padding: '24px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Battle Complete!</h2>
          {evolutions && evolutions.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Evolutions:</h3>
              {evolutions.map((evo, i) => {
                const fromStats = getPokemonStats(evo.from);
                const toStats = getPokemonStats(evo.to);
                return (
                  <div key={i} style={{ marginBottom: '8px', fontSize: '16px' }}>
                    {fromStats.name} → <strong>{toStats.name}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onContinue}
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
        {isFinalVictory ? 'Return to Menu' : 'Continue'}
      </button>
    </div>
  );
}
