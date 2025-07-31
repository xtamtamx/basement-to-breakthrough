import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { haptics } from '@/utils/mobile';
import { 
  PathChoice, 
  PATH_CHOICES,
  calculatePathAlignment,
  applyPathChoice,
  PathAlignment 
} from '@/game/mechanics/PathSystem';

interface PathChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  forcedChoice?: PathChoice; // For story moments
}

export const PathChoiceModal: React.FC<PathChoiceModalProps> = ({
  isOpen,
  onClose,
  forcedChoice
}) => {
  const gameState = useGameStore();
  const [selectedChoice, setSelectedChoice] = useState<PathChoice | null>(null);
  const [showConsequences, setShowConsequences] = useState(false);
  
  const currentDiyPoints = gameState.diyPoints || 0;
  const currentAlignment = calculatePathAlignment(currentDiyPoints);
  
  // Get random choice or use forced one
  const choice = forcedChoice || PATH_CHOICES[Math.floor(Math.random() * PATH_CHOICES.length)];
  
  const handleChoice = (accept: boolean) => {
    if (!accept) {
      // Refusing also has consequences
      const refusalEffects = {
        stress: 5,
        reputation: choice.diyPoints > 0 ? -5 : 5,
        authenticity: choice.diyPoints > 0 ? -10 : 10
      };
      
      // Apply refusal effects
      if (refusalEffects.stress) gameState.addStress(refusalEffects.stress);
      if (refusalEffects.reputation) gameState.addReputation(refusalEffects.reputation);
      
      haptics.medium();
      onClose();
      return;
    }
    
    // Show consequences first
    setSelectedChoice(choice);
    setShowConsequences(true);
    haptics.medium();
  };
  
  const confirmChoice = () => {
    if (!selectedChoice) return;
    
    // Apply the choice effects through game store
    // This would need to be implemented in gameStore
    applyPathChoice(selectedChoice, gameState);
    
    // Apply effects
    if (selectedChoice.immediateEffects.money) {
      gameState.addMoney(selectedChoice.immediateEffects.money);
    }
    if (selectedChoice.immediateEffects.reputation) {
      gameState.addReputation(selectedChoice.immediateEffects.reputation);
    }
    if (selectedChoice.immediateEffects.stress) {
      gameState.addStress(selectedChoice.immediateEffects.stress);
    }
    
    haptics.success();
    onClose();
  };
  
  const getAlignmentColor = (alignment: PathAlignment) => {
    switch (alignment) {
      case PathAlignment.PURE_DIY: return '#10b981';
      case PathAlignment.DIY_LEANING: return '#34d399';
      case PathAlignment.BALANCED: return '#fbbf24';
      case PathAlignment.CORPORATE_LEANING: return '#f97316';
      case PathAlignment.FULL_SELLOUT: return '#ef4444';
      default: return '#fff';
    }
  };
  
  const getDiyPointsColor = (points: number) => {
    if (points > 0) return '#10b981';
    if (points < 0) return '#ef4444';
    return '#fbbf24';
  };
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    backgroundColor: '#000',
    border: '2px solid #fff',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
    fontFamily: 'monospace',
    zIndex: 10000
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 9999
            }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={modalStyle}
          >
            {!showConsequences ? (
              <>
                {/* Choice Presentation */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  padding: '16px',
                  borderBottom: '2px solid #fff'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}>
                    CRITICAL DECISION
                  </h2>
                  <div style={{
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    Your choice will shape the future of the scene
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  {/* Current Status */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: '#111',
                    border: '1px solid #333'
                  }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                      CURRENT PATH
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: getAlignmentColor(currentAlignment),
                      fontWeight: 'bold'
                    }}>
                      {currentAlignment.replace(/_/g, ' ')}
                    </div>
                    <div style={{
                      marginTop: '8px',
                      height: '4px',
                      backgroundColor: '#333',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '-2px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#fff',
                        transform: `translateX(${currentDiyPoints}%)`
                      }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      <span>DIY</span>
                      <span>BALANCED</span>
                      <span>CORPORATE</span>
                    </div>
                  </div>
                  
                  {/* The Choice */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #444'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      color: '#fff',
                      marginBottom: '8px',
                      fontWeight: 'bold'
                    }}>
                      {choice.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#ccc',
                      lineHeight: '1.5',
                      marginBottom: '12px'
                    }}>
                      {choice.description}
                    </p>
                    
                    {/* Immediate Effects */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                        IMMEDIATE EFFECTS:
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {choice.immediateEffects.money && (
                          <span style={{
                            fontSize: '12px',
                            color: choice.immediateEffects.money > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {choice.immediateEffects.money > 0 ? '+' : ''}{choice.immediateEffects.money} MONEY
                          </span>
                        )}
                        {choice.immediateEffects.reputation && (
                          <span style={{
                            fontSize: '12px',
                            color: choice.immediateEffects.reputation > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {choice.immediateEffects.reputation > 0 ? '+' : ''}{choice.immediateEffects.reputation} REP
                          </span>
                        )}
                        {choice.immediateEffects.authenticity && (
                          <span style={{
                            fontSize: '12px',
                            color: choice.immediateEffects.authenticity > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {choice.immediateEffects.authenticity > 0 ? '+' : ''}{choice.immediateEffects.authenticity} AUTH
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Path Impact */}
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#000',
                      border: `1px solid ${getDiyPointsColor(choice.diyPoints)}`,
                      fontSize: '12px',
                      color: getDiyPointsColor(choice.diyPoints),
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {choice.diyPoints > 0 ? '+' : ''}{choice.diyPoints} DIY POINTS
                    </div>
                  </div>
                  
                  {/* Choice Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => handleChoice(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '2px solid #666',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      REFUSE
                    </button>
                    <button
                      onClick={() => handleChoice(true)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: choice.diyPoints > 0 ? '#10b981' : '#ef4444',
                        color: '#fff',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      ACCEPT
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Consequences View */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  padding: '16px',
                  borderBottom: '2px solid #fff'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textTransform: 'uppercase'
                  }}>
                    CONSEQUENCES
                  </h2>
                </div>
                
                <div style={{ padding: '20px' }}>
                  {/* Scene Reaction */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: '#111',
                    border: '1px solid #333'
                  }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      SCENE REACTION:
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: selectedChoice?.longTermEffects.sceneReaction === 'positive' ? '#10b981' :
                             selectedChoice?.longTermEffects.sceneReaction === 'negative' ? '#ef4444' : '#fbbf24'
                    }}>
                      {selectedChoice?.longTermEffects.sceneReaction?.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* New Path Alignment */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    backgroundColor: '#111',
                    border: '1px solid #333'
                  }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      NEW PATH ALIGNMENT:
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: getAlignmentColor(
                        calculatePathAlignment(currentDiyPoints + (selectedChoice?.diyPoints || 0))
                      ),
                      fontWeight: 'bold'
                    }}>
                      {calculatePathAlignment(currentDiyPoints + (selectedChoice?.diyPoints || 0))
                        .replace(/_/g, ' ')}
                    </div>
                  </div>
                  
                  {/* Unlocks/Lockouts */}
                  {selectedChoice?.longTermEffects.unlocksVenues && (
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#10b981'
                    }}>
                      ✓ Unlocks new venue types
                    </div>
                  )}
                  {selectedChoice?.longTermEffects.unlocksBands && (
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#10b981'
                    }}>
                      ✓ Unlocks new bands
                    </div>
                  )}
                  {selectedChoice?.longTermEffects.locksOut && (
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#ef4444'
                    }}>
                      ✗ Locks out some options
                    </div>
                  )}
                  
                  <button
                    onClick={confirmChoice}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#fff',
                      color: '#000',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      marginTop: '20px'
                    }}
                  >
                    ACCEPT CONSEQUENCES
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};