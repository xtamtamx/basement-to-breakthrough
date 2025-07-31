import { safeStorage } from './safeStorage';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface LazyLoadMetric extends PerformanceMetric {
  moduleSize?: number;
  cached?: boolean;
}

class PerformanceMetrics {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private lazyLoadMetrics: LazyLoadMetric[] = [];
  
  // Start tracking a metric
  startMetric(name: string, metadata?: Record<string, unknown>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }
  
  // End tracking a metric
  endMetric(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    // Store completed metric
    this.storeMetric(metric);
    
    return metric.duration;
  }
  
  // Track lazy load
  trackLazyLoad(moduleName: string, loadFn: () => Promise<unknown>): Promise<unknown> {
    const metric: LazyLoadMetric = {
      name: `lazy-load:${moduleName}`,
      startTime: performance.now(),
      cached: false
    };
    
    return loadFn()
      .then(result => {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        
        // Check if it was cached (very fast load)
        metric.cached = metric.duration < 10;
        
        this.lazyLoadMetrics.push(metric);
        this.storeMetric(metric);
        
        return result;
      })
      .catch(error => {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        metric.metadata = { error: error.message };
        
        this.lazyLoadMetrics.push(metric);
        this.storeMetric(metric);
        
        throw error;
      });
  }
  
  // Get all lazy load metrics
  getLazyLoadMetrics(): LazyLoadMetric[] {
    return [...this.lazyLoadMetrics];
  }
  
  // Get average lazy load time
  getAverageLazyLoadTime(): number {
    if (this.lazyLoadMetrics.length === 0) return 0;
    
    const totalTime = this.lazyLoadMetrics.reduce((sum, metric) => 
      sum + (metric.duration || 0), 0
    );
    
    return totalTime / this.lazyLoadMetrics.length;
  }
  
  // Store metric for analysis
  private storeMetric(metric: PerformanceMetric): void {
    // Get existing metrics from storage
    const stored = safeStorage.getItem('btb-performance-metrics');
    const existingMetrics = stored ? JSON.parse(stored) : [];
    
    // Add new metric
    existingMetrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection?.effectiveType
    });
    
    // Keep only last 100 metrics
    if (existingMetrics.length > 100) {
      existingMetrics.shift();
    }
    
    safeStorage.setItem('btb-performance-metrics', JSON.stringify(existingMetrics));
  }
  
  // Get performance summary
  getPerformanceSummary(): {
    totalMetrics: number;
    lazyLoadMetrics: number;
    averageLazyLoadTime: number;
    cachedLoads: number;
    slowestLoad?: LazyLoadMetric;
    fastestLoad?: LazyLoadMetric;
  } {
    const sortedLoads = [...this.lazyLoadMetrics].sort((a, b) => 
      (a.duration || 0) - (b.duration || 0)
    );
    
    return {
      totalMetrics: this.metrics.size,
      lazyLoadMetrics: this.lazyLoadMetrics.length,
      averageLazyLoadTime: this.getAverageLazyLoadTime(),
      cachedLoads: this.lazyLoadMetrics.filter(m => m.cached).length,
      slowestLoad: sortedLoads[sortedLoads.length - 1],
      fastestLoad: sortedLoads[0]
    };
  }
  
  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.lazyLoadMetrics = [];
  }
  
  // Export metrics for analysis
  exportMetrics(): string {
    const data = {
      metrics: Array.from(this.metrics.values()),
      lazyLoadMetrics: this.lazyLoadMetrics,
      summary: this.getPerformanceSummary(),
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetrics();

// React hook for performance tracking
export const usePerformanceMetrics = () => {
  const trackAction = (actionName: string, action: () => void | Promise<void>) => {
    performanceMetrics.startMetric(actionName);
    
    const result = action();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMetrics.endMetric(actionName);
      });
    } else {
      performanceMetrics.endMetric(actionName);
    }
  };
  
  return {
    trackAction,
    startMetric: (name: string) => performanceMetrics.startMetric(name),
    endMetric: (name: string) => performanceMetrics.endMetric(name),
    getSummary: () => performanceMetrics.getPerformanceSummary()
  };
};