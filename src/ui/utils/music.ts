import earlyBossRocketBattle from '../../../assets/music/early_boss_rocket_battle_remix.mp3';
import earlyDungeonHazyPass from '../../../assets/music/early_dungeon_hazy_pass_remix.mp3';
import finalBossMewtwoBattle from '../../../assets/music/final_boss_mewtwo_battle_remix.mp3';
import finalDungeonRocketHideout from '../../../assets/music/final_dungeon_rocket_hideout_remix.mp3';
import regularBattleJohto from '../../../assets/music/regular_battle_johto_trainer_battle_remix.mp3';
import { getActMapConfig } from '../components/map/mapConfig';
import type { RunState } from '../../run/types';

export type MusicTrack =
  | 'early_dungeon'
  | 'final_dungeon'
  | 'regular_battle'
  | 'early_boss'
  | 'final_boss';

const MUSIC_URLS: Record<MusicTrack, string> = {
  early_dungeon: earlyDungeonHazyPass,
  final_dungeon: finalDungeonRocketHideout,
  regular_battle: regularBattleJohto,
  early_boss: earlyBossRocketBattle,
  final_boss: finalBossMewtwoBattle,
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

type Screen =
  | 'main_menu'
  | 'select'
  | 'map'
  | 'rest'
  | 'event'
  | 'recruit'
  | 'card_draft'
  | 'battle'
  | 'run_victory'
  | 'run_defeat'
  | 'card_dex'
  | 'pokedex'
  | 'sandbox_config'
  | 'act_transition'
  | 'card_removal'
  | 'event_tester'
  | 'ghost_revive'
  | 'disclaimer'
  | 'debugging';

const DUNGEON_SCREENS: Screen[] = [
  'map',
  'rest',
  'event',
  'recruit',
  'card_removal',
  'ghost_revive',
  'card_draft',
  'act_transition',
];

/** Resolve the correct background music track for the current screen and game state. */
export function getMusicForScreen(
  screen: Screen,
  runState: RunState | null,
  pendingBattleNodeId: string | null
): MusicTrack | null {
  if (DUNGEON_SCREENS.includes(screen) && runState) {
    const act = runState.currentAct ?? 1;
    return act === 3 ? 'final_dungeon' : 'early_dungeon';
  }

  if (screen === 'battle') {
    if (pendingBattleNodeId === 'a3-s6-boss-mewtwo') return 'final_boss';
    if (runState) {
      const actConfig = getActMapConfig(runState.currentAct);
      if (pendingBattleNodeId === actConfig.bossNodeId) return 'early_boss';
    }
    return 'regular_battle';
  }

  return null;
}
