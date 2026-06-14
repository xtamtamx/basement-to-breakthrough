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

  // Shared page chrome so all three states share the gradient + header rhythm.
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#111827',
    borderBottom: '1px solid #1f2937',
    padding: '10px 14px',
    paddingTop: 'calc(10px + env(safe-area-inset-top))',
    flexShrink: 0
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    paddingBottom: 'calc(88px + env(safe-area-inset-bottom))'
  };

  // Show unlock requirements if not unlocked
  if (!isUnlocked) {
    const requirements = progressionPathSystem.getUnlockRequirements({
      fans,
      reputation,
      totalShows: showHistory.length
    });

    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '0.02em'
          }}>Progression Paths</h2>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '1px 0 0' }}>
            Earn your stripes before the scene lets you pick a lane
          </p>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          paddingBottom: 'calc(88px + env(safe-area-inset-bottom))'
        }}>
          <div style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', lineHeight: 1 }}>🔒</div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 8px'
            }}>Progression Paths Locked</h2>
            <p style={{
              color: '#9ca3af',
              margin: '0 0 20px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>{requirements.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requirements.requirements.map(req => {
                const pct = Math.min((req.current / req.required) * 100, 100);
                const done = req.current >= req.required;
                return (
                  <div key={req.name} style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid #1f2937',
                    borderRadius: '12px',
                    padding: '14px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <h3 style={{
                        color: done ? '#10b981' : '#ec4899',
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700
                      }}>{req.name}</h3>
                      <span style={{
                        color: done ? '#10b981' : '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700
                      }}>
                        {req.current} / {req.required}
                      </span>
                    </div>
                    <p style={{
                      color: '#9ca3af',
                      margin: '0 0 10px',
                      fontSize: '12px',
                      lineHeight: 1.4
                    }}>{req.description}</p>
                    <div style={{
                      backgroundColor: '#1f2937',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          backgroundImage: done
                            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)',
                          height: '100%',
                          width: `${pct}%`,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show path selection if no path chosen
  if (progression.currentPath === ProgressionPath.NONE) {
    return (
      <div style={pageStyle}>
        {/* Header */}
        <div style={{ ...headerStyle, textAlign: 'center' }}>
          <h2 style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '0.02em'
          }}>Choose Your Path</h2>
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            margin: '1px 0 0'
          }}>This decision will shape the future of your music scene</p>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
            <motion.div
              style={{
                backgroundColor: '#111827',
                border: '2px solid #dc2626',
                backgroundImage: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, transparent 70%)',
                borderRadius: '16px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePathChoice(ProgressionPath.DIY_COLLECTIVE)}
            >
              <div style={{ fontSize: '34px', marginBottom: '10px', lineHeight: 1 }}>✊</div>
              <h2 style={{
                fontSize: '19px',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 4px'
              }}>DIY Collective</h2>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>For the scene, by the scene</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 style={{
                  color: '#10b981',
                  margin: '0 0 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Lower costs, stronger community</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Higher authenticity & reputation</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Unlock co-op venues & mutual aid</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>All-ages shows & safer spaces</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  color: '#ef4444',
                  margin: '0 0 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Lower profits & growth caps</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Limited venue options</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Consensus decision-making</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Constant struggle against gentrification</li>
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
                backgroundColor: '#111827',
                border: '2px solid #8b5cf6',
                backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
                borderRadius: '16px',
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePathChoice(ProgressionPath.CORPORATE)}
            >
              <div style={{ fontSize: '34px', marginBottom: '10px', lineHeight: 1 }}>💰</div>
              <h2 style={{
                fontSize: '19px',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 4px'
              }}>Corporate Circuit</h2>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>Music as a business</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 style={{
                  color: '#10b981',
                  margin: '0 0 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Higher profits & faster growth</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Professional venues & equipment</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Sponsorship opportunities</li>
                  <li style={{ color: '#d1d5db', marginBottom: '3px', fontSize: '12px' }}>Data-driven booking</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  color: '#ef4444',
                  margin: '0 0 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Loss of scene credibility</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Unhappy bands & fans</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Soulless optimization</li>
                  <li style={{ color: '#9ca3af', marginBottom: '3px', fontSize: '12px' }}>Becoming what you once hated</li>
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
            fontWeight: 600,
            margin: 0,
            fontSize: '12px'
          }}>⚠️ This choice is permanent and will define your entire journey</p>
        </div>
      </div>
    );
  }

  const isDIY = progression.currentPath === ProgressionPath.DIY_COLLECTIVE;
  const pathAccent = isDIY ? '#dc2626' : '#8b5cf6';

  // Show progression tree
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ ...headerStyle, textAlign: 'center' }}>
        <h2 style={{
          fontSize: '15px',
          fontWeight: 900,
          color: pathAccent,
          margin: 0,
          letterSpacing: '0.02em'
        }}>
          {isDIY ? '✊ DIY Collective' : '💰 Corporate Circuit'}
        </h2>
        <p style={{
          fontSize: '11px',
          color: '#9ca3af',
          margin: '1px 0 0'
        }}>Tier {progression.currentTier} of 5</p>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Active Effects Summary */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            color: '#9ca3af',
            margin: '0 0 8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>Active Path Effects</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {currentEffects.modifiers.ticketPriceMultiplier !== 1 && (
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid #1f2937',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                color: '#ffffff'
              }}>
                Ticket Prices: {(currentEffects.modifiers.ticketPriceMultiplier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.bandHappinessModifier !== 0 && (
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid #1f2937',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                color: '#ffffff'
              }}>
                Band Happiness: {currentEffects.modifiers.bandHappinessModifier > 0 ? '+' : ''}{(currentEffects.modifiers.bandHappinessModifier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.venueRentMultiplier !== 1 && (
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid #1f2937',
                padding: '4px 10px',
                borderRadius: '999px',
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
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              color: '#9ca3af',
              margin: '0 0 10px 2px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>Available Choices</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px'
            }}>
              {availableChoices.map(choice => (
                <motion.div
                  key={choice.id}
                  style={{
                    backgroundColor: '#111827',
                    border: choice.permanent ? '1px solid #f59e0b' : '1px solid #1f2937',
                    borderRadius: '12px',
                    padding: '14px',
                    paddingTop: choice.permanent ? '28px' : '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoiceClick(choice)}
                >
                  {choice.permanent && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#f59e0b',
                      color: '#0a0a0a',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.05em'
                    }}>PERMANENT</span>
                  )}
                  <h3 style={{
                    color: '#ffffff',
                    margin: '0 0 6px',
                    fontSize: '15px',
                    fontWeight: 700
                  }}>{choice.name}</h3>
                  <p style={{
                    color: '#9ca3af',
                    margin: '0 0 10px',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}>{choice.description}</p>
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
              color: '#9ca3af',
              margin: '0 0 10px 2px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>Completed Choices</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {progression.unlockedChoices.map(choiceId => {
                const choice = availableChoices.find(c => c.id === choiceId);
                return choice ? (
                  <div key={choiceId} style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1f2937',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: '#10b981' }}>✓</span>
                      {choice.name}
                    </span>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '11px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid #1f2937',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      flexShrink: 0
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
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
                backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
                border: '1px solid #1f2937',
                borderTop: '2px solid #ec4899',
                borderRadius: '16px',
                padding: '20px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6)'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{
                color: '#9ca3af',
                margin: '0 0 10px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>Confirm Choice</h2>
              <h3 style={{
                color: '#ec4899',
                margin: '0 0 8px',
                fontSize: '17px',
                fontWeight: 800
              }}>{selectedChoice.name}</h3>
              <p style={{
                color: '#9ca3af',
                margin: '0 0 16px',
                fontSize: '13px',
                lineHeight: 1.5
              }}>{selectedChoice.description}</p>

              {selectedChoice.permanent && (
                <p style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '12px',
                  margin: '0 0 12px'
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
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '12px',
                  margin: '0 0 12px'
                }}>
                  ⚠️ This choice conflicts with other options
                </p>
              )}

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '16px'
              }}>
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
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
                    padding: '12px',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
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
