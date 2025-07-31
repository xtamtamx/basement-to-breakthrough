import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/pixel-art.css'
import './styles/glassmorphism.css'
import App from './App.tsx'
import { initializeMobile } from '@utils/mobile'
import { db } from '@utils/db'
import { prodLog } from '@utils/devLogger'
import { registerServiceWorker, requestPersistentStorage } from '@utils/serviceWorker'

// Initialize mobile features
initializeMobile();

// Initialize database
db.init().catch(prodLog.error);

// Register service worker for PWA support
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
  requestPersistentStorage();
}

createRoot(document.getElementById('root')!).render(
  <App />
)
