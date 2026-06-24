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
        // CHUNKING IS DELIBERATELY MINIMAL. The previous strategy sliced
        // node_modules into react / state / dnd / vendor sub-chunks AND forced
        // app code into game-mechanics / game-types chunks. Those boundaries cut
        // straight through circular imports (React↔zustand internals; the app's
        // own gameStore↔mechanics cycle), and Rollup cannot guarantee init order
        // across a chunk boundary inside a cycle — so a binding gets used before
        // it initializes ("Cannot access 'X' before initialization"), throwing at
        // module-eval time and white-screening BOTH the production web build and
        // the Capacitor native app. (Dev + Vitest use a different module-eval
        // order, which is why it never showed up there.) Rule of thumb: only split
        // out LARGE, SELF-CONTAINED leaves whose dependency edges are one-way
        // (pixi, framer-motion depend on React but nothing depends back on them).
        // Everything else — React, react-dom, scheduler, zustand, immer, dnd, idb,
        // … — stays in one `vendor` chunk, and app code is left for Rollup to
        // co-locate (lazy import() boundaries still split on their own and are
        // safe, since they aren't part of the initial synchronous eval).
        manualChunks: (id) => {
          // ALL node_modules go in ONE vendor chunk. Splitting them (react / state
          // / pixi / framer-motion / …) repeatedly created cross-chunk cycles
          // (zustand's create() landing in the react chunk; pixi.js ↔ pixi-filters
          // straddling pixi/vendor) where Rollup can't guarantee init order, so a
          // binding is used before initialization at module-eval — a hard
          // "Cannot access 'X' before initialization" crash that white-screens the
          // production web build AND the Capacitor native app (dev + Vitest hide it
          // via a different eval order). A single vendor chunk makes every
          // cross-chunk edge one-way (app → vendor), so a startup TDZ is
          // structurally impossible and stays that way as dependencies change.
          // App code is left to Rollup; lazy import() boundaries still split on
          // their own and are safe (not part of the initial synchronous eval).
          if (id.includes('node_modules')) {
            return 'vendor';
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
