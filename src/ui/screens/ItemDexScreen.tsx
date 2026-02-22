import { useState, useMemo } from 'react';
import { ITEM_DEFS, RARITY_COLORS, type ItemRarity, type ItemDefinition } from '../../data/items';
import { HeldItemBadge } from '../components/HeldItemBadge';
import { ScreenShell } from '../components/ScreenShell';
import { Flourish } from '../components/Flourish';
import { DexFrame } from '../components/DexFrame';
import { THEME } from '../theme';

interface Props {
  onBack: () => void;
}

const ALL_RARITIES: ItemRarity[] = ['starting', 'common', 'boss'];

const RARITY_LABELS: Record<ItemRarity, string> = {
  starting: 'Starting',
  common: 'Common',
  boss: 'Boss',
};

// ── Filter sidebar helpers ──────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 9,
        color: THEME.text.tertiary,
        ...THEME.heading,
        letterSpacing: '0.12em',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function SidebarFilterButton({ label, count, color, isActive, onClick }: {
  label: string;
  count: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="idex-filter-btn"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '4px 8px',
        borderRadius: 4,
        border: isActive ? `1px solid ${color}50` : '1px solid transparent',
        background: isActive ? `${color}12` : 'transparent',
        cursor: 'pointer',
        width: '100%',
        fontSize: 11,
        color: isActive ? color : THEME.text.tertiary,
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'all 0.15s',
        textTransform: 'capitalize',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          opacity: isActive ? 1 : 0.4,
          flexShrink: 0,
          display: 'inline-block',
        }} />
        {label}
      </span>
      <span style={{ fontSize: 10, opacity: 0.6 }}>{count}</span>
    </button>
  );
}

// ── Item card component — "floating artifact" ──────────────────────

function ItemCard({ item, isSelected, onClick, delay }: {
  item: ItemDefinition;
  isSelected: boolean;
  onClick: () => void;
  delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  const rarityColor = RARITY_COLORS[item.rarity];

  return (
    <div
      className="idex-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '20px 12px 14px',
        cursor: 'pointer',
        animation: 'idexCardIn 0.25s ease-out forwards',
        animationDelay: `${delay}ms`,
        opacity: 0,
        border: 'none',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {/* Icon + rarity glow aura */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 80,
      }}>
        {/* Radial glow behind the icon */}
        <div
          className="idex-glow"
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${rarityColor}${isSelected ? '30' : '15'} 0%, transparent 70%)`,
            transition: 'background 0.3s, box-shadow 0.3s',
            boxShadow: isSelected ? `0 0 24px ${rarityColor}25` : 'none',
          }}
        />
        <HeldItemBadge itemId={item.id} size={72} />
      </div>

      {/* Name */}
      <div style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: isSelected ? rarityColor : THEME.text.primary,
        textAlign: 'center',
        ...THEME.heading,
        letterSpacing: '0.05em',
        transition: 'color 0.2s',
      }}>
        {item.name.toUpperCase()}
      </div>

      {/* Rarity */}
      <div style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 'bold',
          color: rarityColor,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {item.rarity}
        </span>
      </div>

      {/* Hover tooltip with description */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: THEME.bg.panel,
          border: `1px solid ${THEME.border.medium}`,
          borderLeft: `3px solid ${rarityColor}`,
          padding: '8px 12px',
          fontSize: 12,
          lineHeight: '1.45',
          color: THEME.text.secondary,
          whiteSpace: 'normal',
          width: 200,
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          borderRadius: 4,
        }}>
          <div style={{
            fontWeight: 700,
            marginBottom: 3,
            color: rarityColor,
            fontSize: 11,
            ...THEME.heading,
          }}>
            {item.name}
          </div>
          {item.description}
        </div>
      )}
    </div>
  );
}

// ── Detail panel ────────────────────────────────────────────────────

function ItemDetail({ item }: { item: ItemDefinition }) {
  const rarityColor = RARITY_COLORS[item.rarity];

  return (
    <div
      className="idex-detail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '32px 24px',
      }}
    >
      {/* Large floating artifact with aura */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 120,
      }}>
        <div style={{
          position: 'absolute',
          inset: -16,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rarityColor}28 0%, ${rarityColor}08 50%, transparent 75%)`,
          boxShadow: `0 0 32px ${rarityColor}20`,
        }} />
        <HeldItemBadge itemId={item.id} size={110} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 22,
          fontWeight: 'bold',
          color: rarityColor,
          ...THEME.heading,
          letterSpacing: '0.1em',
        }}>
          {item.name.toUpperCase()}
        </div>
        <Flourish variant="heading" width={80} color={rarityColor} />
      </div>

      {/* Rarity tag */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 'bold',
          color: rarityColor,
          padding: '3px 10px',
          border: `1px solid ${rarityColor}50`,
          borderRadius: 12,
          background: `${rarityColor}12`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {item.rarity}
        </span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: 15,
        color: THEME.text.secondary,
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: 320,
        padding: '12px 16px',
        background: THEME.chrome.backdrop,
        borderRadius: 6,
        borderLeft: `3px solid ${rarityColor}`,
      }}>
        {item.description}
      </div>
    </div>
  );
}

