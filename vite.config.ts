import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/pokespire/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Do not set includeAssets — workbox.globPatterns already captures all necessary files
      // (sprites, fonts, JS, CSS, icons). Using includeAssets alongside globPatterns causes
      // duplicate precache entries, doubling the sw.js size for no benefit.
      manifest: {
        name: 'Pokespire',
        short_name: 'Pokespire',
        description: 'Pokemon roguelike deckbuilder',
        theme_color: '#0f0f17',
        background_color: '#0f0f17',
        display: 'standalone',
        start_url: '/pokespire/',
        scope: '/pokespire/',
        icons: [
          { src: '/pokespire/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pokespire/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MiB
        // mp3 excluded from precache — handled by runtimeCaching with range request support below
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,gif,jpg,jpeg}'],
        // Exclude the public/ copies of Kreon fonts. Vite processes the font referenced in
        // index.html and emits a content-hashed version (e.g. Kreon-VariableFont_wght-HASH.ttf)
        // at the root of assets/ — that hashed copy IS precached. The public/ copies in
        // assets/Fonts/** are dead duplicates (wrong path, wrong filename) that waste cache space.
        globIgnores: [
          'assets/Fonts/**',
          // Exclude large campaign background images (~30 MB total) from precache.
          // They are runtime-cached on first view instead (see runtimeCaching below).
          // Without this, the ~43 MB atomic precache regularly fails on mobile.
          'assets/*map_background*',
          'assets/*combat_background*',
          'assets/*rocket_lab*',
        ],
        // Explicitly set navigation fallback for SPA offline support
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/pokespire\//],
        // Cache audio files at runtime with range request support.
        // Range requests (HTTP 206) are required for HTML <audio> elements to
        // seek/buffer audio, even when served from the service worker cache.
        runtimeCaching: [
          {
            urlPattern: /\.(png|jpe?g)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
})
