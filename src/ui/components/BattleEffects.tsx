import { useState, useEffect, useCallback } from 'react';

// Types for battle events
export interface BattleEvent {
  id: string;
  type: 'damage' | 'heal' | 'block' | 'status' | 'card_played';
  targetId?: string;
  sourceId?: string;
  value?: number;
  text?: string;
  timestamp: number;
}

interface FloatingNumberProps {
  event: BattleEvent;
  position: { x: number; y: number };
  onComplete: () => void;
}

// Floating damage/heal number that animates upward and fades
function FloatingNumber({ event, position, onComplete }: FloatingNumberProps) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    // Animate upward and fade out
    const startTime = Date.now();
    const duration = 1000; // 1 second animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setOffsetY(-60 * progress); // Move up 60px
      setOpacity(1 - progress * 0.8); // Fade to 20% opacity

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  const color = event.type === 'damage' ? '#ef4444'
    : event.type === 'heal' ? '#4ade80'
    : event.type === 'block' ? '#60a5fa'
    : '#facc15';

  const prefix = event.type === 'damage' ? '-'
    : event.type === 'heal' ? '+'
    : event.type === 'block' ? '🛡️+'
    : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y + offsetY,
        transform: 'translate(-50%, -50%)',
        fontSize: 28,
        fontWeight: 'bold',
        color,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
        opacity,
        pointerEvents: 'none',
        zIndex: 100,
        whiteSpace: 'nowrap',
      }}
    >
      {prefix}{event.value}
    </div>
  );
}

interface CardPlayedBannerProps {
  sourceName: string;
  cardName: string;
  onComplete: () => void;
}

// Banner that shows what card was played
function CardPlayedBanner({ sourceName, cardName, onComplete }: CardPlayedBannerProps) {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    // Fade in, hold, fade out
    const startTime = Date.now();
    const fadeInDuration = 150;
    const holdDuration = 600;
    const fadeOutDuration = 200;
    const totalDuration = fadeInDuration + holdDuration + fadeOutDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed < fadeInDuration) {
        // Fade in
        const progress = elapsed / fadeInDuration;
        setOpacity(progress);
        setScale(0.8 + 0.2 * progress);
      } else if (elapsed < fadeInDuration + holdDuration) {
        // Hold
        setOpacity(1);
        setScale(1);
      } else if (elapsed < totalDuration) {
        // Fade out
        const progress = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
        setOpacity(1 - progress);
      } else {
        onComplete();
        return;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        padding: '12px 24px',
        background: 'rgba(30, 30, 46, 0.95)',
        border: '2px solid #facc15',
        borderRadius: 12,
        opacity,
        pointerEvents: 'none',
        zIndex: 200,
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 14, color: '#94a3b8' }}>{sourceName}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#facc15' }}>{cardName}</div>
    </div>
  );
}

// Hook to manage battle effects
export function useBattleEffects() {
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [cardBanner, setCardBanner] = useState<{ sourceName: string; cardName: string; id: string } | null>(null);

  const addEvent = useCallback((event: Omit<BattleEvent, 'id' | 'timestamp'>) => {
    const newEvent: BattleEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const showCardPlayed = useCallback((sourceName: string, cardName: string) => {
    setCardBanner({ sourceName, cardName, id: `${Date.now()}` });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearCardBanner = useCallback(() => {
    setCardBanner(null);
  }, []);

  return {
    events,
    cardBanner,
    addEvent,
    showCardPlayed,
    removeEvent,
    clearCardBanner,
  };
}

interface BattleEffectsLayerProps {
  events: BattleEvent[];
  cardBanner: { sourceName: string; cardName: string; id: string } | null;
  getPositionForCombatant: (combatantId: string) => { x: number; y: number } | null;
  onEventComplete: (id: string) => void;
  onBannerComplete: () => void;
}

// The visual layer that renders all effects
export function BattleEffectsLayer({
  events,
  cardBanner,
  getPositionForCombatant,
  onEventComplete,
  onBannerComplete,
}: BattleEffectsLayerProps) {
  return (
    <>
      {/* Floating numbers */}
      {events.map(event => {
        if (!event.targetId || event.value === undefined) return null;
        const position = getPositionForCombatant(event.targetId);
        if (!position) return null;

        return (
          <FloatingNumber
            key={event.id}
            event={event}
            position={position}
            onComplete={() => onEventComplete(event.id)}
          />
        );
      })}

      {/* Card played banner */}
      {cardBanner && (
        <CardPlayedBanner
          key={cardBanner.id}
          sourceName={cardBanner.sourceName}
          cardName={cardBanner.cardName}
          onComplete={onBannerComplete}
        />
      )}
    </>
  );
}
