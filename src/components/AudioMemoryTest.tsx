import React, { useState, useRef, useEffect } from 'react';
import { audio } from '@utils/audio';

interface MemoryStats {
  heapUsed?: number;
  heapTotal?: number;
  timestamp: number;
  playCount: number;
}

export const AudioMemoryTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [memoryStats, setMemoryStats] = useState<MemoryStats[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Collect memory stats if available
  const collectMemoryStats = () => {
    const stats: MemoryStats = {
      timestamp: Date.now(),
      playCount
    };

    // Check if we have access to memory info (Chrome/Edge)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      stats.heapUsed = memory.usedJSHeapSize;
      stats.heapTotal = memory.totalJSHeapSize;
    }

    setMemoryStats(prev => [...prev.slice(-50), stats]); // Keep last 50 measurements
  };

  const startStressTest = () => {
    setIsRunning(true);
    setPlayCount(0);
    setMemoryStats([]);

    // Play sounds rapidly to stress test
    playIntervalRef.current = setInterval(() => {
      const sounds = ['tap', 'success', 'error', 'coin', 'achievement'];
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      audio.play(randomSound);
      setPlayCount(prev => prev + 1);
    }, 100); // Play a sound every 100ms

    // Collect memory stats every second
    intervalRef.current = setInterval(() => {
      collectMemoryStats();
    }, 1000);
  };

  const stopStressTest = () => {
    setIsRunning(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStressTest();
    };
  }, []);

  // Calculate memory growth rate
  const getMemoryGrowthRate = () => {
    if (memoryStats.length < 2) return 0;
    
    const first = memoryStats[0];
    const last = memoryStats[memoryStats.length - 1];
    
    if (!first.heapUsed || !last.heapUsed) return 0;
    
    const memoryGrowth = last.heapUsed - first.heapUsed;
    const timeElapsed = (last.timestamp - first.timestamp) / 1000; // seconds
    
    return memoryGrowth / timeElapsed; // bytes per second
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const memoryGrowthRate = getMemoryGrowthRate();
  const lastStats = memoryStats[memoryStats.length - 1];

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔊 Audio Memory Leak Test</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Status</h2>
        <p>Status: {isRunning ? '🔴 Running' : '⚪ Stopped'}</p>
        <p>Sounds Played: {playCount}</p>
        {lastStats?.heapUsed && (
          <>
            <p>Heap Used: {formatBytes(lastStats.heapUsed)}</p>
            <p>Heap Total: {formatBytes(lastStats.heapTotal || 0)}</p>
            <p className={memoryGrowthRate > 100000 ? 'text-red-500' : 'text-green-500'}>
              Memory Growth: {formatBytes(memoryGrowthRate)}/s
            </p>
          </>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <button
          onClick={isRunning ? stopStressTest : startStressTest}
          className={`w-full p-4 rounded-lg font-semibold ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? '⏹️ Stop Stress Test' : '▶️ Start Stress Test'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => audio.play('tap')}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded"
          >
            Tap
          </button>
          <button
            onClick={() => audio.play('success')}
            className="bg-green-600 hover:bg-green-700 p-2 rounded"
          >
            Success
          </button>
          <button
            onClick={() => audio.play('error')}
            className="bg-red-600 hover:bg-red-700 p-2 rounded"
          >
            Error
          </button>
          <button
            onClick={() => audio.play('coin')}
            className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded"
          >
            Coin
          </button>
          <button
            onClick={() => audio.play('achievement')}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded"
          >
            Achievement
          </button>
          <button
            onClick={() => audio.play('cardPickup')}
            className="bg-pink-600 hover:bg-pink-700 p-2 rounded"
          >
            Card
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Memory Stats History</h2>
        {memoryStats.length > 0 ? (
          <div className="text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
            {memoryStats.slice(-10).reverse().map((stat, i) => (
              <div key={stat.timestamp}>
                #{stat.playCount} - {stat.heapUsed ? formatBytes(stat.heapUsed) : 'N/A'}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No data yet. Start the stress test.</p>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">ℹ️ Test Information</h3>
        <ul className="text-sm space-y-1">
          <li>• This test rapidly plays sounds to check for memory leaks</li>
          <li>• Web Audio API oscillators should be garbage collected properly</li>
          <li>• Memory growth rate should stay near 0 MB/s</li>
          <li>• If memory grows continuously, there may be a leak</li>
          <li>• Note: Memory stats only available in Chrome/Edge</li>
        </ul>
      </div>
    </div>
  );
};