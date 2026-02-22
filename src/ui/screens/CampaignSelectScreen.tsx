import { CAMPAIGNS, getCampaign } from '../../data/campaigns';
import type { CampaignDefinition } from '../../data/campaigns';
import { THEME } from '../theme';
import { AmbientBackground } from '../components/AmbientBackground';
import { Flourish } from '../components/Flourish';

type CampaignStatus = 'locked' | 'available' | 'completed';

interface Props {
  onSelect: (campaignId: string) => void;
  onBack: () => void;
  getCampaignStatus: (id: string) => CampaignStatus;
}

export function CampaignSelectScreen({ onSelect, onBack, getCampaignStatus }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        padding: 32,
        minHeight: '100dvh',
        position: 'relative',
        color: THEME.text.primary,
      }}
    >
      <AmbientBackground />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 38,
            fontWeight: 'bold',
            color: THEME.accent,
            ...THEME.heading,
            letterSpacing: '0.18em',
            marginBottom: 10,
            textShadow: `0 0 32px rgba(250,204,21,0.35), 0 0 64px rgba(250,204,21,0.12)`,
          }}
        >
          SELECT CAMPAIGN
        </div>
        <Flourish variant="divider" width={240} color={THEME.text.tertiary} />
      </div>

      {/* Campaign cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          maxWidth: 520,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {CAMPAIGNS.map((campaign, i) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            status={getCampaignStatus(campaign.id)}
            onSelect={onSelect}
            animationDelay={i * 80}
          />
        ))}
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '10px 28px',
          fontSize: 13,
          fontWeight: 'bold',
          border: `1px solid ${THEME.border.subtle}`,
          borderRadius: 8,
          background: 'transparent',
          color: THEME.text.tertiary,
          cursor: 'pointer',
          letterSpacing: '0.08em',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = THEME.text.secondary;
          (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border.medium;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = THEME.text.tertiary;
          (e.currentTarget as HTMLButtonElement).style.borderColor = THEME.border.subtle;
        }}
      >
        Back
      </button>

      <style>{`
        @keyframes campaignCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Thin decorative corner lines ─────────────────────────────────────────────

function CornerAccents({ color }: { color: string }) {
  const size = 12;
  const thickness = 1.5;
  const corner = (top: number | string, right: number | string, bottom: number | string, left: number | string, borderTop: boolean, borderRight: boolean, borderBottom: boolean, borderLeft: boolean) => (
    <div
      style={{
        position: 'absolute',
        top, right, bottom, left,
        width: size,
        height: size,
        borderTop:    borderTop    ? `${thickness}px solid ${color}` : 'none',
        borderRight:  borderRight  ? `${thickness}px solid ${color}` : 'none',
        borderBottom: borderBottom ? `${thickness}px solid ${color}` : 'none',
        borderLeft:   borderLeft   ? `${thickness}px solid ${color}` : 'none',
        pointerEvents: 'none',
      }}
    />
  );
  return (
    <>
      {corner(6, 'auto', 'auto', 6, true, false, false, true)}
      {corner(6, 6, 'auto', 'auto', true, true, false, false)}
      {corner('auto', 'auto', 6, 6, false, false, true, true)}
      {corner('auto', 6, 6, 'auto', false, true, true, false)}
    </>
  );
}

// ── Campaign card ─────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  status,
  onSelect,
  animationDelay,
}: {
  campaign: CampaignDefinition;
  status: CampaignStatus;
  onSelect: (id: string) => void;
  animationDelay: number;
}) {
  const actCount = campaign.acts.length;
  const actLabel = actCount === 1 ? '1 Act' : `${actCount} Acts`;
  const isLocked    = status === 'locked';
  const isCompleted = status === 'completed';

  const prereqName = isLocked && campaign.unlockedBy
    ? getCampaign(campaign.unlockedBy).name
    : null;

  // Colour tokens that shift by status
  const accentColor   = isLocked ? THEME.border.subtle : isCompleted ? '#22c55e' : THEME.accent;
  const borderColor   = isLocked ? `${THEME.border.subtle}55` : isCompleted ? '#22c55e33' : `${THEME.border.medium}88`;
  const hoverBorder   = isLocked ? borderColor : isCompleted ? '#22c55e77' : `${THEME.accent}88`;
  const hoverBg       = `${THEME.bg.panel}cc`;

  return (
    <button
      onClick={() => !isLocked && onSelect(campaign.id)}
      disabled={isLocked}
      style={{
        background: `${THEME.bg.elevated}ee`,
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        padding: '22px 28px',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        color: THEME.text.primary,
        opacity: isLocked ? 0.5 : 1,
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
        animation: `campaignCardIn 0.35s ease-out ${animationDelay}ms both`,
        boxShadow: isLocked ? 'none' : `0 2px 20px rgba(0,0,0,0.3)`,
      }}
      onMouseEnter={(e) => {
        if (isLocked) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = hoverBorder;
        el.style.background  = hoverBg;
        el.style.boxShadow   = `0 4px 28px rgba(0,0,0,0.4), inset 0 0 0 1px ${accentColor}18`;
      }}
      onMouseLeave={(e) => {
        if (isLocked) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = borderColor;
        el.style.background  = `${THEME.bg.elevated}ee`;
        el.style.boxShadow   = `0 2px 20px rgba(0,0,0,0.3)`;
      }}
    >
      {/* Subtle gradient sheen across the top */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${accentColor}0a 0%, transparent 50%)`,
          pointerEvents: 'none',
          borderRadius: 13,
        }}
      />

      {/* Corner accents */}
      <CornerAccents color={`${accentColor}66`} />

      {/* ── Title row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
          position: 'relative',
        }}
      >
        {/* Lock icon inline with title */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: isLocked ? THEME.text.secondary : THEME.text.primary,
            ...THEME.heading,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isLocked && (
            <span style={{ fontSize: 14, opacity: 0.7, marginRight: 2 }}>🔒</span>
          )}
          {campaign.name}
        </span>

        {/* Acts count — always right-aligned */}
        <span
          style={{
            fontSize: 11,
            color: THEME.text.tertiary,
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {actLabel}
        </span>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(to right, ${accentColor}44, transparent)`,
          marginBottom: 10,
          marginTop: 2,
        }}
      />

      {/* ── Subtitle row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: isLocked ? 0 : 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: isLocked ? THEME.text.tertiary : accentColor,
            letterSpacing: '0.07em',
            fontWeight: 'bold',
            fontStyle: isLocked ? 'italic' : 'normal',
            opacity: isLocked ? 0.8 : 1,
          }}
        >
          {isLocked && prereqName
            ? `Complete ${prereqName} to unlock`
            : campaign.subtitle}
        </span>

        {/* Completed badge — inline with subtitle */}
        {isCompleted && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#22c55e',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: '2px 8px',
              border: '1px solid #22c55e55',
              borderRadius: 4,
            }}
          >
            ✓ COMPLETED
          </span>
        )}
      </div>

      {/* ── Description ── */}
      {!isLocked && (
        <div
          style={{
            fontSize: 13,
            color: THEME.text.secondary,
            lineHeight: 1.6,
            position: 'relative',
          }}
        >
          {campaign.description}
        </div>
      )}
    </button>
  );
}
