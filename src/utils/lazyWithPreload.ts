import { lazy, ComponentType, LazyExoticComponent } from "react";

interface PreloadableComponent<T extends ComponentType<unknown>>
  extends LazyExoticComponent<T> {
  preload: () => Promise<{ default: T }>;
}

/**
 * Enhanced lazy loading with preload capability
 * Allows components to be preloaded before they're actually rendered
 */
export function lazyWithPreload<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
): PreloadableComponent<T> {
  const Component = lazy(importFn) as PreloadableComponent<T>;
  Component.preload = importFn;
  return Component;
}

/**
 * Preload multiple components at once
 */
export async function preloadComponents(
  components: PreloadableComponent<ComponentType<unknown>>[],
): Promise<void> {
  await Promise.all(components.map((component) => component.preload()));
}

/**
 * Preload components when the browser is idle
 */
export function preloadWhenIdle(components: PreloadableComponent<ComponentType<unknown>>[]): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        preloadComponents(components);
      },
      { timeout: 2000 },
    );
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      preloadComponents(components);
    }, 2000);
  }
}
