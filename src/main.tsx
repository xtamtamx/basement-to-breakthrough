import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/pixel-art.css'
import './styles/glassmorphism.css'
import App from './App.tsx'
import { initializeMobile } from '@utils/mobile'
import { db } from '@utils/db'

// Initialize mobile features
initializeMobile();

// Initialize database
db.init().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <App />
)
