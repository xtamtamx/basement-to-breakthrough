import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RandomEvent, EventChoice, EventRarity } from '@game/mechanics/RandomEventManager';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface RandomEventModalProps {
  event: RandomEvent | null;
  onChoice: (choiceId: string) => void;
}

export const RandomEventModal: React.FC<RandomEventModalProps> = ({ event, onChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const { money, reputation, connections, stress } = useGameStore();
  
  if (!event) return null;
  
  const getRarityColor = (rarity: EventRarity) => {
    switch (rarity) {
      case EventRarity.COMMON: return 'var(--pixel-gray)';
      case EventRarity.UNCOMMON: return 'var(--pixel-cyan)';
      case EventRarity.RARE: return 'var(--pixel-purple)';
      case EventRarity.LEGENDARY: return 'var(--pixel-yellow)';
    }
  };
  
  const canAffordChoice = (choice: EventChoice): boolean => {
    if (!choice.requirements) return true;
    
    const resources: Record<string, number> = { money, reputation, connections, stress };
    return choice.requirements.every(req => resources[req.resource] >= req.amount);
  };
  
  const handleChoiceSelect = (choiceId: string) => {
    haptics.success();
    audio.play('success');
    setSelectedChoice(choiceId);
    setTimeout(() => {
      onChoice(choiceId);
      setSelectedChoice(null);
    }, 300);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="glass-panel p-6 max-w-lg w-full"
          style={{
            borderColor: getRarityColor(event.rarity),
            boxShadow: `0 0 30px ${getRarityColor(event.rarity)}`
          }}
        >
          {/* Event Header */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-block mb-2"
            >
              <span className="pixel-badge" style={{ 
                backgroundColor: getRarityColor(event.rarity),
                fontSize: '10px'
              }}>
                {event.rarity}
              </span>
            </motion.div>
            
            <h2 className="pixel-text pixel-text-xl mb-2" style={{ 
              color: getRarityColor(event.rarity) 
            }}>
              {event.name}
            </h2>
            
            <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
              {event.description}
            </p>
          </div>
          
          {/* Immediate Effects (if no choices) */}
          {(!event.choices || event.choices.length === 0) && event.effects.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-panel-inset p-3 mb-4"
            >
              <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-gray)' }}>
                EFFECTS:
              </p>
              {event.effects.map((effect, i) => (
                <p key={i} className="pixel-text pixel-text-xs" style={{ 
                  color: typeof effect.value === 'number' && effect.value > 0 ? 'var(--pixel-green)' : 'var(--pixel-red)' 
                }}>
                  {typeof effect.value === 'number' && effect.value > 0 ? '+' : ''}{effect.value} {effect.type.toUpperCase()}
                </p>
              ))}
            </motion.div>
          )}
          
          {/* Choices */}
          {event.choices && event.choices.length > 0 && (
            <div className="space-y-3">
              {event.choices.map((choice, index) => {
                const affordable = canAffordChoice(choice);
                const isSelected = selectedChoice === choice.id;
                
                return (
                  <motion.button
                    key={choice.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={affordable ? { scale: 1.02 } : {}}
                    whileTap={affordable ? { scale: 0.98 } : {}}
                    onClick={() => affordable && handleChoiceSelect(choice.id)}
                    disabled={!affordable}
                    className={`w-full glass-panel p-3 text-left transition-all ${
                      affordable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    } ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    <p className="pixel-text pixel-text-sm mb-2" style={{ 
                      color: affordable ? 'var(--pixel-yellow)' : 'var(--pixel-gray)' 
                    }}>
                      {choice.text}
                    </p>
                    
                    {/* Requirements */}
                    {choice.requirements && (
                      <div className="mb-2">
                        {choice.requirements.map((req, i) => (
                          <p key={i} className="pixel-text pixel-text-xs" style={{ 
                            color: resources[req.resource] >= req.amount ? 'var(--pixel-green)' : 'var(--pixel-red)' 
                          }}>
                            Requires: {req.amount} {req.resource}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Effects Preview */}
                    <div className="space-y-1">
                      {choice.effects.map((effect, i) => (
                        <p key={i} className="pixel-text pixel-text-xs" style={{ 
                          color: typeof effect.value === 'number' && effect.value > 0 ? 'var(--pixel-green)' : 'var(--pixel-orange)' 
                        }}>
                          {typeof effect.value === 'number' && effect.value > 0 ? '+' : ''}{effect.value} {effect.type}
                        </p>
                      ))}
                    </div>
                    
                    {/* Success Chance */}
                    {choice.successChance !== undefined && choice.successChance < 1 && (
                      <p className="pixel-text pixel-text-xs mt-1" style={{ 
                        color: 'var(--pixel-cyan)' 
                      }}>
                        {Math.round(choice.successChance * 100)}% chance of success
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
          
          {/* Continue Button (for events with no choices) */}
          {(!event.choices || event.choices.length === 0) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => onChoice('continue')}
              className="w-full pixel-button p-3 mt-4"
              style={{ backgroundColor: 'var(--pixel-cyan)' }}
            >
              <span className="pixel-text">CONTINUE</span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Resource display helper
const resources: Record<string, number> = {};