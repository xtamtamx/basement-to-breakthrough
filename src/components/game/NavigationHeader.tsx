import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Music, Megaphone, Briefcase, Zap, TrendingUp, 
  Settings, Save, ChevronRight 
} from 'lucide-react';
import { haptics } from '@utils/mobile';
import { useGameStore } from '@stores/gameStore';
import { showPromotionSystem } from '@game/mechanics/ShowPromotionSystem';
import { progressionPathSystem } from '@game/mechanics/ProgressionPathSystem';

type ViewType = "city" | "bands" | "shows" | "promotion" | "synergies" | "jobs" | "progression";

interface NavigationHeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNextTurn: () => void;
  onOpenSettings: () => void;
  onOpenSaveLoad: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  onViewChange,
  onNextTurn,
  onOpenSettings,
  onOpenSaveLoad
}) => {
  const { 
    currentRound, 
    money, 
    reputation, 
    fans, 
    stress,
    scheduledShows,
    showHistory 
  } = useGameStore();

  const progressionUnlocked = progressionPathSystem.isUnlocked({
    fans,
    reputation,
    totalShows: showHistory.length,
  });

  const views: Record<ViewType, { icon: React.ReactNode; label: string; badge?: number | string }> = {
    city: { icon: <Building2 size={20} />, label: "City" },
    bands: { icon: <Users size={20} />, label: "Bands" },
    shows: { 
      icon: <Music size={20} />, 
      label: "Shows",
      badge: scheduledShows.length > 0 ? scheduledShows.length : undefined
    },
    promotion: { 
      icon: <Megaphone size={20} />, 
      label: "Promo",
      badge: showPromotionSystem.getScheduledShows().length > 0 
        ? showPromotionSystem.getScheduledShows().length 
        : undefined
    },
    jobs: { icon: <Briefcase size={20} />, label: "Jobs" },
    synergies: { icon: <Zap size={20} />, label: "Synergies" },
    progression: { 
      icon: <TrendingUp size={20} />, 
      label: "Path",
      badge: progressionUnlocked && !progressionPathSystem.getProgression().currentPath ? "!" : undefined
    },
  };

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    haptics.light();
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-gray-900 border-b border-gray-800">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-pink-500">DIY</h1>
            <span className="text-sm text-gray-400">R{currentRound}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSaveLoad}
              className="btn btn-icon btn-sm"
              aria-label="Save/Load"
            >
              <Save size={16} />
            </button>
            <button
              onClick={onOpenSettings}
              className="btn btn-icon btn-sm"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onNextTurn}
              className="btn btn-primary btn-sm"
            >
              Next Turn
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Resources Bar */}
        <div className="flex items-center justify-around p-2 border-t border-gray-800">
          <div className="resource-item">
            <span className="resource-icon">💰</span>
            <span className="resource-value">${money}</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">⭐</span>
            <span className="resource-value">{reputation}</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">👥</span>
            <span className="resource-value">{fans}</span>
          </div>
          {stress > 0 && (
            <div className={`resource-item ${stress > 80 ? 'text-red-400' : stress > 50 ? 'text-orange-400' : ''}`}>
              <span className="resource-icon">😰</span>
              <span className="resource-value">{stress}%</span>
            </div>
          )}
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex overflow-x-auto scrollbar-hide-x border-t border-gray-800">
          {Object.entries(views).map(([key, view]) => {
            if (key === "progression" && !progressionUnlocked) return null;
            
            return (
              <button
                key={key}
                onClick={() => handleViewChange(key as ViewType)}
                className={`nav-tab ${currentView === key ? 'active' : ''}`}
              >
                <div className="nav-tab-icon">{view.icon}</div>
                <span className="nav-tab-label">{view.label}</span>
                {view.badge && (
                  <span className="nav-tab-badge">{view.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-pink-500">DIY INDIE EMPIRE</h1>
            <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
              Round {currentRound}
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="flex gap-2">
            {Object.entries(views).map(([key, view]) => {
              if (key === "progression" && !progressionUnlocked) return null;
              
              return (
                <button
                  key={key}
                  onClick={() => handleViewChange(key as ViewType)}
                  className={`nav-button ${currentView === key ? 'active' : ''}`}
                >
                  {view.icon}
                  <span>{view.label}</span>
                  {view.badge && (
                    <span className="nav-badge">{view.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Resources */}
          <div className="flex items-center gap-4">
            <div className="resource-group">
              <span className="resource-icon">💰</span>
              <span className="resource-value">${money}</span>
            </div>
            <div className="resource-group">
              <span className="resource-icon">⭐</span>
              <span className="resource-value">{reputation}</span>
            </div>
            <div className="resource-group">
              <span className="resource-icon">👥</span>
              <span className="resource-value">{fans}</span>
            </div>
            {stress > 0 && (
              <div className={`resource-group ${stress > 80 ? 'text-red-400' : stress > 50 ? 'text-orange-400' : ''}`}>
                <span className="resource-icon">😰</span>
                <span className="resource-value">{stress}%</span>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSaveLoad}
              className="btn btn-icon"
              aria-label="Save/Load"
            >
              <Save size={20} />
            </button>
            <button
              onClick={onOpenSettings}
              className="btn btn-icon"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onNextTurn}
              className="btn btn-primary"
            >
              Next Turn
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

    </>
  );
};