import React, { useState, useEffect } from 'react';
import { turnManager } from '@game/mechanics/TurnManager';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

export const TurnDisplay: React.FC = () => {
  const { setPhase } = useGameStore();
  const [turnSummary, setTurnSummary] = useState(turnManager.getTurnSummary());
  const [showPhaseInfo, setShowPhaseInfo] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTurnSummary(turnManager.getTurnSummary());
      const time = turnManager.getRemainingPhaseTime();
      setRemainingTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAdvancePhase = () => {
    const newPhase = turnManager.advancePhase();
    setPhase(newPhase);
    haptics.success();
    audio.success();
    
    // Show phase info briefly
    setShowPhaseInfo(true);
    setTimeout(() => setShowPhaseInfo(false), 3000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = (phase: string): string => {
    const icons: Record<string, string> = {
      'Planning Phase': '📋',
      'Booking Phase': '🎫',
      'Show Night': '🎸',
      'Aftermath': '💰',
    };
    return icons[phase] || '📌';
  };

  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      'Planning Phase': 'bg-blue-600',
      'Booking Phase': 'bg-punk-600',
      'Show Night': 'bg-green-600',
      'Aftermath': 'bg-yellow-600',
    };
    return colors[phase] || 'bg-metal-700';
  };

  return (
    <>
      {/* Main Turn Display */}
      <div 
        className="bg-metal-900/90 rounded-lg p-3 space-y-2"
        data-tutorial="turn-display"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPhaseIcon(turnSummary.phase)}</span>
            <div>
              <h3 className="font-bold text-sm">Turn {turnSummary.turn}</h3>
              <p className="text-xs text-metal-400">{turnSummary.phase}</p>
            </div>
          </div>
          
          {remainingTime !== null && (
            <div className="text-right">
              <p className="text-xs text-metal-500">Time Left</p>
              <p className="font-mono font-bold text-sm text-yellow-400">
                {formatTime(remainingTime)}
              </p>
            </div>
          )}
        </div>

        {/* Phase Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-metal-500">Phase Progress</span>
            <span className="text-metal-400">{Math.round(turnSummary.progress * 100)}%</span>
          </div>
          <div className="w-full bg-metal-800 rounded-full h-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getPhaseColor(turnSummary.phase)}`}
              style={{ width: `${turnSummary.progress * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setShowPhaseInfo(!showPhaseInfo)}
            className="text-xs text-metal-400 hover:text-white transition-colors"
          >
            {showPhaseInfo ? 'Hide Info' : 'Phase Info'}
          </button>
          
          {turnSummary.canAdvance && (
            <button
              onClick={handleAdvancePhase}
              className="punk-button text-xs px-3 py-1"
            >
              {turnSummary.nextPhase === 'Next Turn' ? 'End Turn' : `Next: ${turnSummary.nextPhase}`}
            </button>
          )}
        </div>

        {/* Phase Info Dropdown */}
        {showPhaseInfo && (
          <div className="pt-2 border-t border-metal-800">
            <p className="text-xs text-metal-300 mb-2">{turnSummary.phaseDescription}</p>
            <div className="flex flex-wrap gap-1">
              {getPhaseActions(turnSummary.phase).map((action, i) => (
                <span key={i} className="text-xs bg-metal-800 px-2 py-1 rounded">
                  {action}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Phase Transition Overlay */}
      {showPhaseInfo && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-black/80 rounded-lg p-6 animate-fade-in">
            <div className="text-center">
              <div className="text-5xl mb-3">{getPhaseIcon(turnSummary.phase)}</div>
              <h2 className="text-2xl font-bold mb-2">{turnSummary.phase}</h2>
              <p className="text-metal-300">{turnSummary.phaseDescription}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to get available actions for each phase
function getPhaseActions(phase: string): string[] {
  const actions: Record<string, string[]> = {
    'Planning Phase': ['Check Stats', 'Browse Bands', 'Scout Venues'],
    'Booking Phase': ['Drag to Book', 'Check Synergies', 'Set Prices'],
    'Show Night': ['Watch Results', 'Handle Events', 'Collect Revenue'],
    'Aftermath': ['Pay Bills', 'Buy Upgrades', 'Recruit Talent'],
  };
  return actions[phase] || [];
}