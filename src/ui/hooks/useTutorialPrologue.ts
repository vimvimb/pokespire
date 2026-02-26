/**
 * useTutorialPrologue — state machine for the multi-node tutorial prologue.
 *
 * Manages progression: spawn → node1 → node2 → node3 → node4 → complete.
 * Spawn and completion show handler dialogue on a dark screen.
 * Battle nodes go straight into combat with in-battle tooltip steps
 * driven by TutorialOverlay (the same system the starter tutorial uses).
 */

import { useState, useCallback, useMemo } from "react";
import type { PrologueNodeId, PrologueDialogueLine } from "../../data/tutorialPrologue";
import {
  SPAWN_DIALOGUE,
  COMPLETION_DIALOGUE,
  PROLOGUE_NODES,
} from "../../data/tutorialPrologue";
import type {
  TutorialHighlightTarget,
  TutorialZone,
  TutorialAdvanceCondition,
} from "../../data/tutorial";
import { getMove } from "../../data/loaders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProloguePhase =
  | "dialogue"   // Showing handler dialogue (spawn, post-victory, completion)
  | "battle"     // Battle in progress (tooltips driven by battleSteps)
  | "complete";  // Prologue finished

/** Shape matching BattleScreen's `tutorial` prop. */
export interface PrologueTutorialConfig {
  isActive: boolean;
  highlightTarget: TutorialHighlightTarget;
  stepText: string;
  advance: () => void;
  skip: () => void;
  canSkip: boolean;
  allowInteraction: boolean;
  zone: TutorialZone;
}

