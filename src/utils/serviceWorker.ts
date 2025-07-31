import { devLog } from './devLogger';

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    devLog.warn('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    devLog.log('Service Worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          devLog.log('New content available, refresh to update');
          
          // Notify user about update
          if (window.confirm('New update available! Refresh to get the latest version?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

  } catch (error) {
    devLog.error('Service Worker registration failed:', error);
  }
};

export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    devLog.log('Service Worker unregistered');
  } catch (error) {
    devLog.error('Service Worker unregistration failed:', error);
  }
};

// Request persistent storage for game saves
export const requestPersistentStorage = async () => {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const persistent = await navigator.storage.persist();
      devLog.log('Persistent storage:', persistent ? 'granted' : 'denied');
      return persistent;
    } catch (error) {
      devLog.error('Failed to request persistent storage:', error);
      return false;
    }
  }
  return false;
};