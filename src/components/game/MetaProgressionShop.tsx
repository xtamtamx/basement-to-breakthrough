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
import { Star } from 'lucide-react';
import { SnesModal } from '@components/ui/SnesModal';

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

  const fameChip = (
    <span className="snes-chip">
      <Star size={12} color="var(--snes-gold)" fill="var(--snes-gold)" />
      {fame.toLocaleString()}
    </span>
  );

  return (
    <SnesModal
      onClose={onClose}
      title="Scene Points"
      ariaLabel="Scene Points shop"
      maxWidth={560}
      headerRight={fameChip}
    >
      <p
        className="snes-pixel"
        style={{
          fontSize: '10px',
          color: 'var(--snes-ink-dim)',
          margin: '0 0 12px',
        }}
      >
        Spend Scene Points — every run starts stronger.
      </p>

      {/* Upgrade list */}
      <div>
        {progression.upgrades.map((upgrade) => {
          const maxed = upgrade.currentLevel >= upgrade.maxLevel;
          const cost = nextCost(upgrade.cost.fame || 0, upgrade.currentLevel);
          const affordable = fame >= cost;
          const canBuy = !maxed && affordable;

          return (
            <div
              key={upgrade.id}
              className="snes-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
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
                    className="snes-pixel"
                    style={{ color: 'var(--snes-ink)', fontSize: '11px' }}
                  >
                    {upgrade.name}
                  </span>
                  <LevelPips
                    level={upgrade.currentLevel}
                    max={upgrade.maxLevel}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--snes-ink-dim)' }}>
                  {upgrade.description}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', marginTop: '2px' }}>
                  {upgrade.effects[0]?.description}
                </div>
              </div>
              <button
                onClick={() => handleBuy(upgrade.id)}
                disabled={!canBuy}
                className={`snes-btn${canBuy ? ' snes-btn--gold' : ''}`}
                style={{
                  flexShrink: 0,
                  minWidth: '92px',
                  minHeight: '44px',
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
    </SnesModal>
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
          borderRadius: 0,
          backgroundColor: i < level ? 'var(--snes-gold)' : 'var(--snes-ink-mute)',
        }}
      />
    ))}
  </span>
);

export default MetaProgressionShop;
