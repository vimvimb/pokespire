import { MUSIC_URLS } from './music';
import { SOUND_URLS } from './sound';

/** The Workbox runtime cache name used for MP3 files (must match vite.config.ts). */
const AUDIO_CACHE_NAME = 'audio-cache';

/** All MP3 URLs bundled by Vite — 14 music tracks + 11 sound effects. */
export function getAllAudioUrls(): string[] {
  return [...Object.values(MUSIC_URLS), ...Object.values(SOUND_URLS)];
}

/** How many of the 25 audio files are already in the service worker cache. */
export async function getAudioCacheStatus(): Promise<{ cached: number; total: number }> {
  const urls = getAllAudioUrls();
  const total = urls.length;
  if (!('caches' in window)) return { cached: 0, total };
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    let cached = 0;
    for (const url of urls) {
      const match = await cache.match(url);
      if (match) cached++;
    }
    return { cached, total };
  } catch {
    return { cached: 0, total };
  }
}

/**
 * Fetch every uncached audio file so Workbox's CacheFirst strategy stores them.
 * Calls onProgress after each file. Stops early if cancelledRef.current is true.
 */
export async function cacheAllAudio(
  onProgress: (done: number, total: number) => void,
  cancelledRef: { current: boolean },
): Promise<void> {
  const urls = getAllAudioUrls();
  let done = 0;
  for (const url of urls) {
    if (cancelledRef.current) break;
    try {
      await fetch(url);
    } catch {
      // Network error — skip this file and continue
    }
    done++;
    onProgress(done, urls.length);
  }
}
