import { useEffect, useState } from 'react';

interface Props {
  campaignId: string;
  onComplete: () => void;
}

/**
 * Full-screen overlay that plays a campaign-specific transition effect,
 * then calls onComplete when the animation finishes.
 */
export function CampaignTransition({ campaignId, onComplete }: Props) {
  if (campaignId === 'campaign_2') {
    return <ThreadsOfTimeTransition onComplete={onComplete} />;
  }
  // Default: Dead Signal (rocket_tower and any future unknown campaigns)
  return <DeadSignalTransition onComplete={onComplete} />;
}

// ── Dead Signal: static flicker → black ──────────────────────────────────────

function DeadSignalTransition({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'flicker' | 'black'>('flicker');

  useEffect(() => {
    // Flicker for ~900ms, then cut to black for ~300ms
    const flickerTimer = setTimeout(() => setPhase('black'), 900);
    const completeTimer = setTimeout(onComplete, 1200);
    return () => {
      clearTimeout(flickerTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: phase === 'black' ? '#000' : 'transparent',
        animation: phase === 'flicker' ? 'deadSignalFlicker 900ms steps(1) forwards' : undefined,
        pointerEvents: 'all',
      }}
    >
      {/* Noise texture overlay */}
      {phase === 'flicker' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.02) 2px,
              rgba(255,255,255,0.02) 4px
            )`,
            animation: 'deadSignalNoise 100ms infinite steps(2)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      <style>{`
        @keyframes deadSignalFlicker {
          0%   { background: rgba(0,0,0,0); }
          10%  { background: rgba(0,0,0,0.7); }
          15%  { background: rgba(0,0,0,0.1); }
          30%  { background: rgba(0,0,0,0.8); }
          35%  { background: rgba(0,0,0,0.15); }
          55%  { background: rgba(0,0,0,0.85); }
          60%  { background: rgba(0,0,0,0.2); }
          75%  { background: rgba(0,0,0,0.9); }
          80%  { background: rgba(0,0,0,0.3); }
          90%  { background: rgba(0,0,0,0.95); }
          100% { background: rgba(0,0,0,1); }
        }
        @keyframes deadSignalNoise {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-1px, 1px); }
          100% { transform: translate(1px, -1px); }
        }
      `}</style>
    </div>
  );
}

// ── Threads of Time: green radial wash ───────────────────────────────────────

function ThreadsOfTimeTransition({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'bloom' | 'hold'>('bloom');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const completeTimer = setTimeout(onComplete, 1200);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(74,222,128,0.3) 0%, rgba(74,222,128,0.05) 60%, transparent 100%)',
          animation:
            phase === 'bloom'
              ? 'threadsBloom 800ms ease-out forwards'
              : 'threadsFade 400ms ease-in forwards',
        }}
      />

      <style>{`
        @keyframes threadsBloom {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes threadsFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
