/**
 * Tutorial type definitions used by the prologue tutorial system.
 * Pure data — no React.
 */

export type TutorialAdvanceCondition =
  | "manual"           // Click "Got it"
  | "play_attack"      // Player plays any attack (damage) card
  | "play_any_card"    // Player plays any card
  | "play_defend"      // Player plays Defend card (or Skip)
  | "end_turn"         // Player clicks End Turn
  | "enemy_turn_done"; // Enemy turn completes

export type TutorialHighlightTarget =
  | "battlefield"      // Player + enemy sprites
  | "hand"
  | "energy"
  | "attack_cards"     // Attack cards in hand
  | "defend_cards"     // Defend cards in hand
  | "end_turn"
  | "turn_order"
  | "intents"          // Enemy intent chips (first enemy with intents)
  | "switch_button"    // Switch position button
  | null;              // No highlight (toast / info)

export type TutorialZone = "top" | "bottom";

export interface TutorialStep {
  id: number;
  highlight: TutorialHighlightTarget;
  text: (starterName: string) => string;
  advanceCondition: TutorialAdvanceCondition;
  /** Where to place the HUD: "top" = upper-middle, "bottom" = lower-right */
  zone: TutorialZone;
  /** If true, show "Skip" button in addition to "Got it" */
  allowSkip?: boolean;
  /** If true, don't block interaction with the highlighted area (action-gated step) */
  allowInteraction?: boolean;
}
