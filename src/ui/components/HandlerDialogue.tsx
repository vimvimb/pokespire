/**
 * HandlerDialogue — walkie-talkie comms style dialogue for the tutorial prologue.
 *
 * Displays handler messages at the top of the screen with a walkie-talkie icon,
 * matching the blue (TEAL) color scheme of the in-battle tutorial tooltips.
 */

import { THEME } from "../theme";

const TEAL = "#38bdf8";

interface Props {
  /** The handler's current message */
  text: string;
  /** Called when the player clicks to advance */
  onAdvance: () => void;
  /** Label for the advance button (default: "Continue") */
  buttonLabel?: string;
}

/** Walkie-talkie SVG icon — matches the held-items design language. */
function WalkieTalkieIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Antenna */}
      <rect x="29" y="4" width="3" height="14" rx="1.5" fill={TEAL} opacity={0.35} stroke={TEAL} strokeWidth="0.8" />
      <circle cx="30.5" cy="4" r="2.5" fill={TEAL} opacity={0.5} stroke={TEAL} strokeWidth="0.8" />

      {/* Body */}
      <rect x="18" y="17" width="25" height="38" rx="4" fill={TEAL} opacity={0.1} stroke={TEAL} strokeWidth="1.2" />

      {/* Speaker grille */}
      <line x1="24" y1="25" x2="37" y2="25" stroke={TEAL} strokeWidth="0.8" opacity={0.4} />
      <line x1="24" y1="28" x2="37" y2="28" stroke={TEAL} strokeWidth="0.8" opacity={0.4} />
      <line x1="24" y1="31" x2="37" y2="31" stroke={TEAL} strokeWidth="0.8" opacity={0.4} />
      <line x1="24" y1="34" x2="37" y2="34" stroke={TEAL} strokeWidth="0.8" opacity={0.3} />

      {/* Channel dial */}
      <circle cx="30.5" cy="42" r="4" stroke={TEAL} strokeWidth="1" fill={TEAL} opacity={0.12} />
      <line x1="30.5" y1="39" x2="30.5" y2="42" stroke={TEAL} strokeWidth="1" opacity={0.5} />

      {/* LED indicator — active */}
      <circle cx="37" cy="49" r="2" fill={TEAL} opacity={0.7} />
      <circle cx="37" cy="49" r="3.5" stroke={TEAL} strokeWidth="0.5" fill="none" opacity={0.3} />

      {/* Side button */}
      <rect x="43" y="24" width="4" height="10" rx="1.5" fill={TEAL} opacity={0.15} stroke={TEAL} strokeWidth="0.8" />

      {/* Signal waves */}
      <path d="M50 14 Q54 18 50 22" stroke={TEAL} strokeWidth="0.8" fill="none" opacity={0.3} />
      <path d="M53 11 Q59 18 53 25" stroke={TEAL} strokeWidth="0.6" fill="none" opacity={0.2} />

      {/* Sparkle */}
      <path d="M12 22 L13.5 20 L15 22 L13.5 24 Z" stroke={TEAL} strokeWidth="0.5" fill="none" opacity={0.35} />
    </svg>
  );
}

export function HandlerDialogue({ text, onAdvance, buttonLabel = "Continue" }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 48,
        pointerEvents: "none",
      }}
    >
      {/* Dialogue box */}
      <div
        style={{
          width: "min(460px, 90vw)",
          padding: "16px 20px",
          background: `${THEME.bg.panelDark}e6`,
          border: `1.5px solid ${TEAL}`,
          borderRadius: 10,
          boxShadow: `0 0 12px rgba(56,189,248,0.4), 0 0 24px rgba(56,189,248,0.15)`,
          pointerEvents: "auto",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: TEAL,
              boxShadow: `0 0 6px ${TEAL}`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: "bold",
              color: TEAL,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Handler
          </span>
        </div>

        {/* Message */}
        <p
          style={{
            margin: "0 0 14px 0",
            color: THEME.text.primary,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {text}
        </p>

        {/* Advance button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onAdvance}
            style={{
              padding: "6px 18px",
              fontSize: 13,
              fontWeight: "bold",
              border: `1px solid ${TEAL}`,
              borderRadius: 6,
              background: "transparent",
              color: TEAL,
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {/* Walkie-talkie icon — centered below dialogue */}
      <div style={{ marginTop: 32 }}>
        <WalkieTalkieIcon size={200} />
      </div>
    </div>
  );
}
