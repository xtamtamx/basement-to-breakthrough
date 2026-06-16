import React from 'react';
import { 
  Building2, Users, Music, Megaphone, Briefcase, Zap, TrendingUp,
  ChevronRight, Grid3X3
} from 'lucide-react';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem } from '@game/mechanics/ShowPromotionSystem';
import { progressionPathSystem } from '@game/mechanics/ProgressionPathSystem';
import { haptics } from '@utils/mobile';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

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
      icon: <Building2 size={20} />,
      label: 'City'
    },
    {
      id: 'bands' as ViewType,
      icon: <Users size={20} />,
      label: 'Bands'
    },
    {
      id: 'shows' as ViewType,
      icon: <Music size={20} />,
      label: 'Shows',
      badge: scheduledShows.length > 0 ? scheduledShows.length : undefined
    },
    {
      id: 'promotion' as ViewType,
      icon: <Megaphone size={20} />,
      label: 'Promo',
      badge: showPromotionSystem.getScheduledShows().length
    }
  ];

  const secondaryViews = [
    {
      id: 'jobs' as ViewType,
      icon: <Briefcase size={18} />,
      label: 'Jobs'
    },
    {
      id: 'synergies' as ViewType,
      icon: <Zap size={18} />,
      label: 'Synergies'
    },
    ...(progressionUnlocked ? [{
      id: 'progression' as ViewType,
      icon: <TrendingUp size={18} />,
      label: 'Path',
      badge: !progressionPathSystem.getProgression().currentPath ? "!" : undefined
    }] : [])
  ];

  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  return (
    <>
      {/* Main Bottom Navigation */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#171327',
        borderTop: '2px solid #f72585',
        boxShadow: 'inset 0 -2px 0 0 #0a0814',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)'
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
              className="mobile-bottom-nav__btn"
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
                background: currentView === view.id ? '#1f1a3a' : 'none',
                borderTop: currentView === view.id ? '2px solid #f72585' : '2px solid transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                color: currentView === view.id ? '#f72585' : '#6f6796',
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
                    backgroundColor: '#f72585',
                    color: '#1a0a14',
                    fontSize: '8px',
                    borderRadius: '0',
                    border: '1px solid #0a0814',
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
                fontSize: '7px',
                letterSpacing: '0'
              }}>{view.label}</span>
            </button>
          ))}
          
          {/* More Menu */}
          <button
            className="mobile-bottom-nav__btn"
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              haptics.light();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '4px',
              flex: 1,
              minHeight: '44px',
              background: (showMoreMenu || secondaryViews.some(v => v.id === currentView)) ? '#1f1a3a' : 'none',
              borderTop: (showMoreMenu || secondaryViews.some(v => v.id === currentView)) ? '2px solid #f72585' : '2px solid transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              color: showMoreMenu || secondaryViews.some(v => v.id === currentView)
                ? '#f72585'
                : '#6f6796',
              cursor: 'pointer',
              transition: 'none'
            }}
          >
            <Grid3X3 size={18} />
            <span className="mobile-bottom-nav__label snes-pixel" style={{
              fontSize: '7px',
              letterSpacing: '0'
            }}>More</span>
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
            zIndex: 30
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="mobile-bottom-nav__more-panel"
            style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              backgroundColor: '#171327',
              borderTop: '2px solid #f72585',
              boxShadow: 'inset 0 2px 0 0 #3a2f5c',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 12px',
                    borderRadius: '0',
                    backgroundColor: currentView === view.id ? '#f72585' : '#1f1a3a',
                    color: currentView === view.id ? '#1a0a14' : '#b9b3d6',
                    border: '2px solid #0a0814',
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
                        backgroundColor: '#ffd23f',
                        color: '#3a2e00',
                        fontSize: '8px',
                        borderRadius: '0',
                        border: '1px solid #0a0814',
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
        className="mobile-bottom-nav__next-turn"
        onClick={() => {
          onNextTurn();
          haptics.medium();
        }}
        style={{
          position: 'fixed',
          right: '12px',
          width: '48px',
          height: '48px',
          background: '#f72585',
          color: '#1a0a14',
          borderRadius: '0',
          border: '2px solid #0a0814',
          boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.45), 4px 4px 0 0 #0a0814',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          cursor: 'pointer',
          transition: 'none',
          bottom: 'calc(3rem + env(safe-area-inset-bottom) + 0.5rem)'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Next turn"
      >
        <ChevronRight size={20} />
      </button>

      {/* Turn Indicator */}
      <div className="mobile-bottom-nav__turn-indicator" style={{
        position: 'fixed',
        left: '12px',
        backgroundColor: '#0f0b1e',
        border: '2px solid #0a0814',
        boxShadow: 'inset 1px 1px 0 0 #2a2350',
        borderRadius: '0',
        padding: '7px 10px',
        zIndex: 30,
        bottom: 'calc(3rem + env(safe-area-inset-bottom) + 0.5rem)'
      }}>
        <span className="snes-pixel" style={{
          fontSize: '8px',
          color: '#ffd23f'
        }}>TURN {currentRound}</span>
      </div>
    </>
  );
};