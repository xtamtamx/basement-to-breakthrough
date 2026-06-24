import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './styles/fonts.css'
import './index.css'
import './styles/pixel-art.css'
import './styles/glassmorphism.css'
import './styles/snes.css'
import App from './App.tsx'
import { initializeMobile, isNative } from '@utils/mobile'
import { registerServiceWorker, requestPersistentStorage } from '@utils/serviceWorker'
import { useGameStore } from '@stores/gameStore'

// Initialize mobile features
initializeMobile();

// Dev-only store handle for testing/debugging from the browser console
if (import.meta.env.DEV) {
  (window as Window & { __gameStore?: typeof useGameStore }).__gameStore =
    useGameStore;
}

// NOTE: Save-game persistence (IndexedDB) is owned by SaveGameManager
// (src/game/persistence/SaveGameManager.ts). It is initialized lazily from the
// main game view, so no database setup is needed at app bootstrap.

// Register the precache service worker for PWA support — WEB PRODUCTION ONLY.
// Never inside the Capacitor native WebView: Capacitor serves the bundle from the
// local app package, so layering a Workbox navigation-fallback SW on top risks
// serving stale JS/CSS after an app-store update (white screen / version mismatch).
if (import.meta.env.PROD && !isNative) {
  registerServiceWorker();
  requestPersistentStorage();
}

createRoot(document.getElementById('root')!).render(
  // Respect the OS "Reduce Motion" setting globally: framer-motion drops
  // transform/layout animations (page slides, scale-ins) for users who ask
  // for it, keeping only gentle opacity fades. No effect for everyone else.
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
)
