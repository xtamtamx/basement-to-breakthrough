import React from 'react';
import { useAudio } from '@utils/audio';
import { haptics } from '@utils/mobile';
import { useGameStore } from '@stores/gameStore';
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { ColorblindMode } from '@game/types';
import { useColorblind } from '@contexts/ColorblindContext';
import { X, Volume2, VolumeX, RefreshCw, Info, Gamepad2, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { enabled, volume, setEnabled, setVolume } = useAudio();
  const { resetGame, currentRound } = useGameStore();
  const { mode: colorblindMode, setMode: setColorblindMode } = useColorblind();

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    haptics.light();
  };

  const toggleSound = () => {
    setEnabled(!enabled);
    haptics.light();
  };

  const handleAbandonRun = () => {
    if (confirm(`Are you sure you want to abandon this run? You're on round ${currentRound}.`)) {
      resetGame();
      window.location.reload();
      haptics.success();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #ec4899',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ec4899',
            margin: 0
          }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Close settings"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Audio Settings */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ec4899',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              Audio
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sound Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <span style={{ color: '#ffffff' }}>Sound Effects</span>
                <button
                  onClick={toggleSound}
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: enabled ? '#ec4899' : '#4b5563',
                    position: 'relative',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  aria-label={enabled ? 'Disable sound' : 'Enable sound'}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: enabled ? '26px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    transition: 'left 0.2s'
                  }} />
                </button>
              </div>

              {/* Volume Slider */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#9ca3af' }}>Volume</span>
                  <span style={{ color: '#ffffff', fontWeight: '600' }}>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={!enabled}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
                    outline: 'none',
                    opacity: enabled ? 1 : 0.5,
                    cursor: enabled ? 'pointer' : 'default'
                  }}
                />
              </div>
            </div>
          </section>

          {/* Accessibility */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ec4899',
              marginBottom: '16px'
            }}>Accessibility</h3>
            
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '14px',
                marginBottom: '8px'
              }}>Colorblind Mode</label>
              <select
                value={colorblindMode}
                onChange={(e) => {
                  setColorblindMode(e.target.value as ColorblindMode);
                  haptics.light();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value={ColorblindMode.OFF}>Off</option>
                <option value={ColorblindMode.PROTANOPIA}>Protanopia (Red-Blind)</option>
                <option value={ColorblindMode.DEUTERANOPIA}>Deuteranopia (Green-Blind)</option>
                <option value={ColorblindMode.TRITANOPIA}>Tritanopia (Blue-Blind)</option>
                <option value={ColorblindMode.ACHROMATOPSIA}>Achromatopsia (Total)</option>
              </select>
            </div>
          </section>

          {/* Tutorial */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ec4899',
              marginBottom: '16px'
            }}>Tutorial</h3>
            <button
              onClick={() => {
                tutorialManager.resetProgress();
                tutorialManager.startTutorial();
                onClose();
                haptics.success();
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            >
              <RefreshCw size={16} />
              Restart Tutorial
            </button>
          </section>

          {/* Game Info */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ec4899',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Info size={20} />
              About
            </h3>
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 4px 0' }}>Basement to Breakthrough v0.1.0</p>
              <p style={{ margin: 0 }}>A roguelike underground music scene builder</p>
            </div>
          </section>

          {/* Controls Guide */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ec4899',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Gamepad2 size={20} />
              Controls
            </h3>
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: '1.8'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>• Tap bands and venues to select them</p>
              <p style={{ margin: '0 0 8px 0' }}>• Use navigation tabs to switch between views</p>
              <p style={{ margin: '0 0 8px 0' }}>• Swipe left/right to navigate quickly</p>
              <p style={{ margin: 0 }}>• Tap the floating button to advance turns</p>
            </div>
          </section>

          {/* Danger Zone */}
          <section style={{
            borderTop: '1px solid #374151',
            paddingTop: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ef4444',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={20} />
              Danger Zone
            </h3>
            <button
              onClick={handleAbandonRun}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Abandon Run (Round {currentRound})
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};