/**
 * MetaProgressionShop - spend banked fame on permanent run-start upgrades.
 *
 * Closes the roguelike meta loop: a run's ceremony banks fame, and here you
 * spend it so every future run starts stronger. The manager is a plain
 * singleton (not reactive), so a local refresh counter re-reads it after each
 * purchase.
 */

import React, { useState } from 'react';
import { metaProgressionManager } from '@game/mechanics/MetaProgressionManager';
import { haptics } from '@utils/mobile';
import { soundManager } from '@/game/audio/SoundManager';
import { X, Star } from 'lucide-react';

interface MetaProgressionShopProps {
  onClose: () => void;
}

export const MetaProgressionShop: React.FC<MetaProgressionShopProps> = ({
  onClose,
}) => {
  const [, setRefresh] = useState(0);
  const progression = metaProgressionManager.getProgression();
  const fame = progression.currency.fame;

  const handleBuy = (upgradeId: string) => {
    const result = metaProgressionManager.purchaseUpgrade(upgradeId);
    if (result.success) {
      haptics.success();
      soundManager.playClick();
      setRefresh((n) => n + 1);
    } else {
      haptics.error();
    }
  };

  // Cost of an upgrade's next level (mirrors purchaseUpgrade's escalation)
  const nextCost = (baseFame: number, currentLevel: number) =>
    baseFame * (currentLevel + 1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '12px',
      }}
    >
      <div
        style={{
          backgroundImage: 'linear-gradient(to bottom, #1a1030, #0c0a14)',
          border: '3px solid #f72585',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              Scene Points
            </h1>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
              Spend Scene Points — every run starts stronger.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(247,37,133,0.15)',
                border: '1px solid #f72585',
                borderRadius: '999px',
                padding: '5px 12px',
              }}
            >
              <Star size={14} color="#f72585" fill="#f72585" />
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '15px' }}>
                {fame.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close shop"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '999px',
                background: 'transparent',
                border: '1px solid #374151',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Upgrade list */}
        <div style={{ overflowY: 'auto', padding: '12px 14px' }}>
          {progression.upgrades.map((upgrade) => {
            const maxed = upgrade.currentLevel >= upgrade.maxLevel;
            const cost = nextCost(upgrade.cost.fame || 0, upgrade.currentLevel);
            const affordable = fame >= cost;
            const canBuy = !maxed && affordable;

            return (
              <div
                key={upgrade.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1f2937',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}
                    >
                      {upgrade.name}
                    </span>
                    <LevelPips
                      level={upgrade.currentLevel}
                      max={upgrade.maxLevel}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {upgrade.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    {upgrade.effects[0]?.description}
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(upgrade.id)}
                  disabled={!canBuy}
                  style={{
                    flexShrink: 0,
                    minWidth: '92px',
                    minHeight: '44px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                    backgroundColor: maxed
                      ? '#374151'
                      : canBuy
                        ? '#f72585'
                        : '#3f2233',
                    color: maxed ? '#9ca3af' : canBuy ? '#ffffff' : '#9b6b82',
                  }}
                >
                  {maxed ? (
                    'MAX'
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={12} fill="currentColor" />
                      {cost.toLocaleString()}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LevelPips: React.FC<{ level: number; max: number }> = ({ level, max }) => (
  <span style={{ display: 'inline-flex', gap: '3px' }}>
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '2px',
          backgroundColor: i < level ? '#f72585' : '#374151',
        }}
      />
    ))}
  </span>
);

export default MetaProgressionShop;
