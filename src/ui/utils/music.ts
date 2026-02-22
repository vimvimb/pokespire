// Campaign 1 — Rocket Tower
import earlyBossRocketBattle from '../../../assets/music/early_boss_rocket_battle_remix.mp3';
import earlyDungeonHazyPass from '../../../assets/music/early_dungeon_hazy_pass_remix.mp3';
import finalBossMewtwoBattle from '../../../assets/music/final_boss_mewtwo_battle_remix.mp3';
import finalDungeonRocketHideout from '../../../assets/music/final_dungeon_rocket_hideout_remix.mp3';
import regularBattleJohto from '../../../assets/music/regular_battle_johto_trainer_battle_remix.mp3';

// Campaign 2 — Threads of Time
import c2DungeonAct1 from '../../../assets/music/celebi_dungeon_lush_forest_remix.mp3';
import c2DungeonAct2 from '../../../assets/music/past_dungeon_ecruteak_city_remix.mp3';
import c2DungeonAct3A from '../../../assets/music/hooh_dungeon_tin_tower_remix.mp3';
import c2DungeonAct3B from '../../../assets/music/lugia_dungeon_burned_tower_remix.mp3';
import c2RegularBattle from '../../../assets/music/regular_battle_johto_gym_leader_remix.mp3';
import c2BossCelebi from '../../../assets/music/celebi_boss_time_gear_remix.mp3';
import c2BossRival from '../../../assets/music/gold_silver_boss_johto_rival_battle_remix.mp3';
import c2BossLegendaryBeast from '../../../assets/music/recruitable_boss_legendary_beast_remix.mp3';
import c2BossFinal from '../../../assets/music/hooh_lugia_boss_johto_boss_remix.mp3';

import { getRunActMapConfig, getCampaign } from '../../data/campaigns';
import type { RunState } from '../../run/types';
import type { Screen } from '../../types/screens';

export type MusicTrack =
  // Campaign 1 — Rocket Tower
  | 'early_dungeon'
  | 'final_dungeon'
  | 'regular_battle'
  | 'early_boss'
  | 'final_boss'
  // Campaign 2 — Threads of Time
  | 'c2_dungeon_act1'
  | 'c2_dungeon_act2'
  | 'c2_dungeon_act3a'
  | 'c2_dungeon_act3b'
  | 'c2_regular_battle'
  | 'c2_boss_celebi'
  | 'c2_boss_rival'
  | 'c2_boss_legendary_beast'
  | 'c2_boss_final';

const MUSIC_URLS: Record<MusicTrack, string> = {
  // Campaign 1
  early_dungeon:  earlyDungeonHazyPass,
  final_dungeon:  finalDungeonRocketHideout,
  regular_battle: regularBattleJohto,
  early_boss:     earlyBossRocketBattle,
  final_boss:     finalBossMewtwoBattle,
  // Campaign 2
  c2_dungeon_act1:          c2DungeonAct1,
  c2_dungeon_act2:          c2DungeonAct2,
  c2_dungeon_act3a:         c2DungeonAct3A,
  c2_dungeon_act3b:         c2DungeonAct3B,
  c2_regular_battle:        c2RegularBattle,
  c2_boss_celebi:           c2BossCelebi,
  c2_boss_rival:            c2BossRival,
  c2_boss_legendary_beast:  c2BossLegendaryBeast,
  c2_boss_final:            c2BossFinal,
};

const FADE_MS = 500;
const MUSIC_VOLUME = 0.35;

let audio: HTMLAudioElement | null = null;
let currentTrack: MusicTrack | null = null;
let fadeFrameId: number | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
  }
  return audio;
}

function stopFade() {
  if (fadeFrameId !== null) {
    cancelAnimationFrame(fadeFrameId);
    fadeFrameId = null;
  }
}

function fadeOut(callback: () => void) {
  stopFade();
  const a = audio;
  if (!a) {
    callback();
    return;
  }
  const startVolume = a.volume;
  const startTime = performance.now();

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / FADE_MS, 1);
    a.volume = Math.max(0, startVolume * (1 - t));

    if (t >= 1) {
      stopFade();
      a.pause();
      a.currentTime = 0;
      a.volume = MUSIC_VOLUME;
      callback();
    } else {
      fadeFrameId = requestAnimationFrame(animate);
    }
  };

  fadeFrameId = requestAnimationFrame(animate);
}

/** Play background music. Loops until a different track or null is requested.
 *  If the same track is already playing, does nothing.
 *  If null, fades out and stops.
 *  If different track, fades out current then starts new. */
export function playMusic(track: MusicTrack | null): void {
  if (track === currentTrack) return;

  if (track === null) {
    fadeOut(() => {
      currentTrack = null;
      if (audio) {
        audio.src = '';
      }
    });
    return;
  }

  const url = MUSIC_URLS[track];
  if (!url) return;

  const a = getAudio();
  if (currentTrack !== null) {
    fadeOut(() => {
      currentTrack = track;
      a.src = url;
      a.volume = MUSIC_VOLUME;
      a.play().catch(() => {});
    });
  } else {
    currentTrack = track;
    a.src = url;
    a.volume = MUSIC_VOLUME;
    a.play().catch(() => {});
  }
}

const DUNGEON_SCREENS: Screen[] = [
  'map',
  'rest',
  'event',
  'recruit',
  'card_removal',
  'ghost_revive',
  'card_draft',
  'level_up',
  'act_transition',
];

/** Resolve the correct background music track for the current screen and game state. */
export function getMusicForScreen(
  screen: Screen,
  runState: RunState | null,
  pendingBattleNodeId: string | null
): MusicTrack | null {
  if (!runState) return null;

  // Check whether this campaign has a music config; if so, use it entirely.
  const campaign = getCampaign(runState.campaignId ?? 'rocket_tower');
  const musicConfig = campaign.musicConfig;

  if (musicConfig) {
    if (DUNGEON_SCREENS.includes(screen)) {
      // Variant-specific dungeon track takes priority (e.g. tin_tower vs brass_tower)
      const variant = runState.actVariants?.[runState.currentAct];
      if (variant && musicConfig.dungeonVariants?.[variant]) {
        return musicConfig.dungeonVariants[variant] as MusicTrack;
      }
      return (musicConfig.dungeon[runState.currentAct] ?? null) as MusicTrack | null;
    }

    if (screen === 'battle') {
      if (pendingBattleNodeId && musicConfig.bossTracksByNodeId[pendingBattleNodeId]) {
        return musicConfig.bossTracksByNodeId[pendingBattleNodeId] as MusicTrack;
      }
      return (musicConfig.regularBattle[runState.currentAct] ?? null) as MusicTrack | null;
    }

    return null;
  }

  // ── Campaign 1 (Rocket Tower) — original logic, unchanged ─────────────────

  if (DUNGEON_SCREENS.includes(screen)) {
    const act = runState.currentAct ?? 1;
    return act === 3 ? 'final_dungeon' : 'early_dungeon';
  }

  if (screen === 'battle') {
    if (pendingBattleNodeId === 'a3-s6-boss-mewtwo') return 'final_boss';
    const actConfig = getRunActMapConfig(runState);
    if (pendingBattleNodeId === actConfig.bossNodeId) return 'early_boss';
    return 'regular_battle';
  }

  return null;
}
