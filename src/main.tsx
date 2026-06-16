import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/pixel-art.css'
import './styles/glassmorphism.css'
import './styles/snes.css'
import App from './App.tsx'
import { initializeMobile } from '@utils/mobile'
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

// Register service worker for PWA support
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
  requestPersistentStorage();
}

createRoot(document.getElementById('root')!).render(
  <App />
)
