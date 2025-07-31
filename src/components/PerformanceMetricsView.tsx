import React, { useState, useEffect } from 'react';
import { performanceMetrics, usePerformanceMetrics } from '@utils/performanceMetrics';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/haptics';

export const PerformanceMetricsView: React.FC = () => {
  const [metrics, setMetrics] = useState(performanceMetrics.getPerformanceSummary());
  const [isTracking, setIsTracking] = useState(false);
  const { trackAction } = usePerformanceMetrics();
  const { loadInitialGameData } = useGameStore();

  const updateMetrics = () => {
    setMetrics(performanceMetrics.getPerformanceSummary());
  };

  const handleTestLazyLoad = async () => {
    setIsTracking(true);
    haptics.medium();
    
    // Clear existing data to force reload
    useGameStore.setState({
      allBands: [],
      venues: [],
      rosterBandIds: []
    });
    
    // Test lazy loading with metrics
    await trackAction('test-lazy-load', async () => {
      await loadInitialGameData();
    });
    
    updateMetrics();
    setIsTracking(false);
    haptics.success();
  };

  const handleClearMetrics = () => {
    haptics.medium();
    performanceMetrics.clear();
    updateMetrics();
  };

  const handleExportMetrics = () => {
    haptics.medium();
    const data = performanceMetrics.exportMetrics();
    
    // Copy to clipboard
    navigator.clipboard.writeText(data).then(() => {
      haptics.success();
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">📊 Performance Metrics</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Lazy Loading Metrics</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-400">Total Loads</p>
            <p className="text-2xl font-bold">{metrics.lazyLoadMetrics}</p>
          </div>
          <div>
            <p className="text-gray-400">Cached Loads</p>
            <p className="text-2xl font-bold text-green-400">{metrics.cachedLoads}</p>
          </div>
          <div>
            <p className="text-gray-400">Average Load Time</p>
            <p className="text-2xl font-bold">
              {formatDuration(metrics.averageLazyLoadTime)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Cache Hit Rate</p>
            <p className="text-2xl font-bold">
              {metrics.lazyLoadMetrics > 0 
                ? `${Math.round((metrics.cachedLoads / metrics.lazyLoadMetrics) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
        
        {metrics.fastestLoad && (
          <div className="mb-2">
            <p className="text-sm text-gray-400">Fastest Load</p>
            <p className="text-green-400">
              {metrics.fastestLoad.name}: {formatDuration(metrics.fastestLoad.duration || 0)}
              {metrics.fastestLoad.cached && ' (cached)'}
            </p>
          </div>
        )}
        
        {metrics.slowestLoad && (
          <div>
            <p className="text-sm text-gray-400">Slowest Load</p>
            <p className="text-yellow-400">
              {metrics.slowestLoad.name}: {formatDuration(metrics.slowestLoad.duration || 0)}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <button
          onClick={handleTestLazyLoad}
          disabled={isTracking}
          className={`w-full p-4 rounded-lg font-semibold ${
            isTracking 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isTracking ? '⏳ Testing...' : '🧪 Test Lazy Loading'}
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleClearMetrics}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
          >
            🗑️ Clear Metrics
          </button>
          
          <button
            onClick={handleExportMetrics}
            className="p-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            📋 Export Data
          </button>
        </div>
      </div>

      <div className="p-4 bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">ℹ️ Performance Tracking</h3>
        <ul className="text-sm space-y-1">
          <li>• Tracks lazy loading performance automatically</li>
          <li>• Identifies cached vs fresh loads</li>
          <li>• Measures load times for optimization</li>
          <li>• Stores metrics for trend analysis</li>
          <li>• Mobile device info included in exports</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 Mobile Performance Targets</h3>
        <ul className="text-sm space-y-1">
          <li className="text-green-400">• Initial load: &lt;100ms (cached)</li>
          <li className="text-yellow-400">• First load: &lt;500ms (3G)</li>
          <li className="text-orange-400">• Heavy modules: &lt;1s</li>
          <li className="text-gray-400">• Total app load: &lt;3s</li>
        </ul>
      </div>
    </div>
  );
};