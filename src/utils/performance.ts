import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
}

interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private animationId: number | null = null;
  private isMonitoring = false;

  private thresholds: PerformanceThresholds = {
    minFPS: 30, // Minimum acceptable FPS for mobile
    maxFrameTime: 33.33, // Max frame time for 30fps
    maxMemoryUsage: 0.8, // 80% memory usage threshold
  };

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measure();
  }

  stop() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private measure = () => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    
    // Calculate FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameTime = deltaTime / this.frameCount;
      
      // Skip the first measurement if it's too high (initial load)
      if (this.frameTime > 1000) {
        this.frameCount = 0;
        this.lastTime = currentTime;
        this.animationId = requestAnimationFrame(this.measure);
        return;
      }
      
      const metrics = this.getMetrics();
      
      // Check performance thresholds
      this.checkThresholds(metrics);
      
      // Notify subscribers
      this.callbacks.forEach(cb => cb(metrics));
      
      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    this.animationId = requestAnimationFrame(this.measure);
  };

  private getMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: this.frameTime,
    };

    // Get memory info if available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memory = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      };
    }

    return metrics;
  }

  private checkThresholds(metrics: PerformanceMetrics) {
    // Low FPS warning
    if (metrics.fps > 0 && metrics.fps < this.thresholds.minFPS) {
      console.warn(`Low FPS detected: ${metrics.fps}fps`);
      this.handleLowPerformance();
    }

    // High frame time warning
    if (metrics.frameTime > this.thresholds.maxFrameTime) {
      console.warn(`High frame time: ${metrics.frameTime.toFixed(2)}ms`);
    }

    // Memory usage warning
    if (metrics.memory) {
      const memoryUsageRatio = metrics.memory.used / metrics.memory.limit;
      if (memoryUsageRatio > this.thresholds.maxMemoryUsage) {
        console.warn(`High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`);
      }
    }
  }

  private handleLowPerformance() {
    // Dispatch custom event for components to handle
    window.dispatchEvent(new CustomEvent('lowperformance', {
      detail: { fps: this.fps, frameTime: this.frameTime }
    }));
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Utility to measure specific operations
  async measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      if (duration > 16.67) { // Longer than one frame at 60fps
        console.warn(`Slow operation "${name}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Operation "${name}" failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  // Get current metrics synchronously
  getCurrentMetrics(): PerformanceMetrics {
    return this.getMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
  });

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    performanceMonitor.start();

    return () => {
      unsubscribe();
      // Don't stop monitoring on cleanup as other components might be using it
    };
  }, []);

  return metrics;
};

// Utility to debounce expensive operations
export const debounceForPerformance = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 100
): T => {
  let timeout: NodeJS.Timeout | null = null;
  let lastCall = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeout) clearTimeout(timeout);

    // If called too frequently, delay execution
    if (timeSinceLastCall < 16) { // Less than one frame
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, wait);
    } else {
      lastCall = now;
      func(...args);
    }
  }) as T;
};

// Intersection Observer for lazy loading
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { elementRef, isVisible };
};

// Request idle callback wrapper
export const whenIdle = (callback: () => void, timeout = 1000) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 0);
  }
};

import { useEffect, useState, useRef } from 'react';