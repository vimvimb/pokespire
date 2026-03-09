import { MUSIC_URLS } from './music';
import { SOUND_URLS } from './sound';
import { CAMPAIGN_1_MAP_BG_URLS } from '../components/map/mapConfig';
import { CAMPAIGN_2_BG_URLS } from '../../data/campaigns';

// Campaign 1 combat backgrounds (imported directly to avoid coupling with BattleScreen)
import c1CombatBg1 from '../../../assets/backgrounds/rocket_lab_act_1_v4.jpg';
import c1CombatBg2 from '../../../assets/backgrounds/rocket_lab_act_2.jpg';
import c1CombatBg3 from '../../../assets/backgrounds/rocket_lab_act_3.jpg';

/** Workbox runtime cache names (must match vite.config.ts). */
const AUDIO_CACHE_NAME = 'audio-cache';
const IMAGE_CACHE_NAME = 'image-cache';

/** All MP3 URLs — 14 music tracks + 11 sound effects. */
export function getAllAudioUrls(): string[] {
  return [...Object.values(MUSIC_URLS), ...Object.values(SOUND_URLS)];
}

/** All background image URLs — map + combat for both campaigns. */
export function getAllBackgroundUrls(): string[] {
  return [
    ...CAMPAIGN_1_MAP_BG_URLS,
    c1CombatBg1, c1CombatBg2, c1CombatBg3,
    ...CAMPAIGN_2_BG_URLS,
  ];
}

export interface OfflineCacheStatus {
  audioCached: number;
  audioTotal: number;
  bgCached: number;
  bgTotal: number;
  cached: number;
  total: number;
}

/** How many audio + background files are already in the service worker caches. */
export async function getOfflineCacheStatus(): Promise<OfflineCacheStatus> {
  const audioUrls = getAllAudioUrls();
  const bgUrls = getAllBackgroundUrls();
  const result: OfflineCacheStatus = {
    audioCached: 0, audioTotal: audioUrls.length,
    bgCached: 0, bgTotal: bgUrls.length,
    cached: 0, total: audioUrls.length + bgUrls.length,
  };
  if (!('caches' in window)) return result;
  try {
    const [audioCache, imageCache] = await Promise.all([
      caches.open(AUDIO_CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME),
    ]);
    for (const url of audioUrls) {
      if (await audioCache.match(url)) result.audioCached++;
    }
    for (const url of bgUrls) {
      if (await imageCache.match(url)) result.bgCached++;
    }
    result.cached = result.audioCached + result.bgCached;
    return result;
  } catch {
    return result;
  }
}

/**
 * Fetch and cache all uncached background images and audio files.
 * Uses cache.add() for atomic writes. Calls onProgress after each file.
 * Stops early if cancelledRef.current is true.
 */
export async function cacheAllOfflineAssets(
  onProgress: (done: number, total: number) => void,
  cancelledRef: { current: boolean },
): Promise<void> {
  const audioUrls = getAllAudioUrls();
  const bgUrls = getAllBackgroundUrls();
  const total = audioUrls.length + bgUrls.length;
  let done = 0;

  if (!('caches' in window)) {
    onProgress(total, total);
    return;
  }

  const [audioCache, imageCache] = await Promise.all([
    caches.open(AUDIO_CACHE_NAME),
    caches.open(IMAGE_CACHE_NAME),
  ]);

  // Cache backgrounds first (they're larger and more impactful for offline play)
  for (const url of bgUrls) {
    if (cancelledRef.current) break;
    try {
      if (!(await imageCache.match(url))) {
        await imageCache.add(url);
      }
    } catch {
      // Network error — skip and continue
    }
    done++;
    onProgress(done, total);
  }

  // Then cache audio
  for (const url of audioUrls) {
    if (cancelledRef.current) break;
    try {
      if (!(await audioCache.match(url))) {
        await audioCache.add(url);
      }
    } catch {
      // Network error — skip and continue
    }
    done++;
    onProgress(done, total);
  }
}
