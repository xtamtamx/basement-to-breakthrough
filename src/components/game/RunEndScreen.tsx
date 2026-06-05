/**
 * RunEndScreen - Displays the end-of-run results
 */

import React from 'react';
import { RunEndState, RunEndReason } from '@game/constants/runConstants';

interface RunEndScreenProps {
  result: RunEndState;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const RESULT_CONFIGS: Record<RunEndReason, {
  title: string;
  subtitle: string;
  icon: string;
  bgClass: string;
  borderClass: string;
}> = {
  BREAKTHROUGH_WIN: {
    title: 'BREAKTHROUGH!',
    subtitle: 'You made it from the basement to the big time!',
    icon: '🎸',
    bgClass: 'bg-gradient-to-b from-yellow-900 to-orange-900',
    borderClass: 'border-yellow-500',
  },
  BURNOUT_LOSS: {
    title: 'BURNOUT',
    subtitle: 'The stress was too much. You need a break from the scene.',
    icon: '😵',
    bgClass: 'bg-gradient-to-b from-red-900 to-gray-900',
    borderClass: 'border-red-500',
  },
  EVICTION_LOSS: {
    title: 'EVICTED',
    subtitle: 'Can\'t pay rent, can\'t book shows. Time to move back home.',
    icon: '🏠',
    bgClass: 'bg-gradient-to-b from-gray-800 to-gray-900',
    borderClass: 'border-gray-500',
  },
  FADE_OUT_LOSS: {
    title: 'FADE OUT',
    subtitle: 'The scene moved on without you. Another forgotten name.',
    icon: '👻',
    bgClass: 'bg-gradient-to-b from-purple-900 to-gray-900',
    borderClass: 'border-purple-500',
  },
};

export const RunEndScreen: React.FC<RunEndScreenProps> = ({
  result,
  onPlayAgain,
  onMainMenu,
}) => {
  const config = RESULT_CONFIGS[result.reason];
  const isWin = result.reason === 'BREAKTHROUGH_WIN';

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div
        className={`${config.bgClass} ${config.borderClass} border-4 rounded-2xl
                   max-w-lg w-full shadow-2xl animate-fadeIn overflow-hidden`}
      >
        {/* Header */}
        <div className="p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">{config.icon}</div>
          <h1 className={`text-4xl font-black mb-2 ${isWin ? 'text-yellow-300' : 'text-white'}`}>
            {config.title}
          </h1>
          <p className="text-gray-300 text-lg">{config.subtitle}</p>
        </div>

        {/* Stats */}
        <div className="bg-black/40 p-6">
          <h2 className="text-sm uppercase text-gray-400 mb-4 font-bold">Final Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <StatBox
              label="Turn"
              value={result.turn}
              suffix="/35"
              highlight={result.turn >= 31}
            />
            <StatBox
              label="Shows Played"
              value={result.finalStats.showsPlayed}
              icon="🎤"
            />
            <StatBox
              label="Reputation"
              value={result.finalStats.reputation}
              icon="⭐"
              highlight={result.finalStats.reputation >= 80}
            />
            <StatBox
              label="Fans"
              value={result.finalStats.fans}
              icon="👥"
              highlight={result.finalStats.fans >= 500}
            />
            <StatBox
              label="Money"
              value={result.finalStats.money}
              prefix="$"
              negative={result.finalStats.money < 0}
            />
            <StatBox
              label="Stress"
              value={result.finalStats.stress}
              suffix="/100"
              negative={result.finalStats.stress >= 80}
            />
          </div>
        </div>

        {/* Win condition reminder */}
        {!isWin && (
          <div className="bg-black/20 px-6 py-4 text-center">
            <p className="text-sm text-gray-400">
              Win by reaching <span className="text-yellow-400">80 reputation</span> and{' '}
              <span className="text-yellow-400">500 fans</span> before turn 35
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onMainMenu}
            className="flex-1 py-4 px-6 bg-gray-700 hover:bg-gray-600
                     text-white rounded-xl font-bold transition-colors
                     touch-manipulation min-h-[48px]"
          >
            Main Menu
          </button>
          <button
            onClick={onPlayAgain}
            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-colors
                       touch-manipulation min-h-[48px]
                       ${isWin
                         ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                         : 'bg-green-600 hover:bg-green-500 text-white'
                       }`}
          >
            {isWin ? 'Play Again' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: string;
  highlight?: boolean;
  negative?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  prefix = '',
  suffix = '',
  icon,
  highlight,
  negative,
}) => {
  const valueClass = negative
    ? 'text-red-400'
    : highlight
    ? 'text-yellow-400'
    : 'text-white';

  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="text-xs text-gray-400 uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueClass} flex items-center gap-1`}>
        {icon && <span className="text-base">{icon}</span>}
        {prefix}{value.toLocaleString()}{suffix}
      </div>
    </div>
  );
};

export default RunEndScreen;
