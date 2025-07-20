import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Band, Bill, BillDynamics } from '@game/types';

interface BillPreviewProps {
  bands: Band[];
  bill: Bill;
  isVisible: boolean;
}

export const BillPreview: React.FC<BillPreviewProps> = ({ bands, bill, isVisible }) => {
  if (!isVisible || bands.length < 2) return null;
  
  const headliner = bands.find(b => b.id === bill.headliner);
  const openers = bill.openers.map(id => bands.find(b => b.id === id)).filter(Boolean) as Band[];
  const dynamics = bill.dynamics;
  
  const getDynamicsColor = (value: number) => {
    if (value >= 80) return 'var(--pixel-green)';
    if (value >= 60) return 'var(--pixel-yellow)';
    if (value >= 40) return 'var(--pixel-orange)';
    return 'var(--pixel-red)';
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-24 right-4 z-50 glass-panel p-4 max-w-xs"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      >
        <h3 className="pixel-text pixel-text-sm mb-3" style={{ color: 'var(--pixel-yellow)' }}>
          BILL PREVIEW
        </h3>
        
        {/* Band Order */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-yellow)' }}>
              HEADLINER
            </span>
            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
              {headliner?.name}
            </span>
          </div>
          {openers.map((opener, i) => (
            <div key={opener.id} className="flex items-center gap-2">
              <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-gray)' }}>
                OPENER {i + 1}
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-white)' }}>
                {opener.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Dynamics */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                CHEMISTRY
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: getDynamicsColor(dynamics.chemistryScore) }}>
                {dynamics.chemistryScore}%
              </span>
            </div>
            <div className="pixel-progress-bar h-2">
              <div 
                className="pixel-progress-fill" 
                style={{ 
                  width: `${dynamics.chemistryScore}%`,
                  backgroundColor: getDynamicsColor(dynamics.chemistryScore)
                }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                CROWD APPEAL
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: getDynamicsColor(dynamics.crowdAppeal) }}>
                {dynamics.crowdAppeal}%
              </span>
            </div>
            <div className="pixel-progress-bar h-2">
              <div 
                className="pixel-progress-fill" 
                style={{ 
                  width: `${dynamics.crowdAppeal}%`,
                  backgroundColor: getDynamicsColor(dynamics.crowdAppeal)
                }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                DRAMA RISK
              </span>
              <span className="pixel-text pixel-text-xs" style={{ 
                color: dynamics.dramaRisk > 50 ? 'var(--pixel-red)' : 
                       dynamics.dramaRisk > 30 ? 'var(--pixel-orange)' : 
                       'var(--pixel-green)' 
              }}>
                {dynamics.dramaRisk}%
              </span>
            </div>
            <div className="pixel-progress-bar h-2">
              <div 
                className="pixel-progress-fill" 
                style={{ 
                  width: `${dynamics.dramaRisk}%`,
                  backgroundColor: dynamics.dramaRisk > 50 ? 'var(--pixel-red)' : 
                                   dynamics.dramaRisk > 30 ? 'var(--pixel-orange)' : 
                                   'var(--pixel-green)'
                }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                SCENE ALIGNMENT
              </span>
              <span className="pixel-text pixel-text-xs" style={{ color: getDynamicsColor(dynamics.sceneAlignment) }}>
                {dynamics.sceneAlignment}%
              </span>
            </div>
            <div className="pixel-progress-bar h-2">
              <div 
                className="pixel-progress-fill" 
                style={{ 
                  width: `${dynamics.sceneAlignment}%`,
                  backgroundColor: getDynamicsColor(dynamics.sceneAlignment)
                }} 
              />
            </div>
          </div>
        </div>
        
        {/* Warnings */}
        {dynamics.dramaRisk > 50 && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mt-3 glass-panel p-2"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-red)' }}>
              ⚠️ HIGH DRAMA RISK
            </p>
          </motion.div>
        )}
        
        {dynamics.chemistryScore < 50 && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mt-3 glass-panel p-2"
            style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)' }}
          >
            <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-orange)' }}>
              ⚠️ POOR CHEMISTRY
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};