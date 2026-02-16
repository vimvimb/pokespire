import { useEffect, useState, useRef } from "react";
import type { TutorialHighlightTarget, TutorialZone } from "../../data/tutorial";
import { THEME } from "../theme";

const TEAL = "#38bdf8";
const HUD_PANEL_WIDTH = 260;

interface Props {
  highlightTarget: TutorialHighlightTarget;
  stepText: string;
  onGotIt: () => void;
  onSkip?: () => void;
  allowInteraction: boolean;
  canSkip: boolean;
  zone: TutorialZone;
}

function getTutorialIdForTarget(target: TutorialHighlightTarget): string | null {
  if (!target) return null;
  if (target === "attack_cards") return "tutorial-card-attack";
  if (target === "defend_cards") return "tutorial-card-defend";
  return target;
}

/** Compute L-shaped path from HUD panel to target. Returns [start, corner, end] or null if overlapping. */
function computeLPath(
  hudRect: DOMRect,
  targetRect: DOMRect,
): [[number, number], [number, number], [number, number]] | null {
  const hudCx = hudRect.left + hudRect.width / 2;
  const hudCy = hudRect.top + hudRect.height / 2;
  const targetCx = targetRect.left + targetRect.width / 2;
  const targetCy = targetRect.top + targetRect.height / 2;

  // Choose which edge of HUD to start from (nearest to target)
  const targetRight = targetRect.left + targetRect.width;
  const targetBottom = targetRect.top + targetRect.height;
  const hudRight = hudRect.left + hudRect.width;
  const hudBottom = hudRect.top + hudRect.height;

  // Target is mostly to the right of HUD → start from right edge, go horizontal then vertical
  if (targetRect.left > hudRight) {
    const start: [number, number] = [hudRight, hudCy];
    const corner: [number, number] = [targetRect.left, hudCy];
    const end: [number, number] = [targetRect.left, targetCy];
    return [start, corner, end];
  }

  // Target is mostly below HUD → start from bottom edge, go vertical then horizontal
  if (targetRect.top > hudBottom) {
    const start: [number, number] = [hudCx, hudBottom];
    const corner: [number, number] = [hudCx, targetRect.top];
    const end: [number, number] = [targetCx, targetRect.top];
    return [start, corner, end];
  }

  // Target is mostly to the left of HUD → start from left edge
  if (targetRight < hudRect.left) {
    const start: [number, number] = [hudRect.left, hudCy];
    const corner: [number, number] = [targetRight, hudCy];
    const end: [number, number] = [targetRight, targetCy];
    return [start, corner, end];
  }

  // Target is mostly above HUD → start from top edge
  if (targetBottom < hudRect.top) {
    const start: [number, number] = [hudCx, hudRect.top];
    const corner: [number, number] = [hudCx, targetBottom];
    const end: [number, number] = [targetCx, targetBottom];
    return [start, corner, end];
  }

  // Overlap or very close: no connector needed
  return null;
}

export function TutorialOverlay({
  highlightTarget,
  stepText,
  onGotIt,
  onSkip,
  allowInteraction,
  canSkip,
  zone,
}: Props) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [hudRect, setHudRect] = useState<DOMRect | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const tutorialId = getTutorialIdForTarget(highlightTarget);

  useEffect(() => {
    if (!tutorialId) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const el = document.querySelector(`[data-tutorial-id="${tutorialId}"]`);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();
    const observer = new ResizeObserver(updateTargetRect);
    const el = document.querySelector(`[data-tutorial-id="${tutorialId}"]`);
    if (el) observer.observe(el);

    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [tutorialId]);

  useEffect(() => {
    const updateHudRect = () => {
      if (hudRef.current) {
        setHudRect(hudRef.current.getBoundingClientRect());
      }
    };
    const timer = setTimeout(updateHudRect, 0);
    const observer = new ResizeObserver(updateHudRect);
    if (hudRef.current) observer.observe(hudRef.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [stepText, highlightTarget]);

  const showConnector = targetRect && hudRect && highlightTarget;
  const path =
    showConnector && hudRect && targetRect
      ? computeLPath(hudRect, targetRect)
      : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {/* L-shaped connector arrow (behind HUD panel) */}
      {path && (
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <polyline
            points={path.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={TEAL}
            strokeWidth={2}
          />
          <circle
            cx={path[path.length - 1][0]}
            cy={path[path.length - 1][1]}
            r={5}
            fill={TEAL}
          />
        </svg>
      )}

      {/* HUD panel — pointerEvents: auto so it stays clickable */}
      <div
        ref={hudRef}
        style={{
          position: "fixed",
          width: HUD_PANEL_WIDTH,
          ...(zone === "top"
            ? {
                top: 100,
                left: "50%",
                transform: "translate(-50%, 0)",
              }
            : {
                bottom: 165,
                right: 80,
              }),
          padding: 16,
          background: `${THEME.bg.panelDark}e6`,
          border: `1.5px solid ${TEAL}`,
          borderRadius: 10,
          boxShadow: `0 0 12px rgba(56,189,248,0.4), 0 0 24px rgba(56,189,248,0.15)`,
          zIndex: 1001,
          pointerEvents: "auto",
        }}
      >
        <p
          style={{
            margin: "0 0 12px 0",
            color: THEME.text.primary,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {stepText}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {canSkip && (
            <button
              onClick={onSkip}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: "bold",
                border: `1px solid ${THEME.border.medium}`,
                borderRadius: 6,
                background: THEME.bg.elevated,
                color: THEME.text.secondary,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
          )}
          {!allowInteraction && (
            <button
              onClick={onGotIt}
              style={{
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: "bold",
                border: "none",
                borderRadius: 6,
                background: THEME.accent,
                color: THEME.bg.base,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
