import React, { useState, useEffect } from 'react';
import { FPSMonitor } from './FPSMonitor';
import { haptics } from '@utils/haptics';
import { audio } from '@utils/audio';

interface StressTestConfig {
  renderCount: number;
  animationCount: number;
  soundFrequency: number;
  updateFrequency: number;
}

export const PerformanceTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [config, setConfig] = useState<StressTestConfig>({
    renderCount: 100,
    animationCount: 20,
    soundFrequency: 100,
    updateFrequency: 16
  });
  
  const [elements, setElements] = useState<number[]>([]);
  const [animatingElements, setAnimatingElements] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isRunning) return;
    
    // Create elements
    setElements(Array.from({ length: config.renderCount }, (_, i) => i));
    
    // Animation interval
    const animationInterval = setInterval(() => {
      const newAnimating = new Set<number>();
      for (let i = 0; i < config.animationCount; i++) {
        newAnimating.add(Math.floor(Math.random() * config.renderCount));
      }
      setAnimatingElements(newAnimating);
    }, config.updateFrequency);
    
    // Sound interval
    const soundInterval = setInterval(() => {
      audio.play('tap');
    }, config.soundFrequency);
    
    // Haptic interval
    const hapticInterval = setInterval(() => {
      haptics.light();
    }, 500);
    
    return () => {
      clearInterval(animationInterval);
      clearInterval(soundInterval);
      clearInterval(hapticInterval);
    };
  }, [isRunning, config]);

  const handleStart = () => {
    setIsRunning(true);
    haptics.medium();
  };

  const handleStop = () => {
    setIsRunning(false);
    setElements([]);
    setAnimatingElements(new Set());
    haptics.medium();
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <FPSMonitor position="top-right" targetFPS={60} showGraph={true} />
      
      <h1 className="text-2xl font-bold mb-6">🚀 Performance Stress Test</h1>
      
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Render Elements: {config.renderCount}</label>
            <input
              type="range"
              min="10"
              max="1000"
              value={config.renderCount}
              onChange={(e) => setConfig(prev => ({ ...prev, renderCount: parseInt(e.target.value) }))}
              disabled={isRunning}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-1">Animating Elements: {config.animationCount}</label>
            <input
              type="range"
              min="1"
              max="100"
              value={config.animationCount}
              onChange={(e) => setConfig(prev => ({ ...prev, animationCount: parseInt(e.target.value) }))}
              disabled={isRunning}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-1">Sound Frequency: {config.soundFrequency}ms</label>
            <input
              type="range"
              min="50"
              max="1000"
              value={config.soundFrequency}
              onChange={(e) => setConfig(prev => ({ ...prev, soundFrequency: parseInt(e.target.value) }))}
              disabled={isRunning}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6 space-y-4">
        <button
          onClick={isRunning ? handleStop : handleStart}
          className={`w-full p-4 rounded-lg font-semibold ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? '⏹️ Stop Test' : '▶️ Start Test'}
        </button>
      </div>
      
      {/* Stress test elements */}
      <div className="relative h-96 bg-gray-800 rounded-lg overflow-hidden">
        {elements.map(i => (
          <div
            key={i}
            className={`absolute w-8 h-8 rounded transition-all duration-300 ${
              animatingElements.has(i) 
                ? 'bg-red-500 scale-150' 
                : 'bg-blue-500 scale-100'
            }`}
            style={{
              left: `${(i % 20) * 5}%`,
              top: `${Math.floor(i / 20) * 5}%`,
              transform: animatingElements.has(i) 
                ? `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px) scale(1.5)`
                : 'scale(1)'
            }}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">ℹ️ Performance Testing</h3>
        <ul className="text-sm space-y-1">
          <li>• Tests rendering performance with many DOM elements</li>
          <li>• Simulates animations and state updates</li>
          <li>• Includes audio playback stress testing</li>
          <li>• Monitor FPS to see performance impact</li>
          <li>• Target: 60 FPS on mobile devices</li>
        </ul>
      </div>
    </div>
  );
};