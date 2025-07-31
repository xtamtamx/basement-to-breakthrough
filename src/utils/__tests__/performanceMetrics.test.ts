import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceMetrics } from '../performanceMetrics';

describe('PerformanceMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    performanceMetrics.clear();
    
    // Mock performance.now()
    let currentTime = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      return currentTime++;
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  
  describe('Basic metrics', () => {
    it('should track metric duration', () => {
      performanceMetrics.startMetric('test-action');
      
      // Simulate time passing
      vi.advanceTimersByTime(100);
      
      const duration = performanceMetrics.endMetric('test-action');
      expect(duration).toBe(1); // Due to our mock, each call increments by 1
    });
    
    it('should handle non-existent metrics', () => {
      const duration = performanceMetrics.endMetric('non-existent');
      expect(duration).toBeNull();
    });
    
    it('should track metric metadata', () => {
      performanceMetrics.startMetric('test-with-metadata', {
        userId: '123',
        action: 'click'
      });
      
      const duration = performanceMetrics.endMetric('test-with-metadata');
      expect(duration).not.toBeNull();
    });
  });
  
  describe('Lazy load tracking', () => {
    it('should track successful lazy loads', async () => {
      const mockModule = { data: 'test' };
      const loadFn = vi.fn().mockResolvedValue(mockModule);
      
      const result = await performanceMetrics.trackLazyLoad('test-module', loadFn);
      
      expect(result).toBe(mockModule);
      expect(loadFn).toHaveBeenCalled();
      
      const metrics = performanceMetrics.getLazyLoadMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('lazy-load:test-module');
    });
    
    it('should track failed lazy loads', async () => {
      const error = new Error('Load failed');
      const loadFn = vi.fn().mockRejectedValue(error);
      
      await expect(performanceMetrics.trackLazyLoad('failing-module', loadFn))
        .rejects.toThrow('Load failed');
      
      const metrics = performanceMetrics.getLazyLoadMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].metadata?.error).toBe('Load failed');
    });
    
    it('should detect cached loads', async () => {
      // Reset mock to control timing precisely
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        // First call (start): 0, Second call (end): 5 (fast = cached)
        return callCount++ * 5;
      });
      
      const loadFn = vi.fn().mockResolvedValue({ cached: true });
      await performanceMetrics.trackLazyLoad('cached-module', loadFn);
      
      const metrics = performanceMetrics.getLazyLoadMetrics();
      expect(metrics[0].cached).toBe(true);
      expect(metrics[0].duration).toBeLessThan(10);
    });
    
    it('should detect non-cached loads', async () => {
      // Reset mock for slow load
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        // First call (start): 0, Second call (end): 50 (slow = not cached)
        return callCount++ * 50;
      });
      
      const loadFn = vi.fn().mockResolvedValue({ cached: false });
      await performanceMetrics.trackLazyLoad('fresh-module', loadFn);
      
      const metrics = performanceMetrics.getLazyLoadMetrics();
      expect(metrics[0].cached).toBe(false);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('Performance summary', () => {
    it('should calculate average load time', async () => {
      // Mock different load times
      const times = [10, 20, 30];
      let callIndex = 0;
      
      vi.spyOn(performance, 'now').mockImplementation(() => {
        const baseTime = Math.floor(callIndex / 2) * times[Math.floor(callIndex / 2)] || 0;
        return callIndex++ % 2 === 0 ? baseTime : baseTime + times[Math.floor((callIndex - 1) / 2)] || 0;
      });
      
      // Track 3 loads
      await performanceMetrics.trackLazyLoad('module1', () => Promise.resolve({}));
      await performanceMetrics.trackLazyLoad('module2', () => Promise.resolve({}));
      await performanceMetrics.trackLazyLoad('module3', () => Promise.resolve({}));
      
      const avgTime = performanceMetrics.getAverageLazyLoadTime();
      expect(avgTime).toBeGreaterThan(0);
    });
    
    it('should provide complete summary', async () => {
      await performanceMetrics.trackLazyLoad('test1', () => Promise.resolve({}));
      await performanceMetrics.trackLazyLoad('test2', () => Promise.resolve({}));
      
      const summary = performanceMetrics.getPerformanceSummary();
      
      expect(summary.lazyLoadMetrics).toBe(2);
      expect(summary.averageLazyLoadTime).toBeGreaterThanOrEqual(0);
      expect(summary.fastestLoad).toBeDefined();
      expect(summary.slowestLoad).toBeDefined();
    });
  });
  
  describe('Export functionality', () => {
    it('should export metrics as JSON', async () => {
      performanceMetrics.startMetric('action1');
      performanceMetrics.endMetric('action1');
      
      await performanceMetrics.trackLazyLoad('module1', () => Promise.resolve({}));
      
      const exported = performanceMetrics.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed.metrics).toBeDefined();
      expect(parsed.lazyLoadMetrics).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
    });
  });
  
  describe('Clear functionality', () => {
    it('should clear all metrics', async () => {
      performanceMetrics.startMetric('test');
      await performanceMetrics.trackLazyLoad('module', () => Promise.resolve({}));
      
      performanceMetrics.clear();
      
      const summary = performanceMetrics.getPerformanceSummary();
      expect(summary.totalMetrics).toBe(0);
      expect(summary.lazyLoadMetrics).toBe(0);
    });
  });
});