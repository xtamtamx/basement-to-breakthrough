import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface StressReliefOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  stressReduction: number;
  icon: string;
}

const stressReliefOptions: StressReliefOption[] = [
  {
    id: 'meditation',
    name: 'Band Meditation',
    description: 'The band takes time to meditate and find inner peace',
    cost: 0,
    stressReduction: 10,
    icon: '🧘'
  },
  {
    id: 'party',
    name: 'Throw a Party',
    description: 'Let loose with friends and fans',
    cost: 50,
    stressReduction: 25,
    icon: '🎉'
  },
  {
    id: 'vacation',
    name: 'Mini Vacation',
    description: 'Take a break from the scene',
    cost: 100,
    stressReduction: 40,
    icon: '🏖️'
  },
  {
    id: 'therapy',
    name: 'Group Therapy',
    description: 'Professional help for band dynamics',
    cost: 200,
    stressReduction: 60,
    icon: '🛋️'
  }
];

interface StressReliefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StressReliefModal: React.FC<StressReliefModalProps> = ({
  isOpen,
  onClose
}) => {
  const { money, stress, addMoney, addStress } = useGameStore();

  const handleStressRelief = (option: StressReliefOption) => {
    if (money >= option.cost) {
      addMoney(-option.cost);
      addStress(-option.stressReduction);
      haptics.success();
      audio.play('powerUp');
      devLog.log(`Stress reduced by ${option.stressReduction}%`);
      onClose();
    } else {
      haptics.error();
      audio.play('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel p-6 max-w-md w-full"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="pixel-text pixel-text-lg" style={{ color: 'var(--pixel-cyan)' }}>
                STRESS RELIEF
              </h2>
              <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-gray)' }}>
                CURRENT STRESS: {stress}%
              </p>
            </div>
            <button
              onClick={onClose}
              className="pixel-button p-2"
              style={{ backgroundColor: 'var(--pixel-red)' }}
            >
              <span className="pixel-text">X</span>
            </button>
          </div>

          {/* Budget Display */}
          <div className="glass-panel p-3 mb-4">
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
              BUDGET: ${money}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {stressReliefOptions.map(option => {
              const canAfford = money >= option.cost;
              const effectiveReduction = Math.min(option.stressReduction, stress);

              return (
                <motion.div
                  key={option.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="glass-panel p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <h3 className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                        {option.name}
                      </h3>
                      <p className="pixel-text pixel-text-xs mt-1" style={{ color: 'var(--pixel-gray)' }}>
                        {option.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
                          -{effectiveReduction}% STRESS
                        </p>
                        <p className="pixel-text pixel-text-xs" style={{ 
                          color: canAfford ? 'var(--pixel-green)' : 'var(--pixel-red)' 
                        }}>
                          {option.cost === 0 ? 'FREE' : `$${option.cost}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStressRelief(option)}
                    disabled={!canAfford || stress === 0}
                    className={`w-full pixel-button p-2 mt-3 ${
                      canAfford && stress > 0
                        ? 'hover:scale-105' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    style={{ 
                      backgroundColor: canAfford && stress > 0
                        ? 'var(--pixel-green)' 
                        : 'var(--pixel-gray)'
                    }}
                  >
                    <span className="pixel-text pixel-text-xs">
                      {stress === 0 ? 'NO STRESS' : canAfford ? 'CHOOSE' : 'INSUFFICIENT FUNDS'}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-4 glass-panel p-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-cyan)' }}>
              💡 TIP: HIGH STRESS AFFECTS SHOW PERFORMANCE!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};