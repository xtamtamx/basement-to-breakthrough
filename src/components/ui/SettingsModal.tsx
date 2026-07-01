import React from 'react';
import { useAudio } from '@utils/audio';
import { gameAudio } from '@utils/gameAudio';
import { useFxQuality } from '@utils/fxQuality';
import { haptics } from '@utils/mobile';
import { useGameStore } from '@stores/gameStore';
import { safeStorage } from '@utils/safeStorage';
import { tutorialManager } from '@game/tutorial/TutorialManager';
import { ColorblindMode } from '@game/types';
import { useColorblind } from '@hooks/useColorblind';
import { Volume2, VolumeX, RefreshCw, Info, Gamepad2, AlertTriangle } from 'lucide-react';
import { SnesModal } from './SnesModal';
import { useConfirm } from './ConfirmDialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { enabled, volume, setEnabled, setVolume } = useAudio();
  const { quality: fxQuality, cycleQuality: cycleFx } = useFxQuality();
  const { resetGame, currentRound } = useGameStore();
  const { mode: colorblindMode, setMode: setColorblindMode } = useColorblind();
  const confirm = useConfirm();

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);        // simpleAudio SFX
    gameAudio.setMusicVolume(newVolume); // music bed + gameAudio SFX (separate manager)
    haptics.light();
  };

  const toggleSound = () => {
    setEnabled(!enabled);        // simpleAudio SFX
    gameAudio.setEnabled(!enabled); // music bed + gameAudio SFX (separate manager)
    haptics.light();
  };

  // Wipe everything back to a fresh-install state — so a playtester (or you, on a
  // dev device with every band long since unlocked) sees the locked roster + the
  // full progression drip from scratch. Clears progress only, not audio/a11y prefs.
  const handleResetProgress = async () => {
    const ok = await confirm({
      title: 'Reset all progress?',
      message: 'Wipes every unlocked band, run, high score, and meta-progression back to a fresh install — for a clean playtest. This cannot be undone.',
      confirmLabel: 'Reset everything',
      danger: true,
    });
    if (!ok) return;
    [
      'diy-indie-empire-storage', // active run (zustand persist)
      'btb-meta-progression',     // band unlocks + lifetime stats + Scene Points
      'btb-stakes-v1',            // stake-tier unlocks
      'btb-run-history',
      'btb-highscores',
      'btb-tutorial-v2',          // replay onboarding
      'btb-venue-intro-v1',
    ].forEach((k) => safeStorage.removeItem(k));
    haptics.success();
    window.location.reload();
  };

  const handleAbandonRun = async () => {
    const ok = await confirm({
      title: 'Abandon run?',
      message: `You're on turn ${currentRound}. Abandoning ends this run for good.`,
      confirmLabel: 'Abandon',
      danger: true,
    });
    if (ok) {
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
    color: 'var(--snes-magenta)',
    marginTop: 0,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
  };

  const insetCard: React.CSSProperties = {
    backgroundColor: 'var(--snes-bg-2)',
    border: '2px solid var(--snes-void)',
    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
    borderRadius: 0,
    padding: '16px',
  };

  return (
    <SnesModal onClose={onClose} title="Settings" ariaLabel="Settings" maxWidth={500}>
        <div>
          {/* Audio Settings */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>
              {enabled ? <Volume2 size={18} color="var(--snes-magenta)" /> : <VolumeX size={18} color="var(--snes-magenta)" />}
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
                  color: 'var(--snes-ink)'
                }}>Sound Effects</span>
                <button
                  onClick={toggleSound}
                  style={{
                    width: '52px',
                    height: '28px',
                    minWidth: '44px',
                    minHeight: '44px',
                    borderRadius: 0,
                    backgroundColor: enabled ? 'var(--snes-magenta)' : 'var(--snes-bg-3)',
                    position: 'relative',
                    border: '2px solid var(--snes-ink)',
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-line)',
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
                    backgroundColor: '#f7efe0',
                    borderRadius: 0,
                    border: '2px solid var(--snes-void)',
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
                  color: 'var(--snes-ink)'
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
                    color: fxQuality === 'ultra' ? 'var(--snes-magenta)' : fxQuality === 'high' ? 'var(--snes-green)' : fxQuality === 'low' ? 'var(--snes-gold)' : 'var(--snes-ink-mute)',
                    backgroundColor: 'var(--snes-bg-3)',
                    border: '2px solid var(--snes-ink)',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-line)',
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
                    color: 'var(--snes-ink-dim)'
                  }}>Volume</span>
                  <span style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '9px',
                    letterSpacing: 0,
                    color: 'var(--snes-ink)'
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
                    background: `linear-gradient(to right, var(--snes-magenta) 0%, var(--snes-magenta) ${volume * 100}%, var(--snes-bg-3) ${volume * 100}%, var(--snes-bg-3) 100%)`,
                    border: '2px solid var(--snes-void)',
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
                color: 'var(--snes-ink-dim)',
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
                  backgroundColor: 'var(--snes-bg-2)',
                  border: '2px solid var(--snes-ink)',
                  boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-line)',
                  borderRadius: 0,
                  color: 'var(--snes-ink)',
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
                backgroundColor: 'var(--snes-bg-3)',
                color: 'var(--snes-ink)',
                border: '2px solid var(--snes-void)',
                boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
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
              <RefreshCw size={16} color="var(--snes-ink)" />
              Restart Tutorial
            </button>
          </section>

          {/* Game Info */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>
              <Info size={18} color="var(--snes-magenta)" />
              About
            </h3>
            <div style={{
              ...insetCard,
              fontSize: '13px',
              color: 'var(--snes-ink-dim)',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 4px 0' }}>Settling Up v0.1.0</p>
              <p style={{ margin: '0 0 8px 0' }}>A roguelike underground music scene builder</p>
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--snes-green)', fontSize: '12px', textDecoration: 'underline' }}
              >
                Privacy Policy
              </a>
            </div>
          </section>

          {/* Controls Guide */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={sectionHeader}>
              <Gamepad2 size={18} color="var(--snes-magenta)" />
              Controls
            </h3>
            <div style={{
              ...insetCard,
              fontSize: '13px',
              color: 'var(--snes-ink-dim)',
              lineHeight: '1.8'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>• Tap bands and venues to select them</p>
              <p style={{ margin: '0 0 8px 0' }}>• Use navigation tabs to switch between views</p>
              <p style={{ margin: 0 }}>• Tap the floating button to advance turns</p>
            </div>
          </section>

          {/* Danger Zone */}
          <section style={{
            borderTop: '2px solid var(--snes-line)',
            paddingTop: '24px'
          }}>
            <h3 style={{ ...sectionHeader, color: 'var(--snes-red)' }}>
              <AlertTriangle size={18} color="var(--snes-red)" />
              Danger Zone
            </h3>
            <button
              onClick={handleAbandonRun}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '12px',
                backgroundColor: 'var(--snes-red)',
                color: '#f7efe0',
                border: '2px solid var(--snes-void)',
                boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
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
            <button
              onClick={handleResetProgress}
              style={{
                width: '100%',
                minHeight: '44px',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'var(--snes-bg-2)',
                color: 'var(--snes-red)',
                border: '2px solid var(--snes-red)',
                boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-line)',
                borderRadius: 0,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                letterSpacing: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'none',
              }}
            >
              <RefreshCw size={16} color="var(--snes-red)" />
              Reset All Progress
            </button>
            <p style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', lineHeight: 1.6, color: 'var(--snes-ink-mute)', margin: '10px 2px 0' }}>
              Starts fresh: re-locks the roster so you can play the full unlock progression from the top. For playtesting.
            </p>
          </section>
        </div>
    </SnesModal>
  );
};
