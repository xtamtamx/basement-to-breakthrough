import React, { useState } from 'react';
import {
  ProgressionPath,
  PathChoice,
  progressionPathSystem
} from '../../../game/mechanics/ProgressionPathSystem';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import { gameAudio } from '@utils/gameAudio';

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
      gameAudio.pathChoice(); // the sellout↔DIY fork deserves a decision sting
      setShowConfirmation(false);
      setSelectedChoice(null);
    }
  };

  // Shared page chrome so all three states share the void bg + header rhythm.
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0a0814',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#171327',
    borderBottom: '2px solid #0a0814',
    boxShadow: 'inset 0 2px 0 0 #3a2f5c',
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
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: '#ffffff',
            margin: 0,
            letterSpacing: 0
          }}>Progression Paths</h2>
          <p style={{ fontSize: '12px', color: '#b9b3d6', margin: '3px 0 0' }}>
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
          <div className="snes-panel snes-panel--gold" style={{
            padding: '24px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', lineHeight: 1 }}>🔒</div>
            <h2 className="snes-pixel" style={{
              fontSize: '12px',
              color: '#ffd23f',
              margin: '0 0 12px',
              letterSpacing: 0,
              lineHeight: 1.5
            }}>Progression Paths Locked</h2>
            <p style={{
              color: '#b9b3d6',
              margin: '0 0 20px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>{requirements.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requirements.requirements.map(req => {
                const pct = Math.min((req.current / req.required) * 100, 100);
                const done = req.current >= req.required;
                return (
                  <div key={req.name} className="snes-panel-inset" style={{
                    padding: '14px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '8px' }}>
                      <h3 className="snes-pixel" style={{
                        color: done ? '#3ad17e' : '#f72585',
                        margin: 0,
                        fontSize: '9px',
                        letterSpacing: 0,
                        lineHeight: 1.4
                      }}>{req.name}</h3>
                      <span className="snes-pixel" style={{
                        color: done ? '#3ad17e' : '#ffffff',
                        fontSize: '9px',
                        letterSpacing: 0,
                        flexShrink: 0
                      }}>
                        {req.current} / {req.required}
                      </span>
                    </div>
                    <p style={{
                      color: '#b9b3d6',
                      margin: '0 0 10px',
                      fontSize: '12px',
                      lineHeight: 1.4
                    }}>{req.description}</p>
                    <div style={{
                      backgroundColor: '#0f0b1e',
                      height: '10px',
                      border: '2px solid #0a0814',
                      boxShadow: 'inset 1px 1px 0 0 #0a0814',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          backgroundColor: done ? '#3ad17e' : '#f72585',
                          height: '100%',
                          width: `${pct}%`,
                          transition: 'none'
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
          <h2 className="snes-pixel" style={{
            fontSize: '12px',
            color: '#ffffff',
            margin: 0,
            letterSpacing: 0
          }}>Choose Your Path</h2>
          <p style={{
            fontSize: '12px',
            color: '#b9b3d6',
            margin: '3px 0 0'
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
            <div
              className="snes-panel"
              style={{
                border: '2px solid #3ad17e',
                boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #3ad17e',
                padding: '18px',
                cursor: 'pointer',
                transition: 'none'
              }}
              onClick={() => handlePathChoice(ProgressionPath.DIY_COLLECTIVE)}
            >
              <div style={{ fontSize: '34px', marginBottom: '10px', lineHeight: 1 }}>✊</div>
              <h2 className="snes-pixel" style={{
                fontSize: '13px',
                color: '#ffffff',
                margin: '0 0 8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>DIY Collective</h2>
              <p style={{
                color: '#b9b3d6',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>For the scene, by the scene</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 className="snes-pixel" style={{
                  color: '#3ad17e',
                  margin: '0 0 8px',
                  fontSize: '8px',
                  letterSpacing: 0
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Lower costs, stronger community</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Higher authenticity & reputation</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Unlock co-op venues & mutual aid</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>All-ages shows & safer spaces</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 className="snes-pixel" style={{
                  color: '#ff5c57',
                  margin: '0 0 8px',
                  fontSize: '8px',
                  letterSpacing: 0
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Lower profits & growth caps</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Limited venue options</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Consensus decision-making</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Constant struggle against gentrification</li>
                </ul>
              </div>

              <p style={{
                color: '#6f6796',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Keep it real, keep it community"</p>
            </div>

            <div
              className="snes-panel"
              style={{
                border: '2px solid #f72585',
                boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #f72585',
                padding: '18px',
                cursor: 'pointer',
                transition: 'none'
              }}
              onClick={() => handlePathChoice(ProgressionPath.CORPORATE)}
            >
              <div style={{ fontSize: '34px', marginBottom: '10px', lineHeight: 1 }}>💰</div>
              <h2 className="snes-pixel" style={{
                fontSize: '13px',
                color: '#ffffff',
                margin: '0 0 8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>Corporate Circuit</h2>
              <p style={{
                color: '#b9b3d6',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>Music as a business</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 className="snes-pixel" style={{
                  color: '#3ad17e',
                  margin: '0 0 8px',
                  fontSize: '8px',
                  letterSpacing: 0
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Higher profits & faster growth</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Professional venues & equipment</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Sponsorship opportunities</li>
                  <li style={{ color: '#ffffff', marginBottom: '3px', fontSize: '12px' }}>Data-driven booking</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 className="snes-pixel" style={{
                  color: '#ff5c57',
                  margin: '0 0 8px',
                  fontSize: '8px',
                  letterSpacing: 0
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Loss of scene credibility</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Unhappy bands & fans</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Soulless optimization</li>
                  <li style={{ color: '#b9b3d6', marginBottom: '3px', fontSize: '12px' }}>Becoming what you once hated</li>
                </ul>
              </div>

              <p style={{
                color: '#6f6796',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Sell out to sell out shows"</p>
            </div>
          </div>

          <p className="snes-panel-inset" style={{
            textAlign: 'center',
            color: '#ffd23f',
            borderColor: '#ffd23f',
            boxShadow: 'inset 2px 2px 0 0 #0a0814, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #ffd23f',
            fontWeight: 600,
            margin: 0,
            padding: '10px 12px',
            fontSize: '12px'
          }}>⚠️ This choice is permanent and will define your entire journey</p>
        </div>
      </div>
    );
  }

  const isDIY = progression.currentPath === ProgressionPath.DIY_COLLECTIVE;
  const pathAccent = isDIY ? '#3ad17e' : '#f72585';

  // Show progression tree
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ ...headerStyle, textAlign: 'center' }}>
        <h2 className="snes-pixel" style={{
          fontSize: '12px',
          color: pathAccent,
          margin: 0,
          letterSpacing: 0
        }}>
          {isDIY ? '✊ DIY Collective' : '💰 Corporate Circuit'}
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#b9b3d6',
          margin: '3px 0 0'
        }}>Tier {progression.currentTier} of 5</p>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Active Effects Summary */}
        <div className="snes-panel" style={{
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h3 className="snes-pixel" style={{
            color: '#b9b3d6',
            margin: '0 0 10px',
            fontSize: '8px',
            letterSpacing: 0
          }}>Active Path Effects</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {currentEffects.modifiers.ticketPriceMultiplier !== 1 && (
              <span className="snes-chip snes-pixel" style={{
                fontSize: '8px',
                letterSpacing: 0,
                color: '#ffffff'
              }}>
                Ticket Prices: {(currentEffects.modifiers.ticketPriceMultiplier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.bandHappinessModifier !== 0 && (
              <span className="snes-chip snes-pixel" style={{
                fontSize: '8px',
                letterSpacing: 0,
                color: '#ffffff'
              }}>
                Band Happiness: {currentEffects.modifiers.bandHappinessModifier > 0 ? '+' : ''}{(currentEffects.modifiers.bandHappinessModifier * 100).toFixed(0)}%
              </span>
            )}
            {currentEffects.modifiers.venueRentMultiplier !== 1 && (
              <span className="snes-chip snes-pixel" style={{
                fontSize: '8px',
                letterSpacing: 0,
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
            <h2 className="snes-pixel" style={{
              color: '#b9b3d6',
              margin: '0 0 10px 2px',
              fontSize: '8px',
              letterSpacing: 0
            }}>Available Choices</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px'
            }}>
              {availableChoices.map(choice => (
                <div
                  key={choice.id}
                  className="snes-panel"
                  style={{
                    border: choice.permanent ? '2px solid #ffd23f' : undefined,
                    boxShadow: choice.permanent
                      ? 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #ffd23f'
                      : undefined,
                    padding: '14px',
                    paddingTop: choice.permanent ? '30px' : '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'none'
                  }}
                  onClick={() => handleChoiceClick(choice)}
                >
                  {choice.permanent && (
                    <span className="snes-pixel" style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#ffd23f',
                      color: '#3a2e00',
                      padding: '4px 6px',
                      border: '2px solid #0a0814',
                      fontSize: '7px',
                      letterSpacing: 0
                    }}>PERMANENT</span>
                  )}
                  <h3 className="snes-pixel" style={{
                    color: '#ffffff',
                    margin: '0 0 8px',
                    fontSize: '9px',
                    letterSpacing: 0,
                    lineHeight: 1.4
                  }}>{choice.name}</h3>
                  <p style={{
                    color: '#b9b3d6',
                    margin: '0 0 10px',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}>{choice.description}</p>
                  <p style={{
                    color: '#6f6796',
                    margin: 0,
                    fontStyle: 'italic',
                    fontSize: '11px'
                  }}>"{choice.satiricalFlavor}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Choices */}
        {progression.unlockedChoices.length > 0 && (
          <div>
            <h2 className="snes-pixel" style={{
              color: '#b9b3d6',
              margin: '0 0 10px 2px',
              fontSize: '8px',
              letterSpacing: 0
            }}>Completed Choices</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {progression.unlockedChoices.map(choiceId => {
                const choice = availableChoices.find(c => c.id === choiceId);
                return choice ? (
                  <div key={choiceId} className="snes-panel" style={{
                    padding: '10px 14px',
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
                      <span style={{ color: '#3ad17e' }}>✓</span>
                      {choice.name}
                    </span>
                    <span className="snes-chip snes-pixel" style={{
                      color: '#b9b3d6',
                      fontSize: '7px',
                      letterSpacing: 0,
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
      {showConfirmation && selectedChoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(8, 6, 18, 0.86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowConfirmation(false)}
        >
          <div
            className="snes-panel"
            style={{
              borderTop: '3px solid #f72585',
              boxShadow: 'inset 2px 0 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
              padding: '20px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
              maxWidth: '400px',
              width: '100%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="snes-pixel" style={{
              color: '#b9b3d6',
              margin: '0 0 12px',
              fontSize: '8px',
              letterSpacing: 0
            }}>Confirm Choice</h2>
            <h3 className="snes-pixel" style={{
              color: '#f72585',
              margin: '0 0 12px',
              fontSize: '11px',
              letterSpacing: 0,
              lineHeight: 1.4
            }}>{selectedChoice.name}</h3>
            <p style={{
              color: '#b9b3d6',
              margin: '0 0 16px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>{selectedChoice.description}</p>

            {selectedChoice.permanent && (
              <p className="snes-panel-inset" style={{
                borderColor: '#ffd23f',
                boxShadow: 'inset 2px 2px 0 0 #0a0814, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #ffd23f',
                color: '#ffd23f',
                padding: '10px',
                fontWeight: 600,
                fontSize: '12px',
                margin: '0 0 12px'
              }}>
                ⚠️ This choice is PERMANENT and cannot be undone!
              </p>
            )}

            {selectedChoice.conflicts && selectedChoice.conflicts.length > 0 && (
              <p className="snes-panel-inset" style={{
                borderColor: '#ffd23f',
                boxShadow: 'inset 2px 2px 0 0 #0a0814, inset -2px -2px 0 0 #0a0814, 0 0 0 1px #ffd23f',
                color: '#ffd23f',
                padding: '10px',
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
                className="snes-btn snes-btn--ghost"
                style={{
                  flex: 1,
                  minHeight: '44px'
                }}
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="snes-btn"
                style={{
                  flex: 1,
                  minHeight: '44px'
                }}
                onClick={confirmChoice}
              >
                Confirm Choice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