export interface UseTutorialPrologueResult {
  /** Current node ID */
  nodeId: PrologueNodeId;
  /** Current phase within the node */
  phase: ProloguePhase;
  /** Current dialogue line (if in dialogue phase) */
  currentDialogue: PrologueDialogueLine | null;
  /** Whether the prologue is active (not yet complete) */
  isActive: boolean;
  /** Advance dialogue to next line, or transition to battle/next node */
  advanceDialogue: () => void;
  /** Called when a battle ends with victory — shows post-victory dialogue then advances */
  onBattleVictory: () => void;
  /** Called when a battle ends with defeat — restart current node */
  onBattleDefeat: () => void;
  /** Reset to the beginning */
  reset: () => void;
  /** Tutorial overlay config for the current battle (undefined when no tooltip active) */
  tutorialConfig: PrologueTutorialConfig | undefined;
  /** Notify: player played a card */
  notifyCardPlayed: (moveId: string) => void;
  /** Notify: player ended turn */
  notifyTurnEnded: () => void;
  /** Notify: enemy turn completed */
  notifyEnemyTurnDone: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NODE_ORDER: PrologueNodeId[] = ["spawn", "node1", "node2", "node3", "node4", "complete"];

function getNextNodeId(current: PrologueNodeId): PrologueNodeId {
  const idx = NODE_ORDER.indexOf(current);
  if (idx < 0 || idx >= NODE_ORDER.length - 1) return "complete";
  return NODE_ORDER[idx + 1];
}

/** Get the post-victory dialogue for a node. */
function getPostVictoryText(nodeId: PrologueNodeId): string | null {
  const node = PROLOGUE_NODES.find((n) => n.id === nodeId);
  return node?.postVictoryDialogue ?? null;
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTutorialPrologue(): UseTutorialPrologueResult {
  const [nodeId, setNodeId] = useState<PrologueNodeId>("spawn");
  const [phase, setPhase] = useState<ProloguePhase>("dialogue");
  const [dialogueLines, setDialogueLines] = useState<PrologueDialogueLine[]>(SPAWN_DIALOGUE);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [battleStepIndex, setBattleStepIndex] = useState(0);

  const currentDialogue =
    phase === "dialogue" && dialogueIndex < dialogueLines.length
      ? dialogueLines[dialogueIndex]
      : null;

  const isActive = nodeId !== "complete" || phase === "dialogue";

  // -------------------------------------------------------------------------
  // Battle step tracking
  // -------------------------------------------------------------------------

  const currentNodeDef = useMemo(
    () => PROLOGUE_NODES.find((n) => n.id === nodeId) ?? null,
    [nodeId],
  );

  const currentBattleStep = useMemo(() => {
    if (phase !== "battle" || !currentNodeDef) return null;
    const steps = currentNodeDef.battleSteps;
    if (battleStepIndex >= steps.length) return null;
    return steps[battleStepIndex];
  }, [phase, currentNodeDef, battleStepIndex]);

  const advanceBattleStep = useCallback(() => {
    setBattleStepIndex((prev) => prev + 1);
  }, []);

  const tryAdvanceForCondition = useCallback(
    (condition: TutorialAdvanceCondition, moveId?: string): boolean => {
      if (!currentBattleStep) return false;
      if (currentBattleStep.advanceCondition !== condition) return false;

      if (condition === "play_attack" && moveId && !isAttackMove(moveId)) return false;
      if (condition === "play_defend" && moveId && !isDefendMove(moveId)) return false;
      if (condition === "play_any_card" && !moveId) return false;

      advanceBattleStep();
      return true;
    },
    [currentBattleStep, advanceBattleStep],
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

  // Build the tutorial config object for BattleScreen
  const tutorialConfig: PrologueTutorialConfig | undefined = useMemo(() => {
    if (!currentBattleStep) return undefined;
    return {
      isActive: true,
      highlightTarget: currentBattleStep.highlight,
      stepText: currentBattleStep.text(""),
      advance: advanceBattleStep,
      skip: advanceBattleStep,
      canSkip: currentBattleStep.allowSkip ?? false,
      allowInteraction: currentBattleStep.allowInteraction ?? false,
      zone: currentBattleStep.zone,
    };
  }, [currentBattleStep, advanceBattleStep]);

  // -------------------------------------------------------------------------
  // Dialogue & phase transitions
  // -------------------------------------------------------------------------

  const advanceDialogue = useCallback(() => {
    if (phase !== "dialogue") return;

    const nextIdx = dialogueIndex + 1;
    if (nextIdx < dialogueLines.length) {
      setDialogueIndex(nextIdx);
      return;
    }

    // Dialogue exhausted — what comes next?
    if (nodeId === "spawn") {
      // After spawn dialogue, go straight to node1 battle
      setNodeId("node1");
      setBattleStepIndex(0);
      setPhase("battle");
      return;
    }

    if (nodeId === "complete") {
      setPhase("complete");
      return;
    }

    // After post-victory dialogue for a battle node → start next battle
    setBattleStepIndex(0);
    setPhase("battle");
  }, [phase, dialogueIndex, dialogueLines, nodeId]);

  const onBattleVictory = useCallback(() => {
    const postText = getPostVictoryText(nodeId);
    const nextNode = getNextNodeId(nodeId);

    if (postText) {
      const postLine: PrologueDialogueLine = {
        id: `${nodeId}-victory`,
        text: postText,
      };
      // For "complete" node, append completion dialogue
      const nextLines = nextNode === "complete" ? COMPLETION_DIALOGUE : [];
      setDialogueLines([postLine, ...nextLines]);
      setDialogueIndex(0);
      setNodeId(nextNode);
      setPhase("dialogue");
    } else {
      // No post-victory line — go straight to next node's battle
      setNodeId(nextNode);
      if (nextNode === "complete") {
        setDialogueLines(COMPLETION_DIALOGUE);
        setDialogueIndex(0);
        setPhase(COMPLETION_DIALOGUE.length > 0 ? "dialogue" : "complete");
      } else {
        setBattleStepIndex(0);
        setPhase("battle");
      }
    }
  }, [nodeId]);

  const onBattleDefeat = useCallback(() => {
    // Show a brief retry message, then re-enter battle
    const retryLine: PrologueDialogueLine = {
      id: `${nodeId}-retry`,
      text: "Get back up. Try again.",
    };
    setDialogueLines([retryLine]);
    setDialogueIndex(0);
    setBattleStepIndex(0);
    setPhase("dialogue");
  }, [nodeId]);

  const reset = useCallback(() => {
    setNodeId("spawn");
    setPhase("dialogue");
    setDialogueLines(SPAWN_DIALOGUE);
    setDialogueIndex(0);
    setBattleStepIndex(0);
  }, []);

  return {
    nodeId,
    phase,
    currentDialogue,
    isActive,
    advanceDialogue,
    onBattleVictory,
    onBattleDefeat,
    reset,
    tutorialConfig,
    notifyCardPlayed,
    notifyTurnEnded,
    notifyEnemyTurnDone,
  };
}
