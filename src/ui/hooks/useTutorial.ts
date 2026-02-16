import { useState, useCallback } from "react";
import {
  TUTORIAL_STEPS,
  type TutorialStep,
  type TutorialAdvanceCondition,
  type TutorialHighlightTarget,
} from "../../data/tutorial";
import { getMove } from "../../data/loaders";

export interface UseTutorialOptions {
  starterName: string;
  onComplete: () => void;
}

export interface UseTutorialResult {
  /** Current step index (0-based) or null if tutorial is done. */
  currentStepIndex: number | null;
  /** Current step definition, or null if tutorial is done. */
  currentStep: TutorialStep | null;
  /** Highlight target for the overlay (maps to data-tutorial-id). */
  highlightTarget: TutorialHighlightTarget;
  /** Text for the current step (with starter name interpolated). */
  stepText: string;
  /** Whether the overlay should show (tutorial active and not finished). */
  isActive: boolean;
  /** Whether current step shows "Skip" button. */
  canSkip: boolean;
  /** Whether current step allows interaction with the highlighted area. */
  allowInteraction: boolean;
  /** Advance to next step (for manual steps). */
  advance: () => void;
  /** Skip current step (for steps with allowSkip). */
  skip: () => void;
  /** Call when player plays a card — may advance tutorial. */
  notifyCardPlayed: (moveId: string) => void;
  /** Call when player ends turn — may advance tutorial. */
  notifyTurnEnded: () => void;
  /** Call when enemy turn completes — may advance tutorial. */
  notifyEnemyTurnDone: () => void;
}

function isAttackMove(moveId: string): boolean {
  try {
    const move = getMove(moveId.replace(/__parental$/, ""));
    return move.effects.some(
      (e) =>
        e.type === "damage" ||
        e.type === "multi_hit" ||
        e.type === "recoil" ||
        e.type === "self_ko" ||
        e.type === "heal_on_hit",
    );
  } catch {
    return false;
  }
}

function isDefendMove(moveId: string): boolean {
  return moveId === "defend" || moveId.replace(/__parental$/, "") === "defend";
}

export function useTutorial({
  starterName,
  onComplete,
}: UseTutorialOptions): UseTutorialResult {
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep: TutorialStep | null =
    stepIndex < TUTORIAL_STEPS.length ? TUTORIAL_STEPS[stepIndex]! : null;

  const advance = useCallback(() => {
    const next = stepIndex + 1;
    setStepIndex(next);
    if (next >= TUTORIAL_STEPS.length) {
      onComplete();
    }
  }, [stepIndex, onComplete]);

  const skip = useCallback(() => {
    advance();
  }, [advance]);

  const tryAdvanceForCondition = useCallback(
    (condition: TutorialAdvanceCondition, moveId?: string): boolean => {
      if (!currentStep) return false;
      if (currentStep.advanceCondition !== condition) return false;

      if (condition === "play_attack" && moveId && !isAttackMove(moveId)) {
        return false;
      }
      if (condition === "play_defend" && moveId && !isDefendMove(moveId)) {
        return false;
      }
      if (condition === "play_any_card" && !moveId) {
        return false;
      }

      advance();
      return true;
    },
    [currentStep, advance],
  );

  const notifyCardPlayed = useCallback(
    (moveId: string) => {
      tryAdvanceForCondition("play_attack", moveId) ||
        tryAdvanceForCondition("play_defend", moveId) ||
        tryAdvanceForCondition("play_any_card", moveId);
    },
    [tryAdvanceForCondition],
  );

  const notifyTurnEnded = useCallback(() => {
    tryAdvanceForCondition("end_turn");
  }, [tryAdvanceForCondition]);

  const notifyEnemyTurnDone = useCallback(() => {
    tryAdvanceForCondition("enemy_turn_done");
  }, [tryAdvanceForCondition]);

  const isActive = currentStep !== null;
  const highlightTarget = currentStep?.highlight ?? null;
  const stepText = currentStep ? currentStep.text(starterName) : "";
  const canSkip = currentStep?.allowSkip ?? false;
  const allowInteraction = currentStep?.allowInteraction ?? false;

  return {
    currentStepIndex: currentStep ? stepIndex : null,
    currentStep,
    highlightTarget,
    stepText,
    isActive,
    canSkip,
    allowInteraction,
    advance,
    skip,
    notifyCardPlayed,
    notifyTurnEnded,
    notifyEnemyTurnDone,
  };
}
