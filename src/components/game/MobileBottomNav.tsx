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
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111827',
        borderTop: '1px solid #374151',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '48px'
        }}>
          {primaryViews.map(view => (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '2px 8px',
                flex: 1,
                minHeight: '44px',
                background: 'none',
                border: 'none',
                color: currentView === view.id ? '#ec4899' : '#9ca3af',
                cursor: 'pointer',
                transition: 'color 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                {React.cloneElement(view.icon, { size: 18 })}
                {view.badge !== undefined && view.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#ec4899',
                    color: 'white',
                    fontSize: '9px',
                    borderRadius: '8px',
                    minWidth: '14px',
                    height: '14px',
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {view.badge}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '-0.01em'
              }}>{view.label}</span>
            </button>
          ))}
          
          {/* More Menu */}
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              haptics.light();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px',
              flex: 1,
              background: 'none',
              border: 'none',
              color: showMoreMenu || secondaryViews.some(v => v.id === currentView) 
                ? '#ec4899' 
                : '#9ca3af',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            <Grid3X3 size={20} />
            <span style={{
              fontSize: '10px',
              fontWeight: '500'
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            style={{
              position: 'fixed',
              bottom: '56px',
              left: 0,
              right: 0,
              backgroundColor: '#111827',
              borderTop: '1px solid #374151',
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
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: currentView === view.id ? '#ec4899' : '#1f2937',
                    color: currentView === view.id ? '#ffffff' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {view.icon}
                    {view.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#ec4899',
                        color: 'white',
                        fontSize: '12px',
                        borderRadius: '10px',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {view.badge}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Next Turn Button */}
      <button
        onClick={() => {
          onNextTurn();
          haptics.medium();
        }}
        style={{
          position: 'fixed',
          right: '12px',
          width: '48px',
          height: '48px',
          backgroundImage: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
          color: 'white',
          borderRadius: '24px',
          boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
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
      <div style={{
        position: 'fixed',
        left: '12px',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '6px 10px',
        zIndex: 30,
        bottom: 'calc(3rem + env(safe-area-inset-bottom) + 0.5rem)'
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#d1d5db'
        }}>Turn {currentRound}</span>
      </div>
    </>
  );
};