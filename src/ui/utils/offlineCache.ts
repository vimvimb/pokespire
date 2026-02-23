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
 * Fetch and cache every uncached audio file into the service worker's audio cache.
 * Uses cache.add() instead of bare fetch() so the full response body is read and
 * stored before we move on — bare fetch() drops the body stream before Workbox
 * can finish writing the clone, which silently fails over slow CDN connections
 * (e.g. GitHub Pages). Calls onProgress after each file. Stops early if
 * cancelledRef.current is true.
 */
export async function cacheAllAudio(
  onProgress: (done: number, total: number) => void,
  cancelledRef: { current: boolean },
): Promise<void> {
  const urls = getAllAudioUrls();
  let done = 0;
  if (!('caches' in window)) {
    onProgress(urls.length, urls.length);
    return;
  }
  const cache = await caches.open(AUDIO_CACHE_NAME);
  for (const url of urls) {
    if (cancelledRef.current) break;
    try {
      if (!(await cache.match(url))) {
        // cache.add() fetches the URL, reads the full body, and stores it
        // atomically — guaranteed to be in cache when the await resolves.
        await cache.add(url);
      }
    } catch {
      // Network error or non-cacheable response — skip this file and continue
    }
    done++;
    onProgress(done, urls.length);
  }
}
