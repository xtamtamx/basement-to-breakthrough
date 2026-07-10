import React, { useState } from 'react';
import {
  ProgressionPath,
  PathChoice,
  progressionPathSystem
} from '../../../game/mechanics/ProgressionPathSystem';
import { useGameStore } from '@stores/gameStore';
import { captureRuntimeSnapshot } from '@game/persistence/runtimeSnapshot';
import { haptics } from '@utils/mobile';
import { gameAudio } from '@utils/gameAudio';
import { SnesModal } from '@components/ui/SnesModal';
import { PixelIcon } from '@components/ui/PixelIcon';

// Only LIVE numbers ever render in the confirm modal: the one-shot effects
// makeChoice actually applies. The catalog's modifiers/unlocks/restrictions are
// NOT wired into the engine and must stay invisible until they are.
const immediateEffectChips = (choice: PathChoice): Array<{ label: string; good: boolean }> => {
  const im = choice.effects.immediate;
  if (!im) return [];
  const chips: Array<{ label: string; good: boolean }> = [];
  if (im.money) chips.push({ label: `${im.money > 0 ? '+' : '−'}$${Math.abs(im.money)}`, good: im.money > 0 });
  if (im.reputation) chips.push({ label: `${im.reputation > 0 ? '+' : ''}${im.reputation} Rep`, good: im.reputation > 0 });
  if (im.fans) chips.push({ label: `${im.fans > 0 ? '+' : ''}${im.fans} Fans`, good: im.fans > 0 });
  if (im.stress) chips.push({ label: `${im.stress > 0 ? '+' : ''}${im.stress} Stress`, good: im.stress < 0 });
  return chips;
};

