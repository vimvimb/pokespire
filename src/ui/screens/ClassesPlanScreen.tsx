import { ScreenShell } from '../components/ScreenShell';
import { ClassIcon } from '../components/ClassIcon';
import { CLASS_DEFS, CATEGORY_META, type ClassCategory } from '../../data/classes';
import { THEME } from '../theme';

interface Props {
  onBack: () => void;
}

const CATEGORY_ORDER: ClassCategory[] = ['defensive', 'offensive', 'support', 'specialist'];

export function ClassesPlanScreen({ onBack }: Props) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    ...CATEGORY_META[cat],
    classes: CLASS_DEFS.filter((c) => c.category === cat),
  }));

  return (
    <ScreenShell
      ambient
      header={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderBottom: `1px solid ${THEME.border.subtle}`,
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              ...THEME.button.secondary,
              fontSize: 13,
            }}
          >
            Back
          </button>
          <span
            style={{
              color: THEME.text.primary,
              fontWeight: 'bold',
              fontSize: 16,
              letterSpacing: '0.08em',
            }}
          >
            Classes Plan
          </span>
          <div style={{ width: 60 }} />
        </div>
      }
      bodyStyle={{ padding: '24px 16px 64px' }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Intro blurb */}
        <p
          style={{
            color: THEME.text.tertiary,
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          Each Pokemon equips one class that defines their role on the grid.
          Classes determine switches per turn and grant positional bonuses.
        </p>

        {grouped.map(({ category, label, color, classes }) => (
          <div key={category} style={{ marginBottom: 32 }}>
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: color,
                }}
              />
              <span
                style={{
                  color,
                  fontSize: 14,
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: color + '33',
                  marginLeft: 4,
                }}
              />
            </div>

            {/* Class cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} color={color} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

function ClassCard({
  cls,
  color,
}: {
  cls: (typeof CLASS_DEFS)[number];
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 16px',
        background: THEME.bg.elevated,
        border: `1px solid ${THEME.border.subtle}`,
        borderRadius: 10,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          paddingTop: 2,
        }}
      >
        <ClassIcon classId={cls.id} color={color} size={44} />
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + metadata row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              color: THEME.text.primary,
              fontWeight: 'bold',
              fontSize: 15,
              letterSpacing: '0.04em',
            }}
          >
            {cls.name}
          </span>
          {cls.switchesPerTurn !== 1 && (
            <span
              style={{
                fontSize: 11,
                color: THEME.accent,
                border: `1px solid ${THEME.accent}44`,
                borderRadius: 4,
                padding: '1px 6px',
                letterSpacing: '0.04em',
              }}
            >
              {cls.switchesPerTurn} switches/turn
            </span>
          )}
        </div>

        {/* Condition */}
        <div
          style={{
            color: color,
            fontSize: 12,
            fontStyle: 'italic',
            marginBottom: 6,
            opacity: 0.85,
          }}
        >
          {cls.condition}
        </div>

        {/* Effect */}
        <div
          style={{
            color: THEME.text.secondary,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {cls.effect}
        </div>
      </div>
    </div>
  );
}
