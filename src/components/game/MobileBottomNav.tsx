import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { PixelIcon } from '@components/ui/PixelIcon';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem } from '@game/mechanics/ShowPromotionSystem';
import { progressionPathSystem } from '@game/mechanics/ProgressionPathSystem';
import { runManager } from '@game/mechanics/RunManager';
import { haptics } from '@utils/mobile';
import { TOURING_ENABLED } from '@/config/featureFlags';
import { SceneIdentityMeter } from './SceneIdentityMeter';
import { FactionStandingsMeter } from './FactionStandingsMeter';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression" | "tour";

interface MobileBottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNextTurn: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  onNextTurn
}) => {
  const { 
    scheduledShows,
    showHistory,
    fans,
    reputation,
    currentRound
  } = useGameStore();
  // Run length context — constant per run, so reading the singleton at render is fine.
  const maxTurns = runManager.getCurrentRun()?.config.maxTurns;

  const progressionUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length,
  });

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    haptics.light();
  };

  const primaryViews = [
    {
      id: 'city' as ViewType,
      icon: <PixelIcon name="building" size={20} />,
      label: 'City'
    },
    {
      id: 'bands' as ViewType,
      icon: <PixelIcon name="person" size={20} />,
      label: 'Bands'
    },
    {
      id: 'shows' as ViewType,
      icon: <PixelIcon name="note" size={20} />,
      label: 'Shows',
      badge: scheduledShows.length > 0 ? scheduledShows.length : undefined
    },
    {
      id: 'promotion' as ViewType,
      icon: <PixelIcon name="megaphone" size={20} />,
      label: 'Promo',
      badge: showPromotionSystem.getScheduledShows().length
    },
    // Day jobs are a core between-shows income loop, so they get a permanent
    // tab (the unified "all available jobs" list) rather than hiding in More.
    {
      id: 'jobs' as ViewType,
      icon: <PixelIcon name="briefcase" size={20} />,
      label: 'Jobs'
    }
  ];

  const secondaryViews = [
    // Touring is gated for the single-city demo (Strong Island only).
    ...(TOURING_ENABLED ? [{
      id: 'tour' as ViewType,
      icon: <PixelIcon name="pin" size={18} />,
      label: 'Tour'
    }] : []),
    {
      id: 'synergies' as ViewType,
      icon: <PixelIcon name="energy" size={18} />,
      label: 'Synergies'
    },
    ...(progressionUnlocked ? [{
      id: 'progression' as ViewType,
      icon: <PixelIcon name="fire" size={18} />,
      label: 'Path',
      badge: !progressionPathSystem.getProgression().currentPath ? "!" : undefined
    }] : [])
  ];

  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  // Which scene meter is expanded inside the More menu (mutually exclusive, so
  // the two panels never overlap or steal each other's taps).
  const [openMeter, setOpenMeter] = React.useState<'scene' | 'factions' | null>(null);

  return (
    <>
      {/* Main Bottom Navigation */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--snes-bg)',
        borderTop: '2px solid var(--snes-magenta)',
        boxShadow: 'inset 0 -2px 0 0 var(--snes-void)',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
        // Clear the home indicator + Dynamic Island, which sit on the SIDES in
        // landscape (the nav is full-width + fixed, so it needs its own insets).
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}>
        <div className="mobile-bottom-nav__row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '48px'
        }}>
          {primaryViews.map(view => (
            <button
              key={view.id}
              data-tut={`nav-${view.id}`}
              className="mobile-bottom-nav__btn btb-press"
              onClick={() => handleViewChange(view.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '2px 8px',
                flex: 1,
                minHeight: '44px',
                background: currentView === view.id ? 'var(--snes-bg-3)' : 'none',
                borderTop: currentView === view.id ? '2px solid var(--snes-magenta)' : '2px solid transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: currentView === view.id ? 'var(--snes-magenta)' : 'var(--snes-ink-dim)',
                cursor: 'pointer',
                transition: 'none',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                {React.cloneElement(view.icon, { size: 18 })}
                {view.badge !== undefined && view.badge > 0 && (
                  <span className="mobile-bottom-nav__badge snes-pixel" style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    backgroundColor: 'var(--snes-magenta)',
                    color: '#f7efe0',
                    fontSize: '8px',
                    borderRadius: '0',
                    border: '1px solid var(--snes-void)',
                    minWidth: '14px',
                    height: '14px',
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {view.badge}
                  </span>
                )}
              </div>
              <span className="mobile-bottom-nav__label snes-pixel" style={{
                fontSize: '11px',
                letterSpacing: '0'
              }}>{view.label}</span>
            </button>
          ))}
          
          {/* More Menu */}
          <button
            className="mobile-bottom-nav__btn btb-press"
            aria-label="More"
            aria-haspopup="dialog"
            aria-expanded={showMoreMenu}
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              haptics.light();
            }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '4px',
              flex: 1,
              minHeight: '44px',
              background: (showMoreMenu || secondaryViews.some(v => v.id === currentView)) ? 'var(--snes-bg-3)' : 'none',
              borderTop: (showMoreMenu || secondaryViews.some(v => v.id === currentView)) ? '2px solid var(--snes-magenta)' : '2px solid transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              color: showMoreMenu || secondaryViews.some(v => v.id === currentView)
                ? 'var(--snes-magenta)'
                : 'var(--snes-ink-dim)',
              cursor: 'pointer',
              transition: 'none'
            }}
          >
            <PixelIcon name="grid" size={18} />
            <span className="mobile-bottom-nav__label snes-pixel" style={{
              fontSize: '11px',
              letterSpacing: '0'
            }}>More</span>
            {/* Roll a dot up to the collapsed button when a hidden secondary view
                needs attention (e.g. an unmade progression-path choice), so the
                player sees there's something to act on without opening the menu. */}
            {!showMoreMenu && secondaryViews.some((v) => v.badge) && (
              <span
                aria-hidden
                style={{
                  position: 'absolute', top: '3px', right: 'calc(50% - 16px)',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--snes-magenta)', boxShadow: '0 0 0 1px var(--snes-void)',
                }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 6, 18, 0.8)',
            // Above the floating Next-Turn button + TURN box (both z-30) and the
            // nav bar (z-40) so they don't punch through the dimmed menu.
            zIndex: 50
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="mobile-bottom-nav__more-panel"
            role="dialog"
            aria-label="More"
            style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              backgroundColor: 'var(--snes-bg)',
              borderTop: '2px solid var(--snes-magenta)',
              boxShadow: 'inset 0 2px 0 0 var(--snes-edge-lt)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
              maxHeight: 'calc(100dvh - 64px)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned header: names the sheet + gives an explicit way out (the
                More trigger sits under the scrim, so scrim-tap was the only exit). */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px 0 16px',
              backgroundColor: 'var(--snes-bg)'
            }}>
              <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>SCENE</span>
              <button
                type="button"
                className="snes-close"
                aria-label="Close"
                onClick={() => setShowMoreMenu(false)}
              >
                <X size={18} />
              </button>
            </div>
            {/* Scene meters — moved off the city map. These are info panels, not
                nav: tapping one expands it in place (mutually exclusive) without
                closing the menu. Side by side to suit the wide-short screen. */}
            <div style={{ display: 'flex', gap: '12px', padding: '8px 16px 0', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SceneIdentityMeter
                  inline
                  open={openMeter === 'scene'}
                  onToggle={() => setOpenMeter((m) => (m === 'scene' ? null : 'scene'))}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FactionStandingsMeter
                  inline
                  open={openMeter === 'factions'}
                  onToggle={() => setOpenMeter((m) => (m === 'factions' ? null : 'factions'))}
                />
              </div>
            </div>
            {/* Flex, not a fixed 3-col grid: the demo often has just 1-2 secondary
                views, so tiles center at a sane capped width instead of leaving
                empty grid slots (3 tiles still fill the row on the touring build). */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '16px',
              padding: '16px'
            }}>
              {secondaryViews.map(view => (
                <button
                  key={view.id}
                  onClick={() => {
                    handleViewChange(view.id);
                    setShowMoreMenu(false);
                  }}
                  style={{
                    flex: '1 1 0',
                    minWidth: '120px',
                    maxWidth: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 12px',
                    borderRadius: '0',
                    backgroundColor: currentView === view.id ? 'var(--snes-magenta)' : 'var(--snes-bg-3)',
                    color: currentView === view.id ? '#f7efe0' : 'var(--snes-ink-dim)',
                    border: '2px solid var(--snes-void)',
                    boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.12), inset -2px -2px 0 0 rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    transition: 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {view.icon}
                    {view.badge && (
                      <span className="snes-pixel" style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-8px',
                        backgroundColor: 'var(--snes-gold)',
                        color: '#1e1509',
                        fontSize: '8px',
                        borderRadius: '0',
                        border: '1px solid var(--snes-void)',
                        minWidth: '16px',
                        height: '16px',
                        padding: '0 3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {view.badge}
                      </span>
                    )}
                  </div>
                  <span className="snes-pixel" style={{
                    fontSize: '8px',
                    letterSpacing: '0'
                  }}>{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Next Turn Button */}
      <button
        data-tut="next-turn"
        className="mobile-bottom-nav__next-turn"
        onClick={() => {
          onNextTurn();
          haptics.medium();
        }}
        style={{
          position: 'fixed',
          // Fixed to the viewport, so it must clear the Dynamic Island / notch,
          // which sits on a SIDE in landscape — inset by the right safe area.
          right: 'calc(12px + env(safe-area-inset-right))',
          width: '48px',
          height: '48px',
          // Amber when nothing's booked (pairs with the no-shows confirm), pink when ready.
          background: scheduledShows.length > 0 ? 'var(--snes-magenta)' : 'var(--snes-gold)',
          // Glyph follows the skin's .snes-btn pairing: light on magenta (ready),
          // dark on gold (nothing booked) — hardcoding dark failed contrast on magenta.
          color: scheduledShows.length > 0 ? '#f7efe0' : '#1e1509',
          borderRadius: '0',
          border: '2px solid var(--snes-void)',
          boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.45), 4px 4px 0 0 var(--snes-void)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          cursor: 'pointer',
          transition: 'none',
          bottom: 'calc(3rem + env(safe-area-inset-bottom) + 0.5rem)'
        }}
        aria-label={scheduledShows.length > 0 ? `Next turn — ${scheduledShows.length} show${scheduledShows.length > 1 ? 's' : ''} booked` : 'Next turn — no shows booked'}
      >
        <ChevronRight size={20} />
        {scheduledShows.length > 0 && (
          <span
            aria-hidden
            className="snes-pixel"
            style={{
              position: 'absolute', top: '-6px', left: '-6px', minWidth: '18px', height: '18px',
              padding: '0 3px', background: 'var(--snes-green)', color: '#f7efe0', border: '2px solid var(--snes-void)',
              fontSize: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >
            {scheduledShows.length}
          </span>
        )}
      </button>

      {/* Turn Indicator — a .snes-chip so it morphs per skin (no inline chrome). */}
      <div className="mobile-bottom-nav__turn-indicator snes-chip" style={{
        position: 'fixed',
        // Clear the Dynamic Island / notch (on a SIDE in landscape) via the left inset.
        left: 'calc(12px + env(safe-area-inset-left))',
        zIndex: 30,
        bottom: 'calc(3rem + env(safe-area-inset-bottom) + 0.5rem)'
      }}>
        <span className="snes-pixel" style={{
          fontSize: 'var(--t-sm)',
          color: 'var(--snes-ink)'
        }}>
          <span style={{ color: 'var(--snes-ink-dim)' }}>TURN </span>
          {currentRound}{maxTurns ? `/${maxTurns}` : ''}
        </span>
      </div>
    </>
  );
};