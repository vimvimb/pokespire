import type { MapNode, RunState } from "../run/types";
import type { ActMapConfig } from "../ui/components/map/mapConfig";
import {
  ACT_MAP_CONFIGS,
  getActMapConfig,
} from "../ui/components/map/mapConfig";

// Campaign 2 — map backgrounds
import c2Act1MapBg from "../../assets/backgrounds/campaign_2_act_1_map_background.png";
import c2Act2MapBg from "../../assets/backgrounds/campaign_2_act_2_map_background.png";
import c2Act3AMapBg from "../../assets/backgrounds/campaign_2_act_3a_map_background.png";
import c2Act3BMapBg from "../../assets/backgrounds/campaign_2_act_3b_map_background.png";
// Campaign 2 — combat backgrounds
import c2Act1CombatBg from "../../assets/backgrounds/campaign_2_act_1_combat_background.png";
import c2Act2CombatBg from "../../assets/backgrounds/campaign_2_act_2_combat_background.png";
import c2Act3ACombatBg from "../../assets/backgrounds/campaign_2_act_3a_combat_background.png";
import c2Act3BCombatBg from "../../assets/backgrounds/campaign_2_act_3b_combat_background.png";
import { isCampaignComplete, getCampaignCompletion } from "../run/playerProfile";
import { ACT1_NODES, ACT2_NODES, ACT3_NODES } from "../run/nodes";
import { CAMPAIGN2_ACT1_NODES } from "../run/nodesCampaign2Act1";
import { CAMPAIGN2_ACT2_NODES } from "../run/nodesCampaign2Act2";
import { CAMPAIGN2_ACT3A_NODES } from "../run/nodesCampaign2Act3A";
import { CAMPAIGN2_ACT3B_NODES } from "../run/nodesCampaign2Act3B";

// ============================================================
// Campaign Types
// ============================================================

/**
 * Campaign-specific music configuration.
 * Uses string track IDs (matching MusicTrack values) to avoid a circular import
 * with music.ts, which already imports from this file.
 */
export interface CampaignMusicConfig {
  /** Dungeon-screen track (map, rest, event, etc.) per act number. */
  dungeon: Record<number, string>;
  /** Act-variant overrides for dungeon track (e.g. 'tin_tower', 'brass_tower'). */
  dungeonVariants?: Record<string, string>;
  /** Regular battle track per act number. */
  regularBattle: Record<number, string>;
  /** Boss/special battle tracks keyed by exact node ID. */
  bossTracksByNodeId: Record<string, string>;
}

/** Narrative text overrides displayed in various screens for this campaign. */
export interface CampaignNarrativeTexts {
  /** Story intro shown on the story_intro phase of CampaignDraftScreen. */
  draftIntro: string;
  /** Per-act text for ActTransitionScreen. Key is act number (1, 2, …). */
  actTransitions: Record<
    number,
    {
      heading: string;
      story: string;
      buttonLabel: string;
      accentColor: string;
    }
  >;
  /** Subtitle shown on RunVictoryScreen. */
  victorySubtitle: string;
  /**
   * Per-variant victory subtitle override.
   * Key matches actVariant stored in RunState.actVariants (e.g. 'tin_tower').
   */
  victorySubtitleVariants?: Record<string, string>;
}

export interface CampaignActDef {
  actNumber: number;
  nodes: MapNode[];
  spawnNodeId: string;
  bossNodeId: string; // Primary boss node — must be completed to end this act
  /** Additional boss node IDs that also count as completing the act (branching paths). */
  alternateBossNodeIds?: string[];
  mapConfig: ActMapConfig;
  /** Optional alternate act variants (e.g. branching Act 3 paths). */
  variants?: Record<
    string,
    {
      nodes: MapNode[];
      spawnNodeId: string;
      bossNodeId: string;
      mapConfig: ActMapConfig;
    }
  >;
}

export interface CampaignDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  /**
   * If set, this campaign ID must be completed before this one is available.
   * Omit (or undefined) to always unlock.
   */
  unlockedBy?: string;
  /** Pokemon shown in the starter pick phase of the campaign draft. */
  starterIds: string[];
  /**
   * Pokemon available in the draft rounds (rounds 2–4).
   * null = use the player's unlocked pool (Campaign 1 behaviour).
   * string[] = fixed pool regardless of unlocks.
   */
  draftPool: string[] | null;
  /** Pokemon available as mid-run recruit encounters. */
  recruitPool: string[];
  narrativeTexts: CampaignNarrativeTexts;
  /** Campaign-specific music. Omit to use default Campaign 1 music logic. */
  musicConfig?: CampaignMusicConfig;
  acts: CampaignActDef[];
}

// ============================================================
// Campaign Registry
// ============================================================

/** Campaign 1 recruit pool — all Gen 1 Pokemon available for encounters. */
export const CAMPAIGN1_RECRUIT_POOL = [
  "charmander",
  "squirtle",
  "bulbasaur",
  "pikachu",
  "pidgey",
  "rattata",
  "ekans",
  "tauros",
  "snorlax",
  "kangaskhan",
  "nidoran-m",
  "nidoran-f",
  "rhyhorn",
  "drowzee",
  "growlithe",
  "voltorb",
  "caterpie",
  "weedle",
  "magikarp",
  "lapras",
  "magmar",
  "electabuzz",
  "dratini",
  "spearow",
  "sandshrew",
  "clefairy",
  "machop",
  "vulpix",
  "oddish",
  "meowth",
  "jigglypuff",
  "paras",
  "zubat",
];

export const CAMPAIGNS: CampaignDefinition[] = [
  {
    id: "rocket_tower",
    name: "Rocket Tower",
    subtitle: "The Original Campaign",
    description:
      "Fight through Team Rocket's tower. Prepare to face an abomination.",
    starterIds: ["bulbasaur", "charmander", "squirtle", "pikachu"],
    draftPool: null, // uses player unlock system
    recruitPool: CAMPAIGN1_RECRUIT_POOL,
    narrativeTexts: {
      draftIntro:
        "There have been some strange disturbances in the old Team Rocket hideout. You've been sent to investigate, but you'll need help.",
      actTransitions: {
        1: {
          heading: "Act 1 Complete!",
          story:
            "Ariana has been defeated, but she was only a diversion. Giovanni himself waits on the floor below...",
          buttonLabel: "Continue to Act 2",
          accentColor: "#60a5fa",
        },
        2: {
          heading: "Act 2 Complete!",
          story:
            'Giovanni has fallen. His final words: "You\'re too late — Mewtwo has escaped into the caverns below."',
          buttonLabel: "Descend to Act 3",
          accentColor: "#a855f7",
        },
      },
      victorySubtitle:
        "Mewtwo has been subdued. Team Rocket's ambitions lie in ruins.\nYour team emerges from the caverns, triumphant.",
    },
    acts: [
      {
        actNumber: 1,
        nodes: ACT1_NODES,
        spawnNodeId: "s0-spawn",
        bossNodeId: "s6-boss-ariana",
        mapConfig: ACT_MAP_CONFIGS[1],
      },
      {
        actNumber: 2,
        nodes: ACT2_NODES,
        spawnNodeId: "a2-s0-spawn",
        bossNodeId: "a2-s6-boss-giovanni",
        mapConfig: ACT_MAP_CONFIGS[2],
      },
      {
        actNumber: 3,
        nodes: ACT3_NODES,
        spawnNodeId: "a3-s0-spawn",
        bossNodeId: "a3-s6-boss-mewtwo",
        mapConfig: ACT_MAP_CONFIGS[3],
      },
    ],
  },

  {
    id: "campaign_2",
    name: "Threads of Time",
    subtitle: "An Adventure in Johto",
    description:
      "Something disturbs the shrine in Ilex Forest. Follow the rift back through time.",
    unlockedBy: "rocket_tower",
    starterIds: ["chikorita", "cyndaquil", "totodile"],
    draftPool: [
      "sentret",
      "hoothoot",
      "ledyba",
      "spinarak",
      "wooper",
      "aipom",
      "hoppip",
    ],
    recruitPool: [
      "sentret",
      "hoothoot",
      "ledyba",
      "spinarak",
      "wooper",
      "aipom",
      "hoppip",
    ],
    narrativeTexts: {
      draftIntro:
        "Strange reports have been filtering out of Ilex Forest. The ancient Celebi shrine is radiating unstable temporal energy, and the wild Pokemon in the area have grown erratic. You've been sent to investigate — but you won't be going alone.",
      actTransitions: {
        1: {
          heading: "Act 1 Complete!",
          story:
            "Celebi falls. The forest holds its breath. Then — a tear splits the air, a rush of light, and you're falling backward through time. When you land, the world is different. Older. Untouched. The Brass Tower still stands.",
          buttonLabel: "Enter the Past",
          accentColor: "#34d399",
        },
      },
      victorySubtitle:
        "The guardian falls. The rift opens. Celebi watches from between the trees as you step back through the thread you came from.",
      victorySubtitleVariants: {
        tin_tower:
          "Ho-Oh descends from the summit, wreathed in flame. Its wings slow. It lands before you — and for one long moment, it regards you. Then the rift opens. Celebi is waiting. It's time to go home.",
        brass_tower:
          "Lugia folds its wings and becomes still. The Brass Tower goes silent — the deepest silence you've heard. It exhales slowly, and the rift opens. Celebi is waiting. It's time to go home.",
      },
    },
    musicConfig: {
      dungeon: {
        1: "c2_dungeon_act1",
        2: "c2_dungeon_act2",
        3: "c2_dungeon_act3a", // fallback for act 3 (overridden by dungeonVariants below)
      },
      dungeonVariants: {
        tin_tower: "c2_dungeon_act3a",
        brass_tower: "c2_dungeon_act3b",
      },
      regularBattle: {
        1: "c2_regular_battle",
        2: "c2_regular_battle",
        3: "c2_regular_battle",
      },
      bossTracksByNodeId: {
        // Act 1 — Celebi
        "c2-a1-s6-boss-celebi": "c2_boss_celebi",
        // Act 2 — Gold and Silver (same track)
        "c2-a2-boss-gold": "c2_boss_rival",
        "c2-a2-boss-silver": "c2_boss_rival",
        // Act 3A — Legendary beasts + Ho-Oh
        "c2-a3a-s5-recruit-raikou": "c2_boss_legendary_beast",
        "c2-a3a-s5-recruit-entei": "c2_boss_legendary_beast",
        "c2-a3a-s5-recruit-suicune": "c2_boss_legendary_beast",
        "c2-a3a-s7-boss-ho-oh": "c2_boss_final",
        // Act 3B — Legendary beasts + Lugia
        "c2-a3b-s5-recruit-raikou": "c2_boss_legendary_beast",
        "c2-a3b-s5-recruit-entei": "c2_boss_legendary_beast",
        "c2-a3b-s5-recruit-suicune": "c2_boss_legendary_beast",
        "c2-a3b-s7-boss-lugia": "c2_boss_final",
      },
    },
    acts: [
      {
        actNumber: 1,
        nodes: CAMPAIGN2_ACT1_NODES,
        spawnNodeId: "c2-a1-s0-spawn",
        bossNodeId: "c2-a1-s6-boss-celebi",
        mapConfig: {
          backgroundImage: c2Act1MapBg,
          combatBackgroundImage: c2Act1CombatBg,
          tintColor: "rgba(5, 20, 5, 0.45)",
          ambientColor: "#4ade80",
          title: "Act 1 — Ilex Forest",
          bossNodeId: "c2-a1-s6-boss-celebi",
          bossName: "Celebi",
        },
      },
      {
        actNumber: 2,
        nodes: CAMPAIGN2_ACT2_NODES,
        spawnNodeId: "c2-a2-s0-spawn",
        bossNodeId: "c2-a2-boss-gold",
        alternateBossNodeIds: ["c2-a2-boss-silver"],
        mapConfig: {
          backgroundImage: c2Act2MapBg,
          combatBackgroundImage: c2Act2CombatBg,
          tintColor: "rgba(30, 20, 10, 0.35)",
          ambientColor: "#fbbf24",
          title: "Act 2 — Past Johto",
          bossNodeId: "c2-a2-boss-gold",
          bossName: "Gold",
          bossByNodeId: {
            "c2-a2-boss-gold":   "Gold",
            "c2-a2-boss-silver": "Silver",
          },
        },
      },
      {
        actNumber: 3,
        // Default: Tin Tower (Gold's path)
        nodes: CAMPAIGN2_ACT3A_NODES,
        spawnNodeId: "c2-a3a-s0-spawn",
        bossNodeId: "c2-a3a-s7-boss-ho-oh",
        mapConfig: {
          backgroundImage: c2Act3AMapBg,
          combatBackgroundImage: c2Act3ACombatBg,
          tintColor: "rgba(40, 25, 0, 0.3)",
          ambientColor: "#f97316",
          title: "Act 3 — Tin Tower",
          bossNodeId: "c2-a3a-s7-boss-ho-oh",
          bossName: "Ho-Oh",
        },
        // Variant: Brass Tower (Silver's path)
        variants: {
          brass_tower: {
            nodes: CAMPAIGN2_ACT3B_NODES,
            spawnNodeId: "c2-a3b-s0-spawn",
            bossNodeId: "c2-a3b-s7-boss-lugia",
            mapConfig: {
              backgroundImage: c2Act3BMapBg,
              combatBackgroundImage: c2Act3BCombatBg,
              tintColor: "rgba(5, 10, 25, 0.4)",
              ambientColor: "#a5f3fc",
              title: "Act 3 — Brass Tower",
              bossNodeId: "c2-a3b-s7-boss-lugia",
              bossName: "Lugia",
            },
          },
        },
      },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

/**
 * Look up a campaign by ID. Falls back to Rocket Tower if not found.
 */
export function getCampaign(id: string): CampaignDefinition {
  return CAMPAIGNS.find((c) => c.id === id) ?? CAMPAIGNS[0];
}

/**
 * Get the active act definition for the current act, respecting variants.
 */
function getActiveActDef(run: RunState) {
  const campaign = getCampaign(run.campaignId ?? "rocket_tower");
  const actDef = campaign.acts.find((a) => a.actNumber === run.currentAct);
  if (!actDef) return null;
  const variant = run.actVariants?.[run.currentAct];
  if (variant && actDef.variants?.[variant]) {
    return {
      ...actDef.variants[variant],
      alternateBossNodeIds: undefined as undefined,
    };
  }
  return actDef;
}

/**
 * Get the map config for the run's current campaign and act (variant-aware).
 */
export function getRunActMapConfig(run: RunState): ActMapConfig {
  const actDef = getActiveActDef(run);
  return actDef?.mapConfig ?? getActMapConfig(run.currentAct);
}

/**
 * Check if the current act's boss has been defeated (variant-aware, alternate-boss-aware).
 */
export function isCurrentActComplete(run: RunState): boolean {
  const campaign = getCampaign(run.campaignId ?? "rocket_tower");
  const actDef = campaign.acts.find((a) => a.actNumber === run.currentAct);
  if (!actDef) return false;

  const variant = run.actVariants?.[run.currentAct];
  const activeBossId =
    variant && actDef.variants?.[variant]?.bossNodeId
      ? actDef.variants[variant].bossNodeId
      : actDef.bossNodeId;

  const bossIds = [activeBossId, ...(actDef.alternateBossNodeIds ?? [])];
  return run.nodes.some((n) => bossIds.includes(n.id) && n.completed);
}

/**
 * Check whether there is a next act to transition into.
 */
export function hasNextAct(run: RunState): boolean {
  const campaign = getCampaign(run.campaignId ?? "rocket_tower");
  return campaign.acts.some((a) => a.actNumber === run.currentAct + 1);
}

// ── Act Transition Content ────────────────────────────────────────────────────

type ActTransitionContent = {
  heading: string;
  story: string;
  buttonLabel: string;
  accentColor: string;
};

/**
 * Returns metadata-aware act transition content for campaigns that need it,
 * or null if the static narrativeTexts content should be used instead.
 *
 * Currently handles Campaign 2 Act 2 (Silver and Gold paths), where Silver's
 * post-defeat dialog varies based on whether the player completed Campaign 1
 * without any Pokemon being knocked out.
 */
export function getDynamicActTransitionContent(
  run: RunState
): ActTransitionContent | null {
  // Only applies during Campaign 2 Act 2
  if (run.campaignId !== 'campaign_2' || run.currentAct !== 2) return null;

  // Check which boss was defeated — NOT currentNodeId, which is the boss node itself
  // when the act_transition screen is shown (before the player clicks Continue).
  const isGoldPath   = run.nodes.some(n => n.id === 'c2-a2-boss-gold'   && n.completed);
  const isSilverPath = run.nodes.some(n => n.id === 'c2-a2-boss-silver' && n.completed);

  if (isGoldPath) {
    return {
      heading: 'Act 2 Complete!',
      story: "Gold steadies his breathing. Despite everything, he\u2019s grinning. \u201cYou\u2019re incredible. I\u2019ve never been beaten that cleanly.\u201d He glances toward the tower rising in the distance. \u201cWhoever trained you to fight like that\u2026\u201d He trails off, already walking away. \u201cI\u2019m going to get there too.\u201d",
      buttonLabel: 'Climb the Tin Tower',
      accentColor: '#f97316',
    };
  }

  if (isSilverPath) {
    // Check if the player completed Campaign 1 without losing any Pokemon
    const c1 = getCampaignCompletion('rocket_tower');
    const c1Flawless = c1 !== null && (c1.metadata.graveyardCount as number) === 0;

    const story = c1Flawless
      ? "Silver watches you leave in silence. Then, just before you\u2019re out of earshot: \u201cYou fight like someone I\u2019ve heard about. Someone who dismantled my father\u2019s organization \u2014 without a single casualty.\u201d A pause. \u201cYou\u2019re too young. It can\u2019t be you.\u201d He doesn\u2019t finish the thought."
      : "Silver doesn\u2019t speak. He watches you leave with an expression you can\u2019t read. Behind you, the smoldering silhouette of the Brass Tower darkens the sky.";

    return {
      heading: 'Act 2 Complete!',
      story,
      buttonLabel: 'Enter the Brass Tower',
      accentColor: '#818cf8',
    };
  }

  return null;
}

/**
 * Return the unlock/completion status of a campaign for the current player profile.
 * - 'locked'    — the prerequisite campaign has not been beaten
 * - 'available' — unlocked but not yet completed
 * - 'completed' — beaten at least once
 */
export function getCampaignStatus(
  campaignId: string,
): "locked" | "available" | "completed" {
  if (isCampaignComplete(campaignId)) return "completed";
  const campaign = getCampaign(campaignId);
  if (campaign.unlockedBy && !isCampaignComplete(campaign.unlockedBy))
    return "locked";
  return "available";
}
