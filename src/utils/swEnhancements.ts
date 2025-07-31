import { devLog, prodLog } from "./devLogger";

/**
 * Service Worker enhancements for better performance
 */

// Cache strategies
export const CACHE_STRATEGIES = {
  NETWORK_FIRST: "network-first",
  CACHE_FIRST: "cache-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
} as const;

// Cache names
export const CACHE_NAMES = {
  STATIC: "static-v1",
  DYNAMIC: "dynamic-v1",
  IMAGES: "images-v1",
  GAME_DATA: "game-data-v1",
} as const;

// Resources to precache
export const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add critical assets here
];

/**
 * Clean up old caches
 */
export async function cleanupCaches(): Promise<void> {
  const cacheWhitelist = Object.values(CACHE_NAMES);
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map(async (cacheName) => {
      if (!cacheWhitelist.includes(cacheName)) {
        devLog.log("Deleting old cache:", cacheName);
        await caches.delete(cacheName);
      }
    }),
  );
}

/**
 * Cache game assets for offline play
 */
export async function cacheGameAssets(): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.GAME_DATA);

  // Cache critical game data
  const gameAssets = [
    "/api/bands.json",
    "/api/venues.json",
    "/api/equipment.json",
    // Add more game assets
  ];

  try {
    await cache.addAll(gameAssets);
    devLog.log("Game assets cached successfully");
  } catch (error) {
    prodLog.error("Failed to cache game assets:", error);
  }
}

/**
 * Implement stale-while-revalidate strategy
 */
export async function staleWhileRevalidate(
  request: Request,
  cacheName: string,
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

/**
 * Register periodic background sync for game data
 */
export async function registerBackgroundSync(): Promise<void> {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const registration = await navigator.serviceWorker.ready;

    try {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-game-data");
      devLog.log("Background sync registered");
    } catch (error) {
      prodLog.error("Background sync registration failed:", error);
    }
  }
}

/**
 * Prefetch next likely resources
 */
export function prefetchResources(urls: string[]): void {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "PREFETCH_RESOURCES",
      urls,
    });
  }
}
