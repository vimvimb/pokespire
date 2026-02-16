/**
 * Tutorial step definitions for the first-time player practice battle.
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

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    highlight: "battlefield",
    text: (starter) =>
      `Welcome to Pokespire! This is your ${starter} — and that's a wild Magikarp. Knock it out by reducing its HP to 0!`,
    advanceCondition: "manual",
    zone: "top",
  },
  {
    id: 2,
    highlight: "hand",
    text: () =>
      "These are your cards — your moves for this turn. You'll draw a fresh hand every turn.",
    advanceCondition: "manual",
    zone: "bottom",
  },
  {
    id: 3,
    highlight: "energy",
    text: () =>
      "Each card costs Energy to play. You start each turn with 3 Energy. See the number on each card? That's its cost.",
    advanceCondition: "manual",
    zone: "bottom",
  },
  {
    id: 4,
    highlight: "attack_cards",
    text: () =>
      "Try attacking! Click a card to select it, then click the Magikarp to use it.",
    advanceCondition: "play_attack",
    zone: "bottom",
    allowInteraction: true,
  },
  {
    id: 5,
    highlight: null,
    text: () =>
      "Nice hit! You still have Energy — play more cards if you want.",
    advanceCondition: "play_any_card",
    zone: "bottom",
    allowInteraction: true,
  },
  {
    id: 6,
    highlight: "defend_cards",
    text: () =>
      "Tip: Defend gives you Block, which absorbs incoming damage before your HP. Try it!",
    advanceCondition: "play_defend",
    zone: "bottom",
    allowSkip: true,
    allowInteraction: true,
  },
  {
    id: 7,
    highlight: "end_turn",
    text: () =>
      "When you're out of Energy or done playing, click End Turn.",
    advanceCondition: "end_turn",
    zone: "bottom",
    allowInteraction: true,
  },
  {
    id: 8,
    highlight: null,
    text: () =>
      "Now the Magikarp attacks! Watch your HP.",
    advanceCondition: "enemy_turn_done",
    zone: "bottom",
    allowInteraction: true,
  },
  {
    id: 9,
    highlight: "turn_order",
    text: () =>
      "This bar shows turn order. Faster Pokémon go first each round.",
    advanceCondition: "manual",
    zone: "top",
  },
  {
    id: 10,
    highlight: null,
    text: () =>
      "You've got the basics! Finish this fight on your own. Good luck!",
    advanceCondition: "manual",
    zone: "bottom",
  },
];

/** Kanto starters for tutorial (pick one). */
export const TUTORIAL_STARTER_IDS = [
  "bulbasaur",
  "charmander",
  "squirtle",
  "pikachu",
] as const;

export type TutorialStarterId = (typeof TUTORIAL_STARTER_IDS)[number];
