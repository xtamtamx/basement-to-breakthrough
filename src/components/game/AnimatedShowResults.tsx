import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@utils/mobile';

interface ShowResult {
  venueName: string;
  bandName: string;
  attendance: number;
  capacity: number;
  financials: {
    revenue: number;
    costs: number;
    profit: number;
  };
  reputationChange: number;
  incidents?: string[];
  isSuccess: boolean;
  synergies?: string[];
}

interface AnimatedShowResultsProps {
  results: ShowResult[];
  onClose: () => void;
}

export const AnimatedShowResults: React.FC<AnimatedShowResultsProps> = ({
  results,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const currentResult = results[currentIndex];

  const totalProfit = results.reduce((sum, r) => sum + r.financials.profit, 0);
  const totalRep = results.reduce((sum, r) => sum + r.reputationChange, 0);
  const totalFans = results.reduce((sum, r) => sum + r.attendance, 0);

  useEffect(() => {
    haptics.medium();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const attendancePercent = Math.round((currentResult?.attendance / currentResult?.capacity) * 100) || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={handleNext}
    >
      <AnimatePresence mode="wait">
        {!showSummary ? (
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="glass-panel p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Show Header */}
            <div className="text-center mb-4">
              <motion.h2 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pixel-text pixel-text-lg pixel-text-shadow mb-2"
                style={{ color: currentResult?.isSuccess ? 'var(--pixel-green)' : 'var(--pixel-red)' }}
              >
                {currentResult?.isSuccess ? 'SHOW SUCCESS!' : 'SHOW FAILED!'}
              </motion.h2>
              <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                {currentResult?.bandName} @ {currentResult?.venueName}
              </p>
            </div>

            {/* Attendance Bar */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <div className="flex justify-between mb-1">
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  ATTENDANCE
                </span>
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-yellow)' }}>
                  {currentResult?.attendance}/{currentResult?.capacity}
                </span>
              </div>
              <div className="h-6 bg-black/50 border-2 border-gray-600 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${attendancePercent}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  className="h-full relative"
                  style={{
                    background: `linear-gradient(90deg, 
                      ${attendancePercent > 80 ? 'var(--pixel-green)' : 
                        attendancePercent > 50 ? 'var(--pixel-yellow)' : 
                        'var(--pixel-red)'} 0%, 
                      ${attendancePercent > 80 ? 'var(--pixel-cyan)' : 
                        attendancePercent > 50 ? 'var(--pixel-orange)' : 
                        'var(--pixel-magenta)'} 100%)`
                  }}
                >
                  <div className="absolute inset-0 opacity-50">
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Financial Results */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 mb-4"
            >
              <div className="flex justify-between">
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  REVENUE
                </span>
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-green)' }}>
                  +${currentResult?.financials.revenue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  COSTS
                </span>
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-red)' }}>
                  -${currentResult?.financials.costs}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between">
                <span className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-white)' }}>
                  PROFIT
                </span>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="pixel-text pixel-text-sm" 
                  style={{ 
                    color: currentResult?.financials.profit > 0 ? 'var(--pixel-green)' : 'var(--pixel-red)',
                    textShadow: '0 0 10px currentColor'
                  }}
                >
                  ${currentResult?.financials.profit}
                </motion.span>
              </div>
            </motion.div>

            {/* Reputation Change */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="text-center mb-4"
            >
              <span className="pixel-text pixel-text-sm" style={{ 
                color: currentResult?.reputationChange > 0 ? 'var(--pixel-magenta)' : 'var(--pixel-red)',
                textShadow: '0 0 20px currentColor'
              }}>
                {currentResult?.reputationChange > 0 ? '+' : ''}{currentResult?.reputationChange} REP
              </span>
            </motion.div>

            {/* Synergies */}
            {currentResult?.synergies && currentResult.synergies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="glass-panel-inset p-2 mb-4"
                style={{ borderColor: 'var(--pixel-cyan)' }}
              >
                <p className="pixel-text pixel-text-sm mb-1" style={{ color: 'var(--pixel-cyan)' }}>
                  SYNERGIES TRIGGERED:
                </p>
                {currentResult.synergies.map((synergy, i) => (
                  <p key={i} className="pixel-text" style={{ fontSize: '8px', color: 'var(--pixel-white)' }}>
                    ⚡ {synergy}
                  </p>
                ))}
              </motion.div>
            )}
            
            {/* Incidents */}
            {currentResult?.incidents && currentResult.incidents.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="glass-panel-inset p-2 mb-4"
              >
                <p className="pixel-text pixel-text-sm mb-1" style={{ color: 'var(--pixel-yellow)' }}>
                  INCIDENTS:
                </p>
                {currentResult.incidents.map((incident, i) => (
                  <p key={i} className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                    • {incident}
                  </p>
                ))}
              </motion.div>
            )}

            {/* Continue button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={handleNext}
              className="w-full glass-button p-3"
              style={{
                background: currentResult?.isSuccess ? 
                  'linear-gradient(45deg, var(--pixel-green), var(--pixel-cyan))' :
                  'linear-gradient(45deg, var(--pixel-red), var(--pixel-magenta))'
              }}
            >
              <span className="pixel-text pixel-text-sm">
                {currentIndex < results.length - 1 ? 'NEXT SHOW' : 'SEE SUMMARY'}
              </span>
            </motion.button>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-4">
              {results.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i === currentIndex ? 'var(--pixel-yellow)' : 'var(--pixel-gray)',
                    opacity: i === currentIndex ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="glass-panel p-6 max-w-md w-full text-center"
          >
            <h2 className="pixel-text pixel-text-xl pixel-text-shadow mb-6" 
                style={{ color: 'var(--pixel-yellow)' }}>
              TURN COMPLETE!
            </h2>

            {/* Summary Stats */}
            <div className="space-y-4 mb-6">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-panel-raised p-4"
              >
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  TOTAL PROFIT
                </p>
                <p className="pixel-text pixel-text-lg" style={{ 
                  color: totalProfit > 0 ? 'var(--pixel-green)' : 'var(--pixel-red)',
                  textShadow: '0 0 20px currentColor'
                }}>
                  ${totalProfit}
                </p>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-panel-raised p-4"
              >
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  REPUTATION GAINED
                </p>
                <p className="pixel-text pixel-text-lg" style={{ 
                  color: 'var(--pixel-magenta)',
                  textShadow: '0 0 20px currentColor'
                }}>
                  +{totalRep} REP
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-panel-raised p-4"
              >
                <p className="pixel-text pixel-text-sm" style={{ color: 'var(--pixel-gray)' }}>
                  NEW FANS
                </p>
                <p className="pixel-text pixel-text-lg" style={{ 
                  color: 'var(--pixel-cyan)',
                  textShadow: '0 0 20px currentColor'
                }}>
                  +{totalFans} FANS
                </p>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onClose}
              className="w-full glass-button p-4"
              style={{
                background: 'linear-gradient(45deg, var(--pixel-magenta), var(--pixel-cyan))',
                boxShadow: '0 0 30px var(--pixel-magenta)'
              }}
            >
              <span className="pixel-text pixel-text-lg">CONTINUE</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};