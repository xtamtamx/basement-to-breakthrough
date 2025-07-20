import React from 'react';
import { useGameStore } from '@stores/gameStore';

interface ResourceDisplayProps {
  compact?: boolean;
}

export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ compact = false }) => {
  const { money, reputation, fans } = useGameStore();

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-green-400">$</span>
          <span className="font-bold">{money}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-punk-400">★</span>
          <span className="font-bold">{reputation}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">♥</span>
          <span className="font-bold">{fans}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-metal-900/80 rounded-lg p-4 space-y-3">
      <h3 className="font-bold text-lg mb-2">Resources</h3>
      
      {/* Money */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-metal-400 text-sm">Cash</span>
          <span className="text-green-400 font-bold text-lg">${money}</span>
        </div>
        <div className="w-full bg-metal-800 rounded-full h-2">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((money / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Reputation */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-metal-400 text-sm">Reputation</span>
          <span className="text-punk-400 font-bold text-lg">{reputation}</span>
        </div>
        <div className="w-full bg-metal-800 rounded-full h-2">
          <div 
            className="h-full bg-punk-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((reputation / 100) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Fans */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-metal-400 text-sm">Fans</span>
          <span className="text-blue-400 font-bold text-lg">{fans}</span>
        </div>
        <div className="w-full bg-metal-800 rounded-full h-2">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((fans / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-4 pt-3 border-t border-metal-800">
        {money < 50 && (
          <p className="text-xs text-red-400">⚠️ Low on cash!</p>
        )}
        {reputation < 10 && (
          <p className="text-xs text-yellow-400">📢 Build your reputation</p>
        )}
        {fans < 50 && (
          <p className="text-xs text-blue-400">🎤 Grow your fanbase</p>
        )}
      </div>
    </div>
  );
};