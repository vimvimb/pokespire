import type { Combatant, MoveDefinition } from '../../engine/types';
import type { EnemyIntent, IntentDamagePreview } from '../../engine/intentPreview';
import { getMove } from '../../data/loaders';
import { MOVE_TYPE_COLORS } from './CardDisplay';
import { CardTypeMotif } from './CardTypeMotif';
import { getSpriteUrl } from '../utils/sprites';
import { THEME } from '../theme';

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
  any_ally: 'Any Ally',
};

interface Props {
  intent: EnemyIntent;
  target: Combatant;
  damagePreview?: IntentDamagePreview;
}

function buildEffectDescription(
  card: MoveDefinition,
  damagePreview?: IntentDamagePreview,
): React.ReactNode {
  const parts: React.ReactNode[] = [];

  for (const effect of card.effects) {
    switch (effect.type) {
      case 'damage':
      case 'recoil':
      case 'heal_on_hit':
      case 'self_ko': {
        if (damagePreview) {
          const color = damagePreview.typeEffectiveness > 1
            ? '#4ade80'
            : damagePreview.typeEffectiveness < 1
              ? '#888'
              : '#ef4444';
          parts.push(
            <span key={parts.length} style={{ color, fontWeight: 700 }}>
              -{damagePreview.totalDamage}
            </span>
          );
          if (damagePreview.blockedAmount > 0) {
            parts.push(
              <span key={parts.length} style={{ fontSize: 9, color: '#60a5fa', marginLeft: 2 }}>
                ({damagePreview.blockedAmount} blocked)
              </span>
            );
          }
        } else {
          parts.push(
            <span key={parts.length} style={{ color: '#ef4444' }}>
              Deal {effect.value} dmg
            </span>
          );
        }
        if (effect.type === 'recoil') {
          parts.push(
            <span key={parts.length} style={{ fontSize: 9, color: '#f97316' }}>
              {' '}({Math.round(effect.recoilPercent * 100)}% recoil)
            </span>
          );
        }
        break;
      }
      case 'multi_hit': {
        if (damagePreview) {
          const color = damagePreview.typeEffectiveness > 1
            ? '#4ade80'
            : damagePreview.typeEffectiveness < 1
              ? '#888'
              : '#ef4444';
          parts.push(
            <span key={parts.length} style={{ color, fontWeight: 700 }}>
              {damagePreview.hits}x {damagePreview.finalDamage} = -{damagePreview.totalDamage}
            </span>
          );
        } else {
          parts.push(
            <span key={parts.length} style={{ color: '#ef4444' }}>
              {effect.hits}x {effect.value} dmg
            </span>
          );
        }
        break;
      }
      case 'block':
        parts.push(
          <span key={parts.length} style={{ color: '#60a5fa' }}>
            Block {effect.value}
          </span>
        );
        break;
      case 'heal':
        parts.push(
          <span key={parts.length} style={{ color: '#4ade80' }}>
            Heal {effect.value}
          </span>
        );
        break;
      case 'heal_percent':
        parts.push(
          <span key={parts.length} style={{ color: '#4ade80' }}>
            Heal {Math.round(effect.percent * 100)}%
          </span>
        );
        break;
      case 'apply_status':
        parts.push(
          <span key={parts.length} style={{ color: '#a855f7' }}>
            {effect.status} {effect.stacks}
          </span>
        );
        break;
      case 'apply_status_self':
        parts.push(
          <span key={parts.length} style={{ color: '#4ade80' }}>
            +{effect.status} {effect.stacks}
          </span>
        );
        break;
      case 'draw_cards':
        parts.push(
          <span key={parts.length} style={{ color: '#60a5fa' }}>
            Draw {effect.count}
          </span>
        );
        break;
      case 'gain_energy':
        parts.push(
          <span key={parts.length} style={{ color: '#fbbf24' }}>
            +{effect.amount} energy
          </span>
        );
        break;
      case 'set_damage':
        parts.push(
          <span key={parts.length} style={{ color: '#fbbf24' }}>
            {effect.value} fixed dmg
          </span>
        );
        break;
      case 'percent_hp':
        parts.push(
          <span key={parts.length} style={{ color: '#f87171' }}>
            {Math.round(effect.percent * 100)}% HP
          </span>
        );
        break;
      case 'cleanse':
        parts.push(
          <span key={parts.length} style={{ color: '#67e8f9' }}>
            Cleanse {effect.count}
          </span>
        );
        break;
    }
  }

  return parts.map((p, i) => (
    <div key={i} style={{ lineHeight: 1.3 }}>{p}</div>
  ));
}

