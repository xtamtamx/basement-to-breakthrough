import { analytics } from './analytics';
import { errorMonitoring } from './errorMonitoring';
import { devLog } from './devLogger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface VitalMetrics {
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitoring {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private vitalMetrics: VitalMetrics = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.measurePageLoad();
    }
  }

  // Initialize performance observers
  private initializeObservers(): void {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP Observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.vitalMetrics.LCP = lastEntry.startTime;
          this.reportVital('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        devLog.error('LCP Observer failed:', e);
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          this.vitalMetrics.FID = firstEntry.processingStart - firstEntry.startTime;
          this.reportVital('FID', this.vitalMetrics.FID);
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        devLog.error('FID Observer failed:', e);
      }

      // CLS Observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.vitalMetrics.CLS = clsValue;
          this.reportVital('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        devLog.error('CLS Observer failed:', e);
      }
    }

    // FCP from Navigation Timing
    if (window.performance && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.vitalMetrics.FCP = fcpEntry.startTime;
        this.reportVital('FCP', fcpEntry.startTime);
      }
    }
  }

  // Measure page load performance
  private measurePageLoad(): void {
    if (!window.performance || !performance.timing) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        // Calculate metrics
        const metrics = {
          // Time to First Byte
          TTFB: timing.responseStart - timing.requestStart,
          // DOM Content Loaded
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          // Page Load Time
          pageLoadTime: timing.loadEventEnd - timing.navigationStart,
          // Resource Load Time
          resourceLoadTime: timing.loadEventEnd - timing.responseEnd,
          // DNS Lookup
          dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
          // TCP Connection
          tcpConnection: timing.connectEnd - timing.connectStart,
          // Request Time
          requestTime: timing.responseEnd - timing.requestStart,
          // Transfer Size (if available)
          transferSize: navigation?.transferSize || 0,
          // Decoded Body Size
          decodedBodySize: navigation?.decodedBodySize || 0
        };

        // Report to analytics
        Object.entries(metrics).forEach(([name, value]) => {
          if (value > 0) {
            analytics.trackTiming('page_load', name, value);
          }
        });

        devLog.log('Page load metrics:', metrics);
      }, 0);
    });
  }

  // Start measuring a custom metric
  startMeasure(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  // End measuring a custom metric
  endMeasure(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      devLog.warn(`No metric found for: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Report to analytics
    analytics.trackTiming('custom', name, metric.duration);

    // Report to error monitoring if it's a long task
    if (metric.duration > 50) { // Long task threshold
      errorMonitoring.trackPerformance({
        name: `long_task_${name}`,
        value: metric.duration,
        unit: 'millisecond',
        tags: metric.metadata
      });
    }

    // Log in development
    devLog.log(`Performance: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);

    this.metrics.delete(name);
    return metric.duration;
  }

  // Measure async operation
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  // Report Web Vital
  private reportVital(name: string, value: number): void {
    // Determine rating
    let rating: 'good' | 'needs-improvement' | 'poor';
    switch (name) {
      case 'LCP':
        rating = value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
        break;
      case 'FID':
        rating = value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
        break;
      case 'CLS':
        rating = value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
        break;
      case 'FCP':
        rating = value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor';
        break;
      default:
        rating = 'good';
    }

    // Report to analytics
    analytics.track('web_vital', {
      metric_name: name,
      metric_value: value,
      metric_rating: rating
    });

    // Log warning if poor
    if (rating === 'poor') {
      devLog.warn(`Poor ${name} performance: ${value}`);
    }
  }

  // Get current vital metrics
  getVitals(): VitalMetrics {
    return { ...this.vitalMetrics };
  }

  // Memory usage monitoring
  getMemoryUsage(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Frame rate monitoring
  measureFrameRate(duration: number = 1000): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      
      const countFrame = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= duration) {
          const fps = (frameCount * 1000) / (currentTime - lastTime);
          resolve(fps);
        } else {
          requestAnimationFrame(countFrame);
        }
      };
      
      requestAnimationFrame(countFrame);
    });
  }

  // Resource timing analysis
  getResourceTimings(): PerformanceResourceTiming[] {
    if (!window.performance || !performance.getEntriesByType) return [];
    
    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  // Analyze bundle sizes
  analyzeBundleSizes(): {
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  } {
    const resources = this.getResourceTimings();
    const analysis: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    resources.forEach(resource => {
      const type = this.getResourceType(resource.name);
      if (!analysis[type]) {
        analysis[type] = { count: 0, size: 0 };
      }
      
      analysis[type].count++;
      analysis[type].size += resource.transferSize || 0;
      totalSize += resource.transferSize || 0;
    });

    return { totalSize, byType: analysis };
  }

  // Helper to determine resource type
  private getResourceType(url: string): string {
    if (url.endsWith('.js') || url.includes('.js?')) return 'javascript';
    if (url.endsWith('.css') || url.includes('.css?')) return 'stylesheet';
    if (/\.(png|jpg|jpeg|gif|webp|svg)/.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)/.test(url)) return 'font';
    if (url.includes('api/') || url.includes('/api')) return 'api';
    return 'other';
  }

  // Clean up observers
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoring();

// Auto-report vitals when page is about to unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const vitals = performanceMonitoring.getVitals();
      devLog.log('Final Web Vitals:', vitals);
    }
  });
}