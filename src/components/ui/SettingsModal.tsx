import React from 'react';
import { useAudio } from '@utils/audio';
import { useFxQuality } from '@utils/fxQuality';
import { haptics } from '@utils/mobile';
import { useGameStore } from '@stores/gameStore';
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { ColorblindMode } from '@game/types';
import { useColorblind } from '@hooks/useColorblind';
import { X, Volume2, VolumeX, RefreshCw, Info, Gamepad2, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { enabled, volume, setEnabled, setVolume } = useAudio();
  const { quality: fxQuality, cycleQuality: cycleFx } = useFxQuality();
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

  // Reusable inline tokens for the SNES look
  const sectionHeader: React.CSSProperties = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '11px',
    letterSpacing: 0,
    color: '#f72585',
    marginTop: 0,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
  };

  const insetCard: React.CSSProperties = {
    backgroundColor: '#0f0b1e',
    border: '2px solid #0a0814',
    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
    borderRadius: 0,
    padding: '16px',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(8, 6, 18, 0.86)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#171327',
        borderRadius: 0,
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #0a0814',
        borderTop: '3px solid #f72585',
        boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #2a2350',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            letterSpacing: 0,
            color: '#f72585',
            margin: 0
          }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f1a3a',
              border: '2px solid #0a0814',
              borderRadius: 0,
              color: '#b9b3d6',
              cursor: 'pointer',
              padding: 0
            }}
            aria-label="Close settings"
          >
            <X size={20} />
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
            <h3 style={sectionHeader}>
              {enabled ? <Volume2 size={18} color="#f72585" /> : <VolumeX size={18} color="#f72585" />}
              Audio
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sound Toggle */}
              <div style={{
                ...insetCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '9px',
                  letterSpacing: 0,
                  color: '#ffffff'
                }}>Sound Effects</span>
                <button
                  onClick={toggleSound}
                  style={{
                    width: '52px',
                    height: '28px',
                    minWidth: '44px',
                    minHeight: '44px',
                    borderRadius: 0,
                    backgroundColor: enabled ? '#f72585' : '#0a0814',
                    position: 'relative',
                    border: '2px solid #0a0814',
                    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                  aria-label={enabled ? 'Disable sound' : 'Enable sound'}
                >
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: enabled ? '28px' : '4px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: 0,
                    border: '2px solid #0a0814',
                    transition: 'none'
                  }} />
                </button>
              </div>

              {/* Visual FX quality (Pixi neon-mote overlay) */}
              <div style={{
                ...insetCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '9px',
                  letterSpacing: 0,
                  color: '#ffffff'
                }}>Visual FX</span>
                <button
                  onClick={() => { cycleFx(); haptics.light(); }}
                  style={{
                    minWidth: '64px',
                    minHeight: '44px',
                    padding: '0 14px',
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    color: fxQuality === 'ultra' ? '#f72585' : fxQuality === 'high' ? '#3ad17e' : fxQuality === 'low' ? '#ffd23f' : '#6f6796',
                    backgroundColor: '#0a0814',
                    border: '2px solid #0a0814',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                    cursor: 'pointer',
                    transition: 'none'
                  }}
                  aria-label={`Visual effects quality: ${fxQuality}. Tap to change.`}
                >{fxQuality}</button>
              </div>

              {/* Volume Slider */}
              <div style={insetCard}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '9px',
                    letterSpacing: 0,
                    color: '#b9b3d6'
                  }}>Volume</span>
                  <span style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '9px',
                    letterSpacing: 0,
                    color: '#ffffff'
                  }}>{Math.round(volume * 100)}%</span>
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
                    height: '8px',
                    borderRadius: 0,
                    background: `linear-gradient(to right, #f72585 0%, #f72585 ${volume * 100}%, #0a0814 ${volume * 100}%, #0a0814 100%)`,
                    border: '2px solid #0a0814',
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
            <h3 style={sectionHeader}>Accessibility</h3>

            <div style={insetCard}>
              <label style={{
                display: 'block',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                letterSpacing: 0,
                color: '#b9b3d6',
                marginBottom: '12px'
              }}>Colorblind Mode</label>
              <select
                value={colorblindMode}
                onChange={(e) => {
                  setColorblindMode(e.target.value as ColorblindMode);
                  haptics.light();
                }}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '12px',
                  backgroundColor: '#0a0814',
                  border: '2px solid #0a0814',
                  boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                  borderRadius: 0,
                  color: '#ffffff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value={ColorblindMode.OFF}>Off</option>
                <option value={ColorblindMode.PROTANOPIA}>Protanopia (Red-Blind)</option>
                <option value={ColorblindMode.DEUTERANOPIA}>Deuteranopia (Green-Blind)</option>
                <option value={ColorblindMode.TRITANOPIA}>Tritanopia (Blue-Blind)</option>
              </select>
            </div>
          </section>

          {/* Tutorial */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>Tutorial</h3>
            <button
              onClick={() => {
                tutorialManager.resetProgress();
                tutorialManager.startTutorial();
                onClose();
                haptics.success();
              }}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '12px',
                backgroundColor: '#1f1a3a',
                color: '#ffffff',
                border: '2px solid #0a0814',
                boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                borderRadius: 0,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                letterSpacing: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'none'
              }}
            >
              <RefreshCw size={16} color="#ffffff" />
              Restart Tutorial
            </button>
          </section>

          {/* Game Info */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>
              <Info size={18} color="#f72585" />
              About
            </h3>
            <div style={{
              ...insetCard,
              fontSize: '13px',
              color: '#b9b3d6',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 4px 0' }}>Settling Up v0.1.0</p>
              <p style={{ margin: 0 }}>A roguelike underground music scene builder</p>
            </div>
          </section>

          {/* Controls Guide */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>
              <Gamepad2 size={18} color="#f72585" />
              Controls
            </h3>
            <div style={{
              ...insetCard,
              fontSize: '13px',
              color: '#b9b3d6',
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
            borderTop: '2px solid #2a2350',
            paddingTop: '24px'
          }}>
            <h3 style={{ ...sectionHeader, color: '#ff5c57' }}>
              <AlertTriangle size={18} color="#ff5c57" />
              Danger Zone
            </h3>
            <button
              onClick={handleAbandonRun}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '12px',
                backgroundColor: '#ff5c57',
                color: '#3a0a08',
                border: '2px solid #0a0814',
                boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
                borderRadius: 0,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                letterSpacing: 0,
                cursor: 'pointer',
                transition: 'none'
              }}
            >
              Abandon Run (Round {currentRound})
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
