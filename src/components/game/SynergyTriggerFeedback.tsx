/**
 * SynergyTriggerFeedback - Shows visual feedback when synergies trigger
 */

import React, { useState, useEffect } from 'react';
import { SynergyTriggerResult } from '@game/mechanics/SynergyManager';

interface SynergyTriggerFeedbackProps {
  results: SynergyTriggerResult[];
  onComplete?: () => void;
}

export const SynergyTriggerFeedback: React.FC<SynergyTriggerFeedbackProps> = ({
  results,
  onComplete,
}) => {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const triggeredResults = results.filter(r => r.triggered);

  useEffect(() => {
    if (triggeredResults.length === 0) {
      onComplete?.();
      return;
    }

    // Show each triggered synergy for 1.5 seconds
    const timer = setTimeout(() => {
      if (visibleIndex < triggeredResults.length - 1) {
        setVisibleIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
        setTimeout(() => onComplete?.(), 300);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [visibleIndex, triggeredResults.length, onComplete]);

  if (triggeredResults.length === 0 || !isVisible) {
    return null;
  }

  const current = triggeredResults[visibleIndex];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        key={current.synergyId}
        className="bg-gradient-to-r from-yellow-900/90 to-orange-900/90
                   border-2 border-yellow-500 rounded-xl px-6 py-4
                   shadow-2xl shadow-yellow-500/30 animate-synergy-trigger"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-pulse">✨</div>
          <div>
            <div className="text-lg font-bold text-yellow-300">
              {current.synergyName} Triggered!
            </div>
            <div className="text-sm text-yellow-100/80 space-y-1">
              {current.effects.map((effect, i) => (
                <div key={i}>{effect.description}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {triggeredResults.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {triggeredResults.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === visibleIndex
                  ? 'bg-yellow-400 scale-125'
                  : i < visibleIndex
                  ? 'bg-yellow-600'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Floating effect numbers that appear over resources
 */
interface FloatingEffectProps {
  value: number;
  type: 'money' | 'reputation' | 'fans' | 'stress';
  position?: { x: number; y: number };
}

export const FloatingEffect: React.FC<FloatingEffectProps> = ({
  value,
  type,
  position,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const isPositive = value > 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const prefix = isPositive ? '+' : '';

  const typeIcons = {
    money: '$',
    reputation: '⭐',
    fans: '👥',
    stress: '😰',
  };

  const style = position
    ? { left: position.x, top: position.y }
    : {};

  return (
    <div
      className={`fixed ${colorClass} font-bold text-lg pointer-events-none
                  animate-float-up z-50`}
      style={style}
    >
      {prefix}{value} {typeIcons[type]}
    </div>
  );
};

export default SynergyTriggerFeedback;
