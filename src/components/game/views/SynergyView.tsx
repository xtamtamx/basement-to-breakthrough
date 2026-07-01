import React, { useState } from 'react';
import { COMBO_CATALOG } from '@game/mechanics/SynergyEngine';
import { useGameStore } from '@stores/gameStore';
import { Zap, Lock, Trophy } from 'lucide-react';
import { PixelIcon } from '@components/ui/PixelIcon';

type Tier = 'common' | 'rare' | 'legendary';

// View model for a band+venue COMBO synergy in the discovery codex.
interface ComboViewModel {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  discovered: boolean;
  multiplier: number;
  reputationBonus: number;
  recipe: string;
}

export const SynergyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'discovered'>('all');
  const [expanded, setExpanded] = useState<string | null>(null); // tap-to-reveal recipe
  // The single canonical discovery namespace (persisted + idempotent). Combos
  // are recorded here by TurnResolutionEngine.executeShow as they fire.
  const discoveredIds = useGameStore((s) => s.discoveredSynergies);

  const allSynergies: ComboViewModel[] = COMBO_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    tier: c.tier,
    discovered: discoveredIds.includes(c.id),
    multiplier: c.multiplier,
    reputationBonus: c.reputationBonus,
    recipe: c.recipe,
  }));
  const discoveredSynergies = allSynergies.filter((s) => s.discovered);
  const undiscoveredCount = allSynergies.length - discoveredSynergies.length;

  // SNES neon-punk tier palette (legendary=purple, rare=cyan, common=lavender).
  const getTierHex = (tier: string): string => {
    switch (tier) {
      case 'legendary': return 'var(--snes-purple)';
      case 'rare': return 'var(--snes-cyan)';
      default: return 'var(--snes-ink-dim)';
    }
  };
  const getTierFill = (tier: string): string => {
    switch (tier) {
      case 'legendary': return 'rgba(199, 125, 255, 0.12)';
      case 'rare': return 'rgba(76, 201, 240, 0.12)';
      default: return 'rgba(185, 179, 214, 0.1)';
    }
  };
  const getTierIcon = (tier: string) =>
    tier === 'legendary' ? <Trophy size={16} /> : <Zap size={16} />;

  const filteredSynergies =
    filter === 'discovered' ? discoveredSynergies : allSynergies;

  const synergyByTier = filteredSynergies.reduce((acc, synergy) => {
    if (!acc[synergy.tier]) acc[synergy.tier] = [];
    acc[synergy.tier].push(synergy);
    return acc;
  }, {} as Record<string, ComboViewModel[]>);

  const tierOrder: Tier[] = ['legendary', 'rare', 'common'];
  // Guard against an empty denominator (0/0 -> NaN width).
  const pct = (found: number, total: number) => (total > 0 ? (found / total) * 100 : 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--snes-void)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="snes-bar snes-bar--top" style={{ padding: '10px 12px', flexShrink: 0 }}>
        <h2 className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-magenta)', margin: 0 }}>
          Synergy Discovery
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <span className="snes-chip snes-pixel" style={{ fontSize: '11px' }}>
            <Lock size={12} color="var(--snes-ink-mute)" />
            <span style={{ color: 'var(--snes-ink-dim)' }}>{undiscoveredCount} Hidden</span>
          </span>
          <span className="snes-chip snes-pixel" style={{ fontSize: '11px' }}>
            <Zap size={12} color="var(--snes-magenta)" />
            <span style={{ color: 'var(--snes-magenta)' }}>{discoveredSynergies.length} Found</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '10px 12px', backgroundColor: 'var(--snes-bg)', borderBottom: '2px solid var(--snes-line)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            ['all', 'All'],
            ['discovered', 'Discovered'],
          ] as const).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="snes-pixel"
                style={{
                  padding: '10px 12px',
                  backgroundColor: active ? 'var(--snes-magenta)' : 'var(--snes-bg-2)',
                  color: active ? '#f7efe0' : 'var(--snes-ink-mute)',
                  border: '2px solid var(--snes-void)',
                  borderRadius: 0,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  minHeight: '44px',
                  boxShadow: active
                    ? 'inset 2px 2px 0 0 rgba(255,255,255,0.45), inset -2px -2px 0 0 rgba(0,0,0,0.45)'
                    : 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                  transition: 'none'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', paddingBottom: '80px' }}>
        {filteredSynergies.length === 0 ? (
          <div className="snes-panel-inset" style={{ textAlign: 'center', padding: '40px 20px', margin: '8px 0' }}>
            <div style={{ marginBottom: '16px', color: 'var(--snes-magenta)' }}>
              <PixelIcon name="energy" size={40} />
            </div>
            <h3 className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-ink)', marginBottom: '12px' }}>
              No Synergies Found
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--snes-ink-dim)', lineHeight: 1.5 }}>
              Book shows with different band + venue combinations to discover synergies!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tierOrder.map(tier => {
              const synergies = synergyByTier[tier];
              if (!synergies || synergies.length === 0) return null;

              return (
                <section key={tier}>
                  <h3 className="snes-pixel" style={{
                    fontSize: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                    color: getTierHex(tier)
                  }}>
                    {React.cloneElement(getTierIcon(tier), { size: 14, color: getTierHex(tier) })}
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                  </h3>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {synergies.map(synergy => {
                      const isDiscovered = synergy.discovered;
                      return (
                        <div
                          key={synergy.id}
                          onClick={() => isDiscovered && setExpanded(expanded === synergy.id ? null : synergy.id)}
                          role={isDiscovered ? 'button' : undefined}
                          aria-expanded={isDiscovered ? expanded === synergy.id : undefined}
                          style={{
                            backgroundColor: getTierFill(synergy.tier),
                            border: `2px solid ${getTierHex(synergy.tier)}`,
                            borderRadius: 0,
                            padding: '12px',
                            opacity: isDiscovered ? 1 : 0.6,
                            boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)',
                            cursor: isDiscovered ? 'pointer' : 'default',
                            transition: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                            <div style={{ fontSize: '20px', flexShrink: 0 }}>
                              {isDiscovered
                                ? React.cloneElement(getTierIcon(synergy.tier), { size: 20, color: getTierHex(synergy.tier) })
                                : <Lock size={20} color="var(--snes-ink-mute)" />}
                            </div>

                            <div style={{ flex: 1 }}>
                              <h4 className="snes-pixel" style={{
                                fontSize: '10px',
                                color: 'var(--snes-ink)',
                                marginBottom: '8px',
                                lineHeight: 1.4
                              }}>
                                {isDiscovered ? synergy.name : '???'}
                              </h4>

                              {isDiscovered ? (
                                <>
                                  <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: 0, lineHeight: 1.5 }}>
                                    {synergy.description}
                                  </p>
                                  {expanded === synergy.id && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: 1.6 }}>
                                      <div style={{ color: 'var(--snes-green)' }}>
                                        +{Math.round((synergy.multiplier - 1) * 100)}% crowd
                                        {synergy.reputationBonus > 0 && <span style={{ color: 'var(--snes-gold)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}> · +{synergy.reputationBonus} <PixelIcon name="fame" size={12} /> rep</span>}
                                      </div>
                                      <div style={{ color: 'var(--snes-ink-dim)', marginTop: '4px' }}><span style={{ color: 'var(--snes-ink-mute)' }}>How: </span>{synergy.recipe}</div>
                                    </div>
                                  )}
                                  <div style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', marginTop: '6px' }}>
                                    {expanded === synergy.id ? '▲ hide' : '▼ how it fires'}
                                  </div>
                                </>
                              ) : (
                                <p style={{ fontSize: '12px', color: 'var(--snes-ink-mute)', fontStyle: 'italic', margin: 0 }}>
                                  Find the right band + venue pairing to discover this synergy…
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Discovery Progress */}
        <div className="snes-panel snes-panel--magenta" style={{ marginTop: '24px', padding: '12px' }}>
          <h3 className="snes-pixel" style={{
            fontSize: '10px',
            color: 'var(--snes-ink)',
            marginBottom: '12px',
            textTransform: 'uppercase'
          }}>Discovery Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink-dim)' }}>Overall</span>
                <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>
                  {discoveredSynergies.length}/{allSynergies.length}
                </span>
              </div>
              <div className="snes-progress" style={{ height: '10px' }}>
                <div
                  className="snes-progress__fill"
                  style={{ width: `${pct(discoveredSynergies.length, allSynergies.length)}%` }}
                />
              </div>
            </div>

            {tierOrder.map(tier => {
              const tierSynergies = allSynergies.filter(s => s.tier === tier);
              const discoveredInTier = tierSynergies.filter(s => s.discovered).length;
              if (tierSynergies.length === 0) return null;

              return (
                <div key={tier}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="snes-pixel" style={{ fontSize: '11px', color: getTierHex(tier) }}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                    <span className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-ink)' }}>
                      {discoveredInTier}/{tierSynergies.length}
                    </span>
                  </div>
                  <div className="snes-progress" style={{ height: '8px' }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: getTierHex(tier),
                        width: `${pct(discoveredInTier, tierSynergies.length)}%`,
                        boxShadow: 'inset 0 2px 0 0 rgba(255,255,255,0.3)',
                        transition: 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
