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
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'assets/**/*'],
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,gif,mp3,jpg,jpeg}'],
      },
    }),
  ],
})