export const ProgressionView: React.FC = () => {
  const { fans, reputation, showHistory } = useGameStore();
  const [selectedChoice, setSelectedChoice] = useState<PathChoice | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // The permanent DIY/Corporate fork must never fire on a single stray tap —
  // it goes through the same confirm-modal beat as the tier choices.
  const [pendingPath, setPendingPath] = useState<ProgressionPath | null>(null);

  const isUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length
  });

  const progression = progressionPathSystem.getProgression();
  const availableChoices = progressionPathSystem.getAvailableChoices();

  const handlePathChoice = (path: ProgressionPath) => {
    if (progressionPathSystem.choosePath(path)) {
      haptics.success();
      gameAudio.pathChoice(); // the path-lock moment gets the same decision sting as tier confirms
      // Persist the singleton change NOW — choosePath mutates an off-store
      // singleton; without re-snapshotting, a refresh reverts the path while any
      // granted resources stay spent (re-collectable = exploit).
      useGameStore.setState({ runtimeSnapshot: captureRuntimeSnapshot() });
    }
    setPendingPath(null);
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
      // makeChoice grants persisted resources AND mutates the singleton — snapshot
      // now so a refresh can't revert the choice while keeping the granted bonus.
      useGameStore.setState({ runtimeSnapshot: captureRuntimeSnapshot() });
      setShowConfirmation(false);
      setSelectedChoice(null);
    }
  };

  // Shared page chrome so all three states share the void bg + header rhythm.
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--snes-void)',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'var(--snes-bg)',
    borderBottom: '2px solid var(--snes-void)',
    boxShadow: 'inset 0 2px 0 0 var(--snes-edge-lt)',
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
            color: 'var(--snes-ink)',
            margin: 0,
            letterSpacing: 0
          }}>Progression Paths</h2>
          <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: '3px 0 0' }}>
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
            <div style={{ marginBottom: '10px', lineHeight: 1, color: 'var(--snes-gold)' }}>
              <PixelIcon name="lock" size={40} />
            </div>
            <h2 className="snes-pixel" style={{
              fontSize: '12px',
              color: 'var(--snes-gold)',
              margin: '0 0 12px',
              letterSpacing: 0,
              lineHeight: 1.5
            }}>Progression Paths Locked</h2>
            <p style={{
              color: 'var(--snes-ink-dim)',
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
                        color: done ? 'var(--snes-green)' : 'var(--snes-magenta)',
                        margin: 0,
                        fontSize: '11px',
                        letterSpacing: 0,
                        lineHeight: 1.4
                      }}>{req.name}</h3>
                      <span className="snes-pixel" style={{
                        color: done ? 'var(--snes-green)' : 'var(--snes-ink)',
                        fontSize: '11px',
                        letterSpacing: 0,
                        flexShrink: 0
                      }}>
                        {req.current} / {req.required}
                      </span>
                    </div>
                    <p style={{
                      color: 'var(--snes-ink-dim)',
                      margin: '0 0 10px',
                      fontSize: '12px',
                      lineHeight: 1.4
                    }}>{req.description}</p>
                    <div style={{
                      backgroundColor: 'var(--snes-bg-2)',
                      height: '10px',
                      border: '2px solid var(--snes-void)',
                      boxShadow: 'inset 1px 1px 0 0 var(--snes-void)',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          backgroundColor: done ? 'var(--snes-green)' : 'var(--snes-magenta)',
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
            color: 'var(--snes-ink)',
            margin: 0,
            letterSpacing: 0
          }}>Choose Your Path</h2>
          <p style={{
            fontSize: '12px',
            color: 'var(--snes-ink-dim)',
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
                border: '2px solid var(--snes-green)',
                padding: '18px',
                transition: 'none'
              }}
            >
              <div style={{ marginBottom: '10px', lineHeight: 1, color: 'var(--snes-green)' }}>
                <PixelIcon name="community" size={34} />
              </div>
              <h2 className="snes-pixel" style={{
                fontSize: '13px',
                color: 'var(--snes-ink)',
                margin: '0 0 8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>DIY Collective</h2>
              <p style={{
                color: 'var(--snes-ink-dim)',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>For the scene, by the scene</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 className="snes-pixel" style={{
                  color: 'var(--snes-green)',
                  margin: '0 0 8px',
                  fontSize: '11px',
                  letterSpacing: 0
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Purist bands cut your booking fees</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Every choice deepens your cred</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>The city grows DIY around you</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>All-ages shows & safer spaces</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 className="snes-pixel" style={{
                  color: 'var(--snes-red)',
                  margin: '0 0 8px',
                  fontSize: '11px',
                  letterSpacing: 0
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Commercial acts charge no-name rates</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Sponsor money never touches your hands</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Consensus decision-making</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Constant struggle against gentrification</li>
                </ul>
              </div>

              <p style={{
                color: 'var(--snes-ink-mute)',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Keep it real, keep it community"</p>

              <button
                className="snes-btn"
                style={{ width: '100%', minHeight: '44px', marginTop: '14px' }}
                onClick={() => { haptics.light(); setPendingPath(ProgressionPath.DIY_COLLECTIVE); }}
              >
                Choose This Path
              </button>
            </div>

            <div
              className="snes-panel"
              style={{
                border: '2px solid var(--snes-magenta)',
                padding: '18px',
                transition: 'none'
              }}
            >
              <div style={{ marginBottom: '10px', lineHeight: 1, color: 'var(--snes-magenta)' }}>
                <PixelIcon name="corporate" size={34} />
              </div>
              <h2 className="snes-pixel" style={{
                fontSize: '13px',
                color: 'var(--snes-ink)',
                margin: '0 0 8px',
                letterSpacing: 0,
                lineHeight: 1.4
              }}>Corporate Circuit</h2>
              <p style={{
                color: 'var(--snes-ink-dim)',
                margin: '0 0 14px',
                fontSize: '12px',
                fontStyle: 'italic'
              }}>Music as a business</p>

              <div style={{ marginBottom: '14px' }}>
                <h3 className="snes-pixel" style={{
                  color: 'var(--snes-green)',
                  margin: '0 0 8px',
                  fontSize: '11px',
                  letterSpacing: 0
                }}>Path Benefits</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Sponsor kickbacks trim booking fees</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Commercial acts give you careerist rates</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Sponsorship cash injections</li>
                  <li style={{ color: 'var(--snes-ink)', marginBottom: '3px', fontSize: '12px' }}>Data-driven booking</li>
                </ul>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <h3 className="snes-pixel" style={{
                  color: 'var(--snes-red)',
                  margin: '0 0 8px',
                  fontSize: '11px',
                  letterSpacing: 0
                }}>Path Challenges</h3>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Purist bands charge you to slum it</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Loss of scene credibility</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Soulless optimization</li>
                  <li style={{ color: 'var(--snes-ink-dim)', marginBottom: '3px', fontSize: '12px' }}>Becoming what you once hated</li>
                </ul>
              </div>

              <p style={{
                color: 'var(--snes-ink-mute)',
                margin: '12px 0 0',
                fontStyle: 'italic',
                textAlign: 'center',
                fontSize: '12px'
              }}>"Sell out to sell out shows"</p>

              <button
                className="snes-btn"
                style={{ width: '100%', minHeight: '44px', marginTop: '14px' }}
                onClick={() => { haptics.light(); setPendingPath(ProgressionPath.CORPORATE); }}
              >
                Choose This Path
              </button>
            </div>
          </div>

          <p className="snes-panel-inset" style={{
            textAlign: 'center',
            color: 'var(--snes-gold)',
            borderColor: 'var(--snes-gold)',
            fontWeight: 600,
            margin: 0,
            padding: '10px 12px',
            fontSize: '12px'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PixelIcon name="warning" size={12} />
              This choice is permanent and will define your entire journey
            </span>
          </p>
        </div>

        {/* Path confirmation — the permanent fork never commits on a single tap */}
        {pendingPath !== null && (
          <SnesModal
            title="Confirm Path"
            ariaLabel="Confirm path choice"
            maxWidth={400}
            accent={pendingPath === ProgressionPath.DIY_COLLECTIVE ? 'var(--snes-green)' : 'var(--snes-magenta)'}
            onClose={() => setPendingPath(null)}
            footer={
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="snes-btn snes-btn--ghost"
                  style={{ flex: 1, minHeight: '44px' }}
                  onClick={() => setPendingPath(null)}
                >
                  Cancel
                </button>
                <button
                  className="snes-btn"
                  style={{ flex: 1, minHeight: '44px' }}
                  onClick={() => handlePathChoice(pendingPath)}
                >
                  Confirm Path
                </button>
              </div>
            }
          >
            <h3 className="snes-pixel" style={{
              color: pendingPath === ProgressionPath.DIY_COLLECTIVE ? 'var(--snes-green)' : 'var(--snes-magenta)',
              margin: '0 0 12px',
              fontSize: '11px',
              letterSpacing: 0,
              lineHeight: 1.4
            }}>
              {pendingPath === ProgressionPath.DIY_COLLECTIVE ? 'DIY Collective' : 'Corporate Circuit'}
            </h3>
            <p style={{
              color: 'var(--snes-ink-dim)',
              margin: '0 0 16px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              {pendingPath === ProgressionPath.DIY_COLLECTIVE
                ? 'For the scene, by the scene — purist bands play for less, but sponsor money will never touch your hands.'
                : 'Music as a business — sponsors and commercial acts cut you deals, while the purists charge you extra to slum it.'}
            </p>
            <p className="snes-panel-inset" style={{
              borderColor: 'var(--snes-gold)',
              color: 'var(--snes-gold)',
              padding: '10px',
              fontWeight: 600,
              fontSize: '12px',
              margin: 0
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="warning" size={12} />
                This choice is PERMANENT and cannot be undone!
              </span>
            </p>
          </SnesModal>
        )}
      </div>
    );
  }

  const isDIY = progression.currentPath === ProgressionPath.DIY_COLLECTIVE;
  const pathAccent = isDIY ? 'var(--snes-green)' : 'var(--snes-magenta)';

  // Show progression tree
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ ...headerStyle, textAlign: 'center' }}>
        <h2 className="snes-pixel" style={{
          fontSize: '12px',
          color: pathAccent,
          margin: 0,
          letterSpacing: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <PixelIcon name={isDIY ? 'community' : 'corporate'} size={14} />
          {isDIY ? 'DIY Collective' : 'Corporate Circuit'}
        </h2>
        <p style={{
          fontSize: '12px',
          color: 'var(--snes-ink-dim)',
          margin: '3px 0 0'
        }}>Tier {progression.currentTier} of 5</p>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* How the path actually lands — one-shot payouts + the Scene Identity
            axis. No multiplier chips: nothing ongoing is wired into the engine,
            and this panel must never advertise a number that isn't live. */}
        <div className="snes-panel" style={{
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h3 className="snes-pixel" style={{
            color: 'var(--snes-ink-dim)',
            margin: '0 0 8px',
            fontSize: '11px',
            letterSpacing: 0
          }}>How Your Path Works</h3>
          <p style={{
            color: 'var(--snes-ink-dim)',
            margin: 0,
            fontSize: '12px',
            lineHeight: 1.5
          }}>
            Every choice pays out once — then pushes your Scene Identity toward{' '}
            <span style={{ color: pathAccent, fontWeight: 600 }}>{isDIY ? 'DIY' : 'sellout'}</span>.
            Band fees, the city, and how the scene treats you all follow where you lean.
          </p>
        </div>

        {/* Available Choices */}
        {availableChoices.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 className="snes-pixel" style={{
              color: 'var(--skin-on-void-dim)',
              margin: '0 0 10px 2px',
              fontSize: '11px',
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
                    border: choice.permanent ? '2px solid var(--snes-gold)' : undefined,
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
                      backgroundColor: 'var(--snes-gold)',
                      color: '#1e1509',
                      padding: '4px 6px',
                      border: '2px solid var(--snes-void)',
                      fontSize: '9px',
                      letterSpacing: 0
                    }}>PERMANENT</span>
                  )}
                  <h3 className="snes-pixel" style={{
                    color: 'var(--snes-ink)',
                    margin: '0 0 8px',
                    fontSize: '12px',
                    letterSpacing: 0,
                    lineHeight: 1.4
                  }}>{choice.name}</h3>
                  <p style={{
                    color: 'var(--snes-ink-dim)',
                    margin: '0 0 10px',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}>{choice.description}</p>
                  <p style={{
                    color: 'var(--snes-ink-mute)',
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
              color: 'var(--skin-on-void-dim)',
              margin: '0 0 10px 2px',
              fontSize: '11px',
              letterSpacing: 0
            }}>Completed Choices</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {progression.unlockedChoices.map(choiceId => {
                // Raw catalog lookup — unlocked choices are filtered OUT of
                // getAvailableChoices(), so searching availableChoices here
                // rendered the run's whole history as nothing.
                const choice = progressionPathSystem.getChoiceById(choiceId);
                return choice ? (
                  <div key={choiceId} className="snes-panel" style={{
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      color: 'var(--snes-ink)',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ color: 'var(--snes-green)' }}>✓</span>
                      {choice.name}
                    </span>
                    <span className="snes-chip snes-pixel" style={{
                      color: 'var(--snes-ink-dim)',
                      fontSize: '9px',
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
        <SnesModal
          title="Confirm Choice"
          ariaLabel="Confirm choice"
          maxWidth={400}
          onClose={() => setShowConfirmation(false)}
          footer={
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="snes-btn snes-btn--ghost"
                style={{ flex: 1, minHeight: '44px' }}
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="snes-btn"
                style={{ flex: 1, minHeight: '44px' }}
                onClick={confirmChoice}
              >
                Confirm Choice
              </button>
            </div>
          }
        >
          <h3 className="snes-pixel" style={{
            color: 'var(--snes-magenta)',
            margin: '0 0 12px',
            fontSize: '11px',
            letterSpacing: 0,
            lineHeight: 1.4
          }}>{selectedChoice.name}</h3>
          <p style={{
            color: 'var(--snes-ink-dim)',
            margin: '0 0 12px',
            fontSize: '13px',
            lineHeight: 1.5
          }}>{selectedChoice.description}</p>

          {/* The REAL payload — one-shot effects + the identity push, nothing else. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '0 0 16px' }}>
            {immediateEffectChips(selectedChoice).map(chip => (
              <span key={chip.label} className="snes-chip snes-pixel" style={{
                fontSize: '11px',
                letterSpacing: 0,
                color: chip.good ? 'var(--snes-green)' : 'var(--snes-red)'
              }}>{chip.label}</span>
            ))}
            <span className="snes-chip snes-pixel" style={{
              fontSize: '11px',
              letterSpacing: 0,
              color: pathAccent
            }}>Identity → {isDIY ? 'DIY' : 'Sellout'}</span>
          </div>

          {selectedChoice.permanent && (
            <p className="snes-panel-inset" style={{
              borderColor: 'var(--snes-gold)',
              color: 'var(--snes-gold)',
              padding: '10px',
              fontWeight: 600,
              fontSize: '12px',
              margin: '0 0 12px'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="warning" size={12} />
                This choice is PERMANENT and cannot be undone!
              </span>
            </p>
          )}

          {selectedChoice.conflicts && selectedChoice.conflicts.length > 0 && (
            <p className="snes-panel-inset" style={{
              borderColor: 'var(--snes-gold)',
              color: 'var(--snes-gold)',
              padding: '10px',
              fontWeight: 600,
              fontSize: '12px',
              margin: '0 0 12px'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="warning" size={12} />
                This choice conflicts with other options
              </span>
            </p>
          )}
        </SnesModal>
      )}
    </div>
  );
};
