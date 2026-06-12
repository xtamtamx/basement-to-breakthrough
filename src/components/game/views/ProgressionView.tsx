import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ProgressionPath, 
  PathChoice,
  progressionPathSystem 
} from '../../../game/mechanics/ProgressionPathSystem';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';

export const ProgressionView: React.FC = () => {
  const { fans, reputation, showHistory } = useGameStore();
  const [selectedChoice, setSelectedChoice] = useState<PathChoice | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const isUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length
  });
  
  const progression = progressionPathSystem.getProgression();
  const availableChoices = progressionPathSystem.getAvailableChoices();
  const currentEffects = progressionPathSystem.getCurrentEffects();
  
  const handlePathChoice = (path: ProgressionPath) => {
    if (progressionPathSystem.choosePath(path)) {
      haptics.success();
    }
  };
  
  const handleChoiceClick = (choice: PathChoice) => {
    setSelectedChoice(choice);
    setShowConfirmation(true);
    haptics.light();
  };
  
  const confirmChoice = () => {
    if (selectedChoice && progressionPathSystem.makeChoice(selectedChoice.id)) {
      haptics.success();
      setShowConfirmation(false);
      setSelectedChoice(null);
    }
  };
  
  // Show unlock requirements if not unlocked
  if (!isUnlocked) {
    const requirements = progressionPathSystem.getUnlockRequirements({
      fans,
      reputation,
      totalShows: showHistory.length
    });
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          padding: '8px 12px',
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: 0
          }}>Progression Paths</h2>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            border: '2px solid #374151',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '500px'
          }}>
            <h2 style={{
              fontSize: '20px',
              color: '#ffffff',
              margin: '0 0 12px'
            }}>🔒 Progression Paths Locked</h2>
            <p style={{
              color: '#9ca3af',
              margin: '0 0 24px',
              fontSize: '14px'
            }}>{requirements.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {requirements.requirements.map(req => (
                <div key={req.name} style={{
                  backgroundColor: '#111827',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'left'
                }}>
                  <h3 style={{
                    color: '#ec4899',
                    margin: '0 0 6px',
                    fontSize: '16px'
                  }}>{req.name}</h3>
                  <p style={{
                    color: '#9ca3af',
                    margin: '0 0 10px',
                    fontSize: '13px'
                  }}>{req.description}</p>
                  <div style={{
                    backgroundColor: '#0a0a0a',
                    height: '16px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '6px'
                  }}>
                    <div 
                      style={{
                        backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #dc2626 100%)',
                        height: '100%',
                        width: `${Math.min((req.current / req.required) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span style={{
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {req.current} / {req.required}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show path selection if no path chosen
  if (progression.currentPath === ProgressionPath.NONE) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#111827',
          borderBottom: '1px solid #374151',
          padding: '8px 12px',
          flexShrink: 0,
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: 0
          }}>Choose Your Path</h2>
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            marginTop: '2px'
          }}>This decision will shape the future of your music scene</p>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          paddingBottom: '80px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <motion.div 
              style={{
                backgroundColor: '#1f2937',
                border: '3px solid #dc2626',
                backgroundImage: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePathChoice(ProgressionPath.DIY_COLLECTIVE)}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✊</div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#ffffff',
                margin: '0 0 6px'
              }}>DIY Collective</h2>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 16px',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>For the scene, by the scene</p>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  color: '#ffffff',
                  margin: '0 0 6px',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>Path Benefits:</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Lower costs, stronger community</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Higher authenticity & reputation</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Unlock co-op venues & mutual aid</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>All-ages shows & safer spaces</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  color: '#ffffff',
                  margin: '0 0 6px',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>Path Challenges:</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Lower profits & growth caps</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Limited venue options</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Consensus decision-making</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Constant struggle against gentrification</li>
                </ul>
              </div>
              
              <p style={{
                color: '#6b7280',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Keep it real, keep it community"</p>
            </motion.div>
            
            <motion.div 
              style={{
                backgroundColor: '#1f2937',
                border: '3px solid #8b5cf6',
                backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePathChoice(ProgressionPath.CORPORATE)}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>💰</div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '900',
                color: '#ffffff',
                margin: '0 0 6px'
              }}>Corporate Circuit</h2>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 16px',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>Music as a business</p>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  color: '#ffffff',
                  margin: '0 0 6px',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>Path Benefits:</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Higher profits & faster growth</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Professional venues & equipment</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Sponsorship opportunities</li>
                  <li style={{ color: '#10b981', marginBottom: '3px', fontSize: '12px' }}>Data-driven booking</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  color: '#ffffff',
                  margin: '0 0 6px',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>Path Challenges:</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Loss of scene credibility</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Unhappy bands & fans</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Soulless optimization</li>
                  <li style={{ color: '#ef4444', marginBottom: '3px', fontSize: '12px' }}>Becoming what you once hated</li>
                </ul>
              </div>
              
              <p style={{
                color: '#6b7280',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Sell out to sell out shows"</p>
            </motion.div>
          </div>
          
          <p style={{
            textAlign: 'center',
            color: '#f59e0b',
            fontWeight: '600',
            margin: 0,
            fontSize: '13px'
          }}>⚠️ This choice is permanent and will define your entire journey</p>
        </div>
      </div>
    );
  }
  
  // Show progression tree
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#111827',
        borderBottom: '1px solid #374151',
        padding: '8px 12px',
        flexShrink: 0,
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: progression.currentPath === ProgressionPath.DIY_COLLECTIVE ? '#dc2626' : '#8b5cf6',
          margin: 0
        }}>
          {progression.currentPath === ProgressionPath.DIY_COLLECTIVE ? 'DIY Collective' : 'Corporate Circuit'}
        </h2>
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '2px'
        }}>Tier {progression.currentTier} of 5</p>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        paddingBottom: '80px'
      }}>
        {/* Active Effects Summary */}
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            color: '#ffffff',
            margin: '0 0 8px',
            fontSize: '13px'
          }}>Active Path Effects:</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {currentEffects.modifiers.ticketPriceMultiplier !== 1 && (
              <span style={{
                backgroundColor: '#111827',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#ffffff'
              }}>
                Ticket Prices: {(currentEffects.modifiers.ticketPriceMultiplier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.bandHappinessModifier !== 0 && (
              <span style={{
                backgroundColor: '#111827',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#ffffff'
              }}>
                Band Happiness: {currentEffects.modifiers.bandHappinessModifier > 0 ? '+' : ''}{(currentEffects.modifiers.bandHappinessModifier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.venueRentMultiplier !== 1 && (
              <span style={{
                backgroundColor: '#111827',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#ffffff'
              }}>
                Venue Costs: {(currentEffects.modifiers.venueRentMultiplier * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        
        {/* Available Choices */}
        {availableChoices.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              color: '#ffffff',
              margin: '0 0 12px',
              fontSize: '16px'
            }}>Available Choices:</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {availableChoices.map(choice => (
                <motion.div 
                  key={choice.id}
                  style={{
                    backgroundColor: '#1f2937',
                    border: choice.permanent ? '2px solid #f59e0b' : '2px solid #374151',
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoiceClick(choice)}
                >
                  <h3 style={{
                    color: '#ffffff',
                    margin: '0 0 6px',
                    fontSize: '15px'
                  }}>{choice.name}</h3>
                  <p style={{
                    color: '#9ca3af',
                    margin: '0 0 10px',
                    fontSize: '12px'
                  }}>{choice.description}</p>
                  {choice.permanent && (
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#f59e0b',
                      color: '#0a0a0a',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}>PERMANENT</span>
                  )}
                  <p style={{
                    color: '#6b7280',
                    margin: 0,
                    fontStyle: 'italic',
                    fontSize: '11px'
                  }}>"{choice.satiricalFlavor}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Completed Choices */}
        {progression.unlockedChoices.length > 0 && (
          <div>
            <h2 style={{
              color: '#ffffff',
              margin: '0 0 12px',
              fontSize: '16px'
            }}>Completed Choices:</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {progression.unlockedChoices.map(choiceId => {
                const choice = availableChoices.find(c => c.id === choiceId);
                return choice ? (
                  <div key={choiceId} style={{
                    backgroundColor: '#1f2937',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>{choice.name}</span>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '12px'
                    }}>Tier {choice.tier}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedChoice && (
          <motion.div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div 
              style={{
                backgroundColor: '#1f2937',
                border: '2px solid #374151',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{
                color: '#ffffff',
                margin: '0 0 12px',
                fontSize: '18px'
              }}>Confirm Choice</h2>
              <h3 style={{
                color: '#ec4899',
                margin: '0 0 8px',
                fontSize: '16px'
              }}>{selectedChoice.name}</h3>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 16px',
                fontSize: '13px'
              }}>{selectedChoice.description}</p>
              
              {selectedChoice.permanent && (
                <p style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  ⚠️ This choice is PERMANENT and cannot be undone!
                </p>
              )}
              
              {selectedChoice.conflicts && selectedChoice.conflicts.length > 0 && (
                <p style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  ⚠️ This choice conflicts with other options
                </p>
              )}
              
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button 
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    fontSize: '14px',
                    minHeight: '44px'
                  }}
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    fontSize: '14px',
                    minHeight: '44px'
                  }}
                  onClick={confirmChoice}
                >
                  Confirm Choice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};