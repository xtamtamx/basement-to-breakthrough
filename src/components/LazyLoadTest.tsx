import React, { useState, useEffect } from 'react';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/haptics';

interface LoadMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  bandsLoaded: number;
  venuesLoaded: number;
}

export const LazyLoadTest: React.FC = () => {
  const [metrics, setMetrics] = useState<LoadMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { allBands, venues, loadInitialGameData } = useGameStore();
  
  // Check initial state
  useEffect(() => {
    console.log('Initial render - Bands:', allBands.length, 'Venues:', venues.length);
  }, []);

  const handleLoadData = async () => {
    setIsLoading(true);
    haptics.medium();
    
    const startTime = performance.now();
    
    try {
      await loadInitialGameData();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setMetrics(prev => [...prev, {
        startTime,
        endTime,
        duration,
        bandsLoaded: useGameStore.getState().allBands.length,
        venuesLoaded: useGameStore.getState().venues.length
      }]);
      
      haptics.success();
    } catch (error) {
      console.error('Failed to load data:', error);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    haptics.medium();
    useGameStore.setState({
      allBands: [],
      venues: [],
      rosterBandIds: []
    });
    setMetrics([]);
  };

  const averageLoadTime = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length
    : 0;

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">⚡ Lazy Loading Test</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current State</h2>
        <p>Bands Loaded: {allBands.length}</p>
        <p>Venues Loaded: {venues.length}</p>
        <p>Status: {isLoading ? '⏳ Loading...' : allBands.length > 0 ? '✅ Loaded' : '⚪ Not loaded'}</p>
      </div>

      <div className="mb-6 space-y-4">
        <button
          onClick={handleLoadData}
          disabled={isLoading}
          className={`w-full p-4 rounded-lg font-semibold ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? '⏳ Loading...' : '🚀 Load Initial Data'}
        </button>
        
        <button
          onClick={handleClearData}
          className="w-full p-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
        >
          🗑️ Clear Data
        </button>
      </div>

      {metrics.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Load Metrics</h2>
          <p className="mb-2">Average Load Time: {averageLoadTime.toFixed(2)}ms</p>
          <div className="space-y-2">
            {metrics.slice(-5).reverse().map((metric, i) => (
              <div key={i} className="text-sm">
                Load #{metrics.length - i}: {metric.duration?.toFixed(2)}ms 
                ({metric.bandsLoaded} bands, {metric.venuesLoaded} venues)
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">ℹ️ Lazy Loading Benefits</h3>
        <ul className="text-sm space-y-1">
          <li>• Initial bundle doesn't include band/venue data</li>
          <li>• Data loaded only when game starts</li>
          <li>• Uses dynamic import() for code splitting</li>
          <li>• Cached after first load to avoid re-fetching</li>
          <li>• Reduces initial load time on mobile networks</li>
        </ul>
      </div>

      {allBands.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Loaded Bands Preview</h3>
          <div className="text-sm space-y-1">
            {allBands.slice(0, 3).map(band => (
              <div key={band.id}>• {band.name}</div>
            ))}
            {allBands.length > 3 && <div>...and {allBands.length - 3} more</div>}
          </div>
        </div>
      )}
    </div>
  );
};