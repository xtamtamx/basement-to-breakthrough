import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { synergySystemV2, Synergy } from '@game/mechanics/SynergySystemV2';
import { haptics } from '@utils/mobile';

export const SynergyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'discovered' | 'undiscovered'>('discovered');
  const discoveredSynergies = synergySystemV2.getDiscoveredSynergies();
  const undiscoveredCount = synergySystemV2.getUndiscoveredSynergiesCount();
  
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'mythic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      case 'rare': return '#3b82f6';
      default: return '#10b981';
    }
  };
  
  const getTierName = (tier: string): string => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '2px solid #1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#ec4899', fontSize: '20px' }}>Synergy Discovery</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
            {discoveredSynergies.length} Discovered • {undiscoveredCount} Hidden
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
      }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: '#111',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {discoveredSynergies.filter(s => s.tier === 'common').length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Common</div>
          </div>
          <div style={{
            backgroundColor: '#111',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
              {discoveredSynergies.filter(s => s.tier === 'rare').length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Rare</div>
          </div>
          <div style={{
            backgroundColor: '#111',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {discoveredSynergies.filter(s => s.tier === 'legendary').length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Legendary</div>
          </div>
          <div style={{
            backgroundColor: '#111',
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {discoveredSynergies.filter(s => s.tier === 'mythic').length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Mythic</div>
          </div>
        </div>

        {/* Synergy List */}
        <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Discovered Synergies</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {discoveredSynergies.map(synergy => (
            <motion.div
              key={synergy.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: '#111',
                border: `2px solid ${getTierColor(synergy.tier)}`,
                borderRadius: '8px',
                padding: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Tier Badge */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: getTierColor(synergy.tier),
                padding: '4px 12px',
                borderRadius: '0 6px 0 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {getTierName(synergy.tier)}
              </div>

              {/* Content */}
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{synergy.icon}</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px', color: '#fff' }}>{synergy.name}</h4>
                  <p style={{ margin: '0 0 12px', color: '#d1d5db', fontSize: '14px' }}>
                    {synergy.description}
                  </p>
                  
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Multiplier:</span>{' '}
                      <span style={{ color: getTierColor(synergy.tier), fontWeight: 'bold' }}>
                        {synergy.multiplier}x
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Triggered:</span>{' '}
                      <span style={{ color: '#fff' }}>{synergy.timesTriggered} times</span>
                    </div>
                  </div>

                  {/* Effects */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Effects:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {synergy.effects.map((effect, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          {effect.description}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Undiscovered Hint */}
        {undiscoveredCount > 0 && (
          <div style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#111',
            border: '2px solid #374151',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px', color: '#ec4899' }}>
              {undiscoveredCount} Synergies Remain Hidden
            </h3>
            <p style={{ margin: 0, color: '#9ca3af' }}>
              Experiment with different band and venue combinations to discover more powerful synergies!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};