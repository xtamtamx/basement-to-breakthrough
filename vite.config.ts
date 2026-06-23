import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // src/utils/serviceWorker.ts registers /sw.js manually (with its own update
      // prompt + persistent-storage request), so don't ALSO auto-inject a
      // registration — that double-registered the same SW.
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      // Single source of truth is the static public/manifest.json (linked from
      // index.html) — it carries the full Settling Up manifest (shortcuts,
      // launch_handler, maskable icons). Disable generation here so we don't ship
      // a second, conflicting manifest. The plugin still builds the service worker.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@game': path.resolve(__dirname, './src/game'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('@pixi') || id.includes('pixi')) {
              return 'pixi';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('zustand') || id.includes('immer')) {
              return 'state';
            }
            if (id.includes('@hello-pangea/dnd')) {
              return 'dnd';
            }
            return 'vendor';
          }
          // Split game mechanics into separate chunk
          if (id.includes('/game/mechanics/')) {
            return 'game-mechanics';
          }
          // Split game types
          if (id.includes('/game/types/')) {
            return 'game-types';
          }
        }
      }
    },
    chunkSizeWarningLimit: 300
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@pixi/react', 'pixi.js']
  }
})