// ── Root component ──────────────────────────────────────────────────

export function ItemDexScreen({ onBack }: Props) {
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const allItems = useMemo(() => Object.values(ITEM_DEFS), []);

  const rarityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    for (const r of ALL_RARITIES) counts[r] = allItems.filter(i => i.rarity === r).length;
    return counts;
  }, [allItems]);

  const filtered = useMemo(() => {
    return allItems
      .filter(item => {
        if (selectedRarity !== 'all' && item.rarity !== selectedRarity) return false;
        return true;
      })
      .sort((a, b) => {
        const rarityOrder = ALL_RARITIES.indexOf(a.rarity) - ALL_RARITIES.indexOf(b.rarity);
        if (rarityOrder !== 0) return rarityOrder;
        return a.name.localeCompare(b.name);
      });
  }, [allItems, selectedRarity]);

  const selectedItem = selectedItemId ? ITEM_DEFS[selectedItemId] : null;

  const headerBar = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: `1px solid ${THEME.border.subtle}`,
    }}>
      <button
        onClick={onBack}
        style={{ padding: '8px 16px', ...THEME.button.secondary, fontSize: 13 }}
      >
        &larr; Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>
          {'\uD83C\uDF92'}
        </span>
        <span style={{
          color: THEME.accent,
          fontWeight: 'bold',
          fontSize: 20,
          ...THEME.heading,
          letterSpacing: '0.1em',
        }}>
          Item Dex
        </span>
      </div>
      <div style={{ width: 80 }} />
    </div>
  );

  return (
    <ScreenShell header={headerBar} ambient bodyStyle={{ padding: '24px 24px 48px' }}>
      <div style={{
        display: 'flex',
        gap: 0,
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {/* ── Sidebar ── */}
        <div style={{
          width: 170,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
        }}>
          <DexFrame>
            <div style={{ padding: '14px 12px 18px' }}>
              <FilterSection label="RARITY">
                <SidebarFilterButton
                  label="All"
                  count={rarityCounts.all}
                  color={THEME.text.secondary}
                  isActive={selectedRarity === 'all'}
                  onClick={() => setSelectedRarity('all')}
                />
                {ALL_RARITIES.map(r => (
                  <SidebarFilterButton
                    key={r}
                    label={RARITY_LABELS[r]}
                    count={rarityCounts[r]}
                    color={RARITY_COLORS[r]}
                    isActive={selectedRarity === r}
                    onClick={() => setSelectedRarity(selectedRarity === r ? 'all' : r)}
                  />
                ))}
              </FilterSection>
            </div>
          </DexFrame>
        </div>

        <div style={{ width: 20 }} />

        {/* ── Main grid area ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <DexFrame>
            <div style={{ padding: '16px 20px 24px' }}>
              <div style={{
                fontSize: 11,
                color: THEME.text.tertiary,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              </div>
              <Flourish variant="heading" width={60} color={THEME.border.medium} />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
                marginTop: 16,
              }}>
                {filtered.map((item, i) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onClick={() => setSelectedItemId(
                      selectedItemId === item.id ? null : item.id
                    )}
                    delay={i * 20}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  color: THEME.text.tertiary,
                  fontStyle: 'italic',
                  fontSize: 13,
                }}>
                  No items match the selected filters
                </div>
              )}
            </div>
          </DexFrame>

          {/* Detail panel below grid */}
          {selectedItem && (
            <div style={{ marginTop: 16 }}>
              <DexFrame>
                <ItemDetail item={selectedItem} />
              </DexFrame>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .idex-card {
          transition: transform 0.2s;
        }
        .idex-card:hover {
          transform: translateY(-4px) !important;
        }
        .idex-filter-btn:hover {
          background: rgba(255, 255, 255, 0.04) !important;
        }
        .idex-detail {
          animation: idexDetailIn 0.25s ease-out forwards;
        }
        @keyframes idexCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes idexDetailIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ScreenShell>
  );
}
