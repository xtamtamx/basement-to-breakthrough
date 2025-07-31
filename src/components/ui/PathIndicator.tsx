import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { PathAlignment } from '@/game/mechanics/PathSystem';

export const PathIndicator: React.FC = () => {
  const { diyPoints, pathAlignment } = useGameStore();
  
  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'PURE_DIY': return '#10b981';
      case 'DIY_LEANING': return '#34d399';
      case 'BALANCED': return '#fbbf24';
      case 'CORPORATE_LEANING': return '#f97316';
      case 'FULL_SELLOUT': return '#ef4444';
      default: return '#fff';
    }
  };
  
  const getAlignmentText = (alignment: string) => {
    switch (alignment) {
      case 'PURE_DIY': return 'DIY OR DIE';
      case 'DIY_LEANING': return 'DIY FOCUSED';
      case 'BALANCED': return 'BALANCED';
      case 'CORPORATE_LEANING': return 'CORPORATE FRIENDLY';
      case 'FULL_SELLOUT': return 'TOTAL SELLOUT';
      default: return alignment;
    }
  };
  
  // Calculate position on scale (-100 to 100)
  const normalizedPosition = Math.max(-100, Math.min(100, diyPoints));
  const percentPosition = ((normalizedPosition + 100) / 200) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'fixed',
        top: '70px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: `2px solid ${getAlignmentColor(pathAlignment)}`,
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 100,
        minWidth: '180px'
      }}
    >
      <div style={{
        fontSize: '10px',
        color: '#666',
        marginBottom: '4px',
        textTransform: 'uppercase'
      }}>
        Path Alignment
      </div>
      
      <div style={{
        fontSize: '13px',
        color: getAlignmentColor(pathAlignment),
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        {getAlignmentText(pathAlignment)}
      </div>
      
      {/* Visual Scale */}
      <div style={{
        position: 'relative',
        height: '6px',
        backgroundColor: '#333',
        marginBottom: '4px',
        overflow: 'hidden'
      }}>
        {/* DIY Side */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(to right, #10b981, #333)'
        }} />
        
        {/* Corporate Side */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(to left, #ef4444, #333)'
        }} />
        
        {/* Current Position */}
        <motion.div
          animate={{ left: `${percentPosition}%` }}
          transition={{ type: 'spring', stiffness: 100 }}
          style={{
            position: 'absolute',
            top: '-3px',
            width: '12px',
            height: '12px',
            backgroundColor: '#fff',
            border: `2px solid ${getAlignmentColor(pathAlignment)}`,
            borderRadius: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        color: '#666'
      }}>
        <span>DIY</span>
        <span>|</span>
        <span>CORP</span>
      </div>
      
      <div style={{
        marginTop: '6px',
        fontSize: '10px',
        color: '#888',
        textAlign: 'center'
      }}>
        {diyPoints > 0 ? '+' : ''}{diyPoints} points
      </div>
    </motion.div>
  );
};

// Compact version for header
export const PathIndicatorCompact: React.FC = () => {
  const { diyPoints, pathAlignment } = useGameStore();
  
  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'PURE_DIY': return '#10b981';
      case 'DIY_LEANING': return '#34d399';
      case 'BALANCED': return '#fbbf24';
      case 'CORPORATE_LEANING': return '#f97316';
      case 'FULL_SELLOUT': return '#ef4444';
      default: return '#fff';
    }
  };
  
  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'PURE_DIY': return '🏴';
      case 'DIY_LEANING': return '✊';
      case 'BALANCED': return '⚖️';
      case 'CORPORATE_LEANING': return '💼';
      case 'FULL_SELLOUT': return '💰';
      default: return '?';
    }
  };
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: `1px solid ${getAlignmentColor(pathAlignment)}`,
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '11px'
    }}>
      <span>{getAlignmentIcon(pathAlignment)}</span>
      <span style={{ color: getAlignmentColor(pathAlignment), fontWeight: 'bold' }}>
        {diyPoints > 0 ? '+' : ''}{diyPoints}
      </span>
    </div>
  );
};