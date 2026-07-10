import React, { useEffect, useMemo, useState } from 'react';
import {
  COMBO_CATALOG,
  loadDiscoveredCombos,
  persistDiscoveredCombos,
} from '@game/mechanics/SynergyEngine';
import { synergyManager, EquippedSynergy } from '@game/mechanics/SynergyManager';
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

/** Condition pill for an equipped instinct: LIVE / dormant-with-reason /
 *  expired / per-show. Stat gates go through synergyManager.checkCondition —
 *  the SAME switch triggerSynergies pays from, so this can't lie. */
const conditionPill = (
  eq: EquippedSynergy,
  stats: { currentTurn: number; reputation: number; fans: number; stress: number },
): { label: string; color: string } => {
  const c = eq.synergy.condition;
  if (!c) return { label: 'ALWAYS ON', color: 'var(--snes-green)' };
  // Booking gates have no answer outside a show — say what bill lights them up.
  if (c.type === 'VENUE_TYPE' || c.type === 'GENRE_MATCH') {
    return { label: c.description, color: 'var(--snes-cyan)' };
  }
  if (c.type === 'TURN_RANGE') {
    const [, end] = (c.value as string).split('-').map(Number);
    if (stats.currentTurn > end) return { label: `Ended turn ${end}`, color: 'var(--snes-red)' };
  }
  return synergyManager.checkCondition(c, stats)
    ? { label: 'LIVE', color: 'var(--snes-green)' }
    : { label: c.description, color: 'var(--snes-gold)' };
};

export const SynergyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'discovered'>('all');
  const [expanded, setExpanded] = useState<string | null>(null); // tap-to-reveal recipe
  // Run-scoped discovery namespace (recorded by TurnResolutionEngine.executeShow
  // as combos fire). The codex renders the UNION with the cross-run set below —
  // but the store copy must stay per-run (it feeds in-run balance gates).
  const runDiscovered = useGameStore((s) => s.discoveredSynergies);
  // Fold the live run's finds into the persistent codex (idempotent) so the
  // compendium survives "Play Again" instead of zeroing every run.
  useEffect(() => {
    persistDiscoveredCombos(runDiscovered);
  }, [runDiscovered]);
  const discoveredIds = useMemo(
    () => new Set([...loadDiscoveredCombos(), ...runDiscovered]),
    [runDiscovered],
  );

  // Equipped instincts — the build being piloted. Singleton read is fine here:
  // the view remounts on navigation and instincts only change via modals.
  const equipped = synergyManager.getEquippedSynergies();
  const maxSlots = synergyManager.getMaxSlots();
  const currentTurn = useGameStore((s) => s.currentRound);
  const reputation = useGameStore((s) => s.reputation);
  const fans = useGameStore((s) => s.fans);
  const stress = useGameStore((s) => s.stress);
  const pillStats = { currentTurn, reputation, fans, stress };

  const allSynergies: ComboViewModel[] = COMBO_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    tier: c.tier,
    discovered: discoveredIds.has(c.id),
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
      <div className="snes-bar snes-bar--top" style={{ padding: '10px 12px', paddingTop: 'calc(10px + env(safe-area-inset-top))', flexShrink: 0 }}>
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

      {/* Equipped instincts — the build you're piloting, pinned above the codex
          as a horizontally scrolling strip (landscape wide-short layout). */}
      <div style={{ padding: '10px 12px 8px', backgroundColor: 'var(--snes-bg)', borderBottom: '2px solid var(--snes-line)', flexShrink: 0 }}>
        <h3 className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-purple)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
          Your Instincts · {equipped.length}/{maxSlots}
        </h3>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {equipped.map((eq) => {
            const pill = conditionPill(eq, pillStats);
            return (
              <div
                key={eq.synergy.id}
                className="snes-panel"
                style={{ minWidth: '200px', maxWidth: '240px', flexShrink: 0, padding: '8px 10px', borderColor: pill.color }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <PixelIcon name={eq.synergy.icon} size={14} style={{ flexShrink: 0, color: 'var(--snes-gold)' }} />
                  <span className="snes-pixel" style={{ fontSize: '9px', color: 'var(--snes-ink)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {eq.synergy.name}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', lineHeight: 1.4, marginBottom: '6px' }}>
                  {eq.synergy.effects.map((e) => e.description).join(' · ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span className="snes-pixel" style={{ fontSize: '8px', color: pill.color, lineHeight: 1.4, textTransform: 'uppercase' }}>
                    {pill.label}
                  </span>
                  {eq.synergy.trigger !== 'PASSIVE' && (
                    <span style={{ fontSize: '10px', color: 'var(--snes-ink-mute)', flexShrink: 0 }} title="Times this instinct kicked in this run">
                      ×{eq.timesTriggered}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, maxSlots - equipped.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="snes-pixel"
              style={{
                minWidth: '110px',
                flexShrink: 0,
                border: '2px dashed var(--snes-line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--snes-ink-mute)',
                fontSize: '9px',
              }}
            >
              OPEN SLOT
            </div>
          ))}
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
                className={active ? 'snes-btn snes-pixel' : 'snes-pixel'}
                style={{
                  padding: '10px 12px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  minHeight: '44px',
                  transition: 'none',
                  ...(active ? {} : {
                    backgroundColor: 'var(--snes-bg-2)',
                    color: 'var(--snes-ink-dim)',
                    border: '2px solid var(--snes-void)',
                    borderRadius: 0,
                    boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)'
                  })
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
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
                    color: 'var(--skin-on-void, var(--snes-ink))'
                  }}>
                    {React.cloneElement(getTierIcon(tier), { size: 14, color: 'var(--skin-on-void-dim, var(--snes-ink-dim))' })}
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                  </h3>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {synergies.map(synergy => {
                      const isDiscovered = synergy.discovered;
                      return (
                        <div
                          key={synergy.id}
                          className="snes-panel"
                          onClick={() => isDiscovered && setExpanded(expanded === synergy.id ? null : synergy.id)}
                          role={isDiscovered ? 'button' : undefined}
                          aria-expanded={isDiscovered ? expanded === synergy.id : undefined}
                          style={{
                            borderColor: getTierHex(synergy.tier),
                            padding: '12px',
                            opacity: isDiscovered ? 1 : 0.6,
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
