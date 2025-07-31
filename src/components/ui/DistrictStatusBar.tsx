import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { getDistrictWarnings } from '@/game/mechanics/GentrificationSystem';
import { District } from '@/game/types/core';

export const DistrictStatusBar: React.FC = () => {
  const { districts } = useGameStore();
  
  // Get districts with warnings
  const districtsWithWarnings = districts
    .map(district => ({
      district,
      warnings: getDistrictWarnings(district)
    }))
    .filter(({ warnings }) => warnings.length > 0);
  
  if (districtsWithWarnings.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'fixed',
        top: '60px',
        left: '10px',
        right: '10px',
        zIndex: 100,
        fontFamily: 'monospace'
      }}
    >
      {districtsWithWarnings.map(({ district, warnings }) => (
        <div
          key={district.id}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #ef4444',
            padding: '8px 12px',
            marginBottom: '8px',
            fontSize: '12px'
          }}
        >
          <div style={{
            color: '#fff',
            fontWeight: 'bold',
            marginBottom: '4px',
            textTransform: 'uppercase'
          }}>
            {district.name} District
          </div>
          {warnings.map((warning, index) => (
            <div key={index} style={{ color: '#fbbf24', fontSize: '11px' }}>
              {warning}
            </div>
          ))}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '4px',
            fontSize: '10px',
            color: '#999'
          }}>
            <span>Gentrify: {district.gentrificationLevel}%</span>
            <span>Scene: {district.sceneStrength}%</span>
            <span>Rent: {district.rentMultiplier.toFixed(1)}x</span>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// Mini district indicator for city view
export const DistrictIndicator: React.FC<{ district: District }> = ({ district }) => {
  const warnings = getDistrictWarnings(district);
  const hasWarnings = warnings.length > 0;
  
  const getStatusColor = () => {
    if (district.gentrificationLevel > 70) return '#ef4444'; // red
    if (district.gentrificationLevel > 50) return '#fbbf24'; // amber
    if (district.sceneStrength < 30) return '#f97316'; // orange
    return '#10b981'; // green
  };
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 6px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '2px',
      fontSize: '10px',
      fontFamily: 'monospace'
    }}>
      <div
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: getStatusColor(),
          borderRadius: '50%',
          animation: hasWarnings ? 'pulse 2s infinite' : 'none'
        }}
      />
      <span style={{ color: '#fff' }}>{district.name}</span>
      <span style={{ color: '#666' }}>
        G:{district.gentrificationLevel} S:{district.sceneStrength}
      </span>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};