import { useState, useRef, useEffect, memo } from 'react';
import { ITEM_DEFS, RARITY_COLORS } from '../../data/items';
import { HeldItemMotif } from './HeldItemMotif';
import { THEME } from '../theme';

interface Props {
  itemIds: string[];
  ownerName: string;
}

function HeldItemsSidebarInner({ itemIds, ownerName }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredItem = hoveredId ? ITEM_DEFS[hoveredId] : null;

  // Trigger slide-in when items change (new pokemon's turn)
  const prevKeyRef = useRef<string>('');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const key = ownerName + ':' + itemIds.join(',');
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      setAnimKey(k => k + 1);
    }
  }, [itemIds, ownerName]);

  return (
    <div
      key={animKey}
      className="hisb-slide"
      style={{ flexShrink: 0, marginBottom: 6 }}
    >
      {/* Header — "{Name}'s Held Items" */}
      <div style={{
        fontSize: 11, fontWeight: 'bold',
        color: THEME.accent,
        ...THEME.heading,
        letterSpacing: '0.08em',
        marginBottom: 5,
        padding: '0 2px',
      }}>
        {ownerName}&rsquo;s Held Items
      </div>

      {/* Item icons — wraps to multiple rows if needed */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
      }}>
        {itemIds.map(id => {
          const def = ITEM_DEFS[id];
          if (!def) return null;
          const catColor = RARITY_COLORS[def.rarity];
          const isHovered = hoveredId === id;

          return (
            <div
              key={id}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                border: `1.5px solid ${isHovered ? catColor : catColor + '60'}`,
                background: isHovered
                  ? `linear-gradient(135deg, ${catColor}30, ${catColor}10)`
                  : `linear-gradient(135deg, rgba(40,40,55,0.95), rgba(30,30,42,0.95))`,
                cursor: 'default',
                transition: 'all 0.15s',
                boxShadow: isHovered
                  ? `0 0 10px ${catColor}40, inset 0 0 8px ${catColor}15`
                  : `inset 0 1px 4px rgba(0,0,0,0.3)`,
              }}
            >
              <div style={{ filter: 'brightness(1.8) saturate(1.3)' }}>
                <HeldItemMotif itemId={id} size={30} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip (below icons) */}
      {hoveredItem && (
        <div style={{
          marginTop: 5,
          padding: '6px 8px',
          background: THEME.bg.elevated,
          borderRadius: 6,
          border: '1px solid ' + RARITY_COLORS[hoveredItem.rarity] + '50',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 'bold',
            color: RARITY_COLORS[hoveredItem.rarity],
            ...THEME.heading,
            marginBottom: 2,
          }}>
            {hoveredItem.name}
          </div>
          <div style={{
            fontSize: 10,
            color: THEME.text.secondary,
            lineHeight: 1.35,
          }}>
            {hoveredItem.description}
          </div>
        </div>
      )}

      <style>{`
        @keyframes hisbSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .hisb-slide {
          animation: hisbSlideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

export const HeldItemsSidebar = memo(HeldItemsSidebarInner);