export function IntentCardPreview({ intent, target, damagePreview }: Props) {
  const card = getMove(intent.cardId);
  const typeColor = MOVE_TYPE_COLORS[intent.moveType] || MOVE_TYPE_COLORS.normal;
  const wouldKO = intent.wouldKO[target.id] ?? false;

  return (
    <div style={{
      width: 120,
      background: `linear-gradient(to bottom, ${typeColor}14, ${THEME.bg.panel})`,
      border: `1px solid ${THEME.border.medium}`,
      borderRadius: 6,
      padding: 6,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      position: 'relative',
      boxShadow: `inset 0 0 6px ${typeColor}20, 0 4px 12px rgba(0,0,0,0.6)`,
    }}>
      {/* Cost diamond badge — top right */}
      <div style={{
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'absolute' }}>
          <path d="M12 2 L21 12 L12 22 L3 12 Z" fill={THEME.bg.panelDark} stroke="#5b8cc9" strokeWidth="1" />
          <path d="M12 4.5 L19 12 L12 19.5 L5 12 Z" fill="rgba(96, 165, 250, 0.12)" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="0.6" />
        </svg>
        <span style={{
          position: 'relative',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#a0c4f0',
          textShadow: '0 0 4px rgba(96, 165, 250, 0.5)',
        }}>
          {intent.cardCost}
        </span>
      </div>

      {/* Type motif band */}
      <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
        <CardTypeMotif type={intent.moveType} color={typeColor} width={100} height={24} />
      </div>

      {/* Card name */}
      <div style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.text.primary,
        textAlign: 'center',
        lineHeight: 1.15,
      }}>
        {card.name}
      </div>

      {/* Range label with flanking lines */}
      <div style={{
        fontSize: 8,
        color: THEME.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center',
      }}>
        <span style={{ flex: 1, height: 1, background: THEME.border.subtle, maxWidth: 14 }} />
        {RANGE_LABELS[card.range] || card.range}
        <span style={{ flex: 1, height: 1, background: THEME.border.subtle, maxWidth: 14 }} />
      </div>

      {/* Effect description */}
      <div style={{ fontSize: 11, color: THEME.text.secondary, textAlign: 'center' }}>
        {buildEffectDescription(card, damagePreview)}
      </div>

      {/* Effectiveness label */}
      {damagePreview?.effectivenessLabel && (
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          textAlign: 'center',
          color: damagePreview.typeEffectiveness > 1 ? '#4ade80' : '#888',
        }}>
          {damagePreview.effectivenessLabel}
        </div>
      )}

      {/* Target indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 2,
        padding: '2px 0',
        borderTop: `1px solid ${THEME.border.subtle}`,
      }}>
        <div style={{ position: 'relative', width: 20, height: 20 }}>
          <img
            src={getSpriteUrl(target.pokemonId, 'back')}
            alt={target.name}
            style={{
              width: 20,
              height: 20,
              imageRendering: 'pixelated',
              objectFit: 'contain',
              opacity: wouldKO ? 0.35 : 1,
            }}
          />
          {wouldKO && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: '#ff4444',
              textShadow: '0 0 2px #000, 0 0 2px #000',
            }}>
              KO
            </span>
          )}
        </div>
        <span style={{
          fontSize: 10,
          color: THEME.text.secondary,
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {target.name}
        </span>
      </div>
    </div>
  );
}
