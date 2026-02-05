import { useState } from 'react';
import type { MoveDefinition, MoveType, CardRarity } from '../../engine/types';

interface Props {
  card: MoveDefinition;
  onClick?: () => void;
  isSelected?: boolean;
  showHoverEffect?: boolean;
}

const EFFECT_COLORS: Record<string, string> = {
  damage: '#ef4444',
  block: '#60a5fa',
  heal: '#4ade80',
  apply_status: '#a855f7',
  multi_hit: '#ef4444',
  heal_on_hit: '#4ade80',
  recoil: '#f97316',
  set_damage: '#fbbf24',
  percent_hp: '#f87171',
  self_ko: '#dc2626',
  draw_cards: '#60a5fa',
  gain_energy: '#fbbf24',
  apply_status_self: '#4ade80',
  cleanse: '#67e8f9',
};

const MOVE_TYPE_COLORS: Record<MoveType, string> = {
  normal: '#a8a878',
  fire: '#f08030',
  water: '#6890f0',
  grass: '#78c850',
  electric: '#f8d030',
  poison: '#a040a0',
  flying: '#a890f0',
  psychic: '#f85888',
  dark: '#705848',
  fighting: '#c03028',
  ice: '#98d8d8',
  bug: '#a8b820',
  dragon: '#7038f8',
  ghost: '#705898',
  rock: '#b8a038',
  ground: '#e0c068',
};

const RANGE_LABELS: Record<string, string> = {
  front_enemy: 'Front',
  back_enemy: 'Back',
  any_enemy: 'Any',
  front_row: 'Front Row',
  back_row: 'Back Row',
  any_row: 'Any Row',
  column: 'Column',
  all_enemies: 'All',
  self: 'Self',
};

const RARITY_COLORS: Record<CardRarity, string | null> = {
  basic: null,
  common: '#9ca3af',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

/** Build a static description (no combat modifiers). */
function buildDescription(card: MoveDefinition): React.ReactNode {
  const parts: React.ReactNode[] = [];

  for (const effect of card.effects) {
    switch (effect.type) {
      case 'damage':
        parts.push(<span key={parts.length}>Deal {effect.value} damage.</span>);
        break;
      case 'block':
        parts.push(<span key={parts.length}>Gain {effect.value} Block.</span>);
        break;
      case 'heal':
        parts.push(<span key={parts.length}>Heal {effect.value} HP.</span>);
        break;
      case 'apply_status':
        parts.push(<span key={parts.length}>Apply {effect.status} {effect.stacks}.</span>);
        break;
      case 'multi_hit': {
        const total = effect.value * effect.hits;
        parts.push(
          <span key={parts.length}>
            Hit {effect.hits}× for {effect.value} each ({total} total).
          </span>
        );
        break;
      }
      case 'heal_on_hit': {
        const healPct = Math.round(effect.healPercent * 100);
        parts.push(
          <span key={parts.length}>
            Deal {effect.value} damage. Heal {healPct}% dealt.
          </span>
        );
        break;
      }
      case 'recoil': {
        const recoilPct = Math.round(effect.recoilPercent * 100);
        parts.push(
          <span key={parts.length}>
            Deal {effect.value} damage. Take {recoilPct}% recoil.
          </span>
        );
        break;
      }
      case 'set_damage':
        parts.push(
          <span key={parts.length} style={{ color: '#fbbf24' }}>
            Deal {effect.value} fixed damage.
          </span>
        );
        break;
      case 'percent_hp': {
        const pct = Math.round(effect.percent * 100);
        const hpType = effect.ofMax ? 'max' : 'current';
        parts.push(
          <span key={parts.length} style={{ color: '#f87171' }}>
            Deal {pct}% of target's {hpType} HP.
          </span>
        );
        break;
      }
      case 'self_ko':
        parts.push(
          <span key={parts.length} style={{ color: '#ef4444' }}>
            Deal {effect.value} damage. <b>User faints.</b>
          </span>
        );
        break;
      case 'draw_cards':
        parts.push(
          <span key={parts.length} style={{ color: '#60a5fa' }}>
            Draw {effect.count} card{effect.count > 1 ? 's' : ''}.
          </span>
        );
        break;
      case 'gain_energy':
        parts.push(
          <span key={parts.length} style={{ color: '#fbbf24' }}>
            Gain {effect.amount} energy.
          </span>
        );
        break;
      case 'apply_status_self':
        parts.push(
          <span key={parts.length} style={{ color: '#4ade80' }}>
            Gain {effect.status} {effect.stacks}.
          </span>
        );
        break;
      case 'cleanse':
        parts.push(
          <span key={parts.length} style={{ color: '#67e8f9' }}>
            Cleanse {effect.count} debuff{effect.count > 1 ? 's' : ''}.
          </span>
        );
        break;
    }
  }

  return (
    <>
      {parts.map((p, i) => (
        <div key={i}>{p}</div>
      ))}
    </>
  );
}

export function CardPreview({ card, onClick, isSelected = false, showHoverEffect = true }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const primaryEffect = card.effects[0]?.type || 'damage';
  const effectColor = EFFECT_COLORS[primaryEffect] || '#888';
  const moveTypeColor = MOVE_TYPE_COLORS[card.type] || MOVE_TYPE_COLORS.normal;

  const isClickable = !!onClick;
  const showHoverGlow = showHoverEffect && isClickable && isHovered && !isSelected;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 140,
        minHeight: 180,
        background: isSelected ? '#3b3b5c' : '#1e1e2e',
        border: isSelected
          ? `2px solid ${effectColor}`
          : '2px solid #444',
        borderRadius: 8,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s',
        position: 'relative',
        boxShadow: showHoverGlow ? `0 0 16px 4px ${effectColor}66` : 'none',
        transform: isHovered && isClickable ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Cost badge */}
      <div style={{
        position: 'absolute',
        top: -8,
        right: -8,
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: '#60a5fa',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 'bold',
        border: '2px solid #1e1e2e',
      }}>
        {card.cost}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#e2e8f0',
        borderBottom: `2px solid ${moveTypeColor}`,
        paddingBottom: 4,
      }}>
        {card.name}
      </div>

      {/* Range indicator */}
      <div style={{
        fontSize: 11,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {RANGE_LABELS[card.range] || card.range}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: '#94a3b8',
        flex: 1,
        lineHeight: 1.4,
      }}>
        {buildDescription(card)}
      </div>

      {/* Vanish badge */}
      {card.vanish && (
        <div style={{
          fontSize: 11,
          color: '#f97316',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          VANISH
        </div>
      )}

      {/* Move type badge */}
      <div style={{
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '2px 6px',
        borderRadius: 4,
        background: moveTypeColor + '33',
        color: moveTypeColor,
        textTransform: 'uppercase',
      }}>
        {card.type}
      </div>

      {/* Rarity gem indicator */}
      {card.rarity && RARITY_COLORS[card.rarity] && (
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${RARITY_COLORS[card.rarity]}`,
          filter: card.rarity === 'legendary' ? 'drop-shadow(0 0 4px #fbbf24)' : 'none',
        }} />
      )}
    </div>
  );
}
