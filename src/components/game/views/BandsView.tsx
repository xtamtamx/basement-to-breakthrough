import React, { useMemo, useState } from 'react';
import { Band, Genre } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/simpleAudio';
import { useGameStore } from '@stores/gameStore';
import { runManager } from '@game/mechanics/RunManager';
import { nextBookingManagerCost } from '@game/constants/runConstants';
import { UserPlus, Check, Briefcase, ChevronDown } from 'lucide-react';
import { bandFactionBadge } from '@game/world/factionDisplay';

type Filter = 'all' | 'available' | 'roster';
type Sort = 'popularity' | 'authenticity' | 'name' | 'genre';

// Design-system tokens (src/styles/snes.css). Inline so this view stays a single
// file but still speaks the shared palette instead of free-handed hex.
const C = {
  void: 'var(--snes-void)', bg: 'var(--snes-bg)', bg2: 'var(--snes-bg-2)',
  line: 'var(--snes-line)', edge: 'var(--snes-edge-lt)',
  ink: 'var(--snes-ink)', dim: 'var(--snes-ink-dim)', mute: 'var(--snes-ink-mute)',
  magenta: 'var(--snes-magenta)', gold: 'var(--snes-gold)',
  green: 'var(--snes-green)', red: 'var(--snes-red)', cyan: 'var(--snes-cyan)',
};
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const GENRE_ICON: Partial<Record<Genre, string>> = {
  [Genre.PUNK]: '🎸', [Genre.METAL]: '🤘', [Genre.HARDCORE]: '👊',
  [Genre.GRUNGE]: '🧥', [Genre.INDIE]: '🌼', [Genre.EMO]: '🖤',
  [Genre.DOOM]: '💀', [Genre.SLUDGE]: '🛢️', [Genre.NOISE]: '📻',
  [Genre.POWERVIOLENCE]: '⚡', [Genre.EXPERIMENTAL]: '🔬',
  [Genre.ALTERNATIVE]: '🎵', [Genre.ELECTRONIC]: '🎹',
};
const genreIcon = (g: Genre) => GENRE_ICON[g] ?? '🎵';
// "POWERVIOLENCE" -> "Powerviolence"
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const SORTS: { id: Sort; label: string }[] = [
  { id: 'popularity', label: '★ Top' },
  { id: 'authenticity', label: '✦ Cred' },
  { id: 'name', label: 'A–Z' },
  { id: 'genre', label: 'Genre' },
];

export const BandsView: React.FC = () => {
  const { allBands, rosterBandIds, maxRosterSize, hiredManagers, rosterSlotSources, money, addBandToRoster, removeBandFromRoster, hireBookingManager } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('popularity');
  const [showSlotBreakdown, setShowSlotBreakdown] = useState(false);

  const rosterSet = useMemo(() => new Set(rosterBandIds), [rosterBandIds]);
  const rosterFull = rosterBandIds.length >= maxRosterSize;

  const slotBreakdown: { label: string; value: number }[] = [
    { label: 'Base', value: rosterSlotSources.base },
  ];
  if (rosterSlotSources.mode !== 0)
    slotBreakdown.push({ label: runManager.getCurrentRun()?.config.name ?? 'Run mode', value: rosterSlotSources.mode });
  if (rosterSlotSources.meta > 0)
    slotBreakdown.push({ label: 'Scene Expansion', value: rosterSlotSources.meta });
  if (rosterSlotSources.city > 0)
    slotBreakdown.push({ label: 'City unlocks', value: rosterSlotSources.city });
  if (hiredManagers > 0)
    slotBreakdown.push({ label: 'Booking Managers', value: hiredManagers });

  const managerCost = nextBookingManagerCost(hiredManagers);
  const atSlotCeiling = maxRosterSize >= allBands.length;
  const canAffordManager = money >= managerCost;

  const handleHireManager = () => {
    if (atSlotCeiling || !canAffordManager) { haptics.error(); return; }
    hireBookingManager();
    haptics.success();
  };
  const handleAddToRoster = (bandId: string) => {
    if (rosterSet.has(bandId)) return;
    if (rosterFull) { haptics.error(); return; }
    addBandToRoster(bandId);
    haptics.success();
    audio.achievement(); // signing is an acquire beat — give it a flourish
  };
  const handleRemoveFromRoster = (bandId: string) => {
    removeBandFromRoster(bandId);
    haptics.light();
  };
  const toggleExpand = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
    haptics.light();
  };

  const visible = useMemo(() => {
    const base = allBands.filter((b) =>
      filter === 'roster' ? rosterSet.has(b.id)
      : filter === 'available' ? !rosterSet.has(b.id)
      : true,
    );
    const byName = (a: Band, b: Band) => a.name.localeCompare(b.name);
    return [...base].sort((a, b) => {
      switch (sort) {
        case 'name': return byName(a, b);
        case 'authenticity': return b.authenticity - a.authenticity || byName(a, b);
        case 'genre': return a.genre.localeCompare(b.genre) || b.popularity - a.popularity;
        default: return b.popularity - a.popularity || byName(a, b);
      }
    });
  }, [allBands, filter, sort, rosterSet]);

  // Genre section headers only when sorting by genre (turns 36 bands into
  // browsable chunks). Otherwise one flat sorted list.
  const groups = useMemo(() => {
    if (sort !== 'genre') return [{ key: '', bands: visible }];
    const out: { key: string; bands: Band[] }[] = [];
    for (const b of visible) {
      const key = b.genre;
      const last = out[out.length - 1];
      if (last && last.key === key) last.bands.push(b);
      else out.push({ key, bands: [b] });
    }
    return out;
  }, [visible, sort]);

  const availableCount = allBands.length - rosterBandIds.length;
  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allBands.length },
    { id: 'roster', label: 'Roster', count: rosterBandIds.length },
    { id: 'available', label: 'Free', count: availableCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.void, overflow: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="snes-bar snes-bar--top" style={{
        padding: 'calc(8px + env(safe-area-inset-top)) 12px 8px',
        flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Title + slot chip on one line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <h2 className="snes-pixel" style={{ fontSize: '13px', color: C.ink, margin: 0, letterSpacing: 0 }}>Roster</h2>
          <button
            className="snes-chip"
            onClick={() => setShowSlotBreakdown((v) => !v)}
            aria-expanded={showSlotBreakdown}
            title="Where do my roster slots come from?"
            style={{ fontSize: '10px', cursor: 'pointer', color: rosterFull ? C.red : C.green, borderColor: C.void, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            ♫ {rosterBandIds.length}/{maxRosterSize}{rosterFull ? ' · FULL' : ''}
            <ChevronDown size={11} style={{ transform: showSlotBreakdown ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        {/* Slot breakdown + manager hire (tucked away — rare action, off the main bar) */}
        {showSlotBreakdown && (
          <div className="snes-panel-inset" style={{ padding: '10px' }}>
            {slotBreakdown.map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontFamily: SANS, fontSize: '12px', color: C.dim, marginBottom: '5px' }}>
                <span>{row.label}</span>
                <span className="snes-pixel" style={{ fontSize: '9px', letterSpacing: 0, color: row.value < 0 ? C.red : row.label === 'Base' ? C.dim : C.green }}>
                  {row.label === 'Base' ? row.value : `${row.value > 0 ? '+' : ''}${row.value}`}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingTop: '6px', marginTop: '2px', borderTop: `2px solid ${C.line}` }}>
              <span className="snes-pixel" style={{ fontSize: '9px', letterSpacing: 0, color: C.ink }}>Total</span>
              <span className="snes-pixel" style={{ fontSize: '10px', letterSpacing: 0, color: C.gold }}>{maxRosterSize}</span>
            </div>
            {!atSlotCeiling && (
              <button
                onClick={handleHireManager}
                disabled={!canAffordManager}
                className={`snes-btn snes-pixel ${canAffordManager ? 'snes-btn--gold' : 'snes-btn--ghost'}`}
                style={{ width: '100%', marginTop: '10px', minHeight: '40px', fontSize: '9px', letterSpacing: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: canAffordManager ? 'pointer' : 'not-allowed' }}
              >
                <Briefcase size={13} /> Hire manager · +1 slot · ${managerCost}
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: C.bg2, border: `2px solid ${C.void}`, boxShadow: `inset 2px 2px 0 0 ${C.edge}, inset -2px -2px 0 0 ${C.void}`, padding: '3px' }}>
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setFilter(tab.id); haptics.light(); }}
                className="snes-pixel btb-press"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '9px 4px', minHeight: '42px',
                  backgroundColor: active ? C.magenta : 'transparent',
                  color: active ? C.ink : C.mute, border: 'none', fontSize: '9px', letterSpacing: 0, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {tab.label} <span style={{ opacity: 0.75 }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="snes-pixel" style={{ fontSize: '9px', color: C.mute, letterSpacing: 0, flexShrink: 0 }}>Sort</span>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {SORTS.map((s) => {
              const active = sort === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSort(s.id); haptics.light(); }}
                  className="snes-pixel btb-press"
                  style={{
                    flex: 1, padding: '7px 4px', minHeight: '34px',
                    background: active ? C.bg : 'transparent',
                    color: active ? C.gold : C.mute,
                    border: `2px solid ${active ? C.gold : C.line}`,
                    fontSize: '9px', letterSpacing: 0, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {visible.length === 0 ? (
          <div className="snes-panel-inset" style={{ textAlign: 'center', padding: '48px 24px', border: `2px solid ${C.gold}`, color: C.dim }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎸</div>
            <h3 className="snes-pixel" style={{ fontSize: '11px', color: C.ink, margin: '0 0 10px', letterSpacing: 0 }}>
              {filter === 'roster' ? 'Empty roster' : 'No bands here'}
            </h3>
            <p style={{ fontFamily: SANS, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              {filter === 'roster' ? 'Sign some acts and start a scene worth bragging about.' : 'Nothing matches this filter — try another tab.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map((group) => (
              <React.Fragment key={group.key || 'all'}>
                {group.key && (
                  <div className="snes-pixel" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: C.cyan, letterSpacing: 0, margin: '6px 2px 0' }}>
                    <span>{genreIcon(group.key as Genre)} {titleCase(group.key)}</span>
                    <span style={{ flex: 1, height: '2px', background: C.line }} />
                    <span style={{ color: C.mute }}>{group.bands.length}</span>
                  </div>
                )}
                {group.bands.map((band) => {
                  const isInRoster = rosterSet.has(band.id);
                  const isSelected = selectedId === band.id;
                  const fb = bandFactionBadge(band);
                  const lockedOut = !isInRoster && rosterFull;
                  return (
                    <div key={band.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Card */}
                      <div
                        onClick={() => toggleExpand(band.id)}
                        style={{
                          backgroundColor: C.bg,
                          borderTop: `2px solid ${isSelected ? C.magenta : C.void}`,
                          borderRight: `2px solid ${isSelected ? C.magenta : C.void}`,
                          borderBottom: `2px solid ${isSelected ? C.magenta : C.void}`,
                          borderLeft: `4px solid ${isInRoster ? C.green : isSelected ? C.magenta : C.void}`,
                          boxShadow: `inset 2px 2px 0 0 ${C.edge}, inset -2px -2px 0 0 ${C.void}`,
                          padding: '10px 10px 10px 12px', cursor: 'pointer',
                          display: 'flex', gap: '10px', alignItems: 'center',
                        }}
                      >
                        {/* Genre icon */}
                        <div className="snes-panel-inset" style={{ fontSize: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px' }}>
                          {genreIcon(band.genre)}
                        </div>

                        {/* Name + meta + stats */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontFamily: SANS, fontWeight: 700, fontSize: '15px', color: C.ink, margin: 0, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                              {band.name}
                            </h3>
                            {band.isRealArtist && (
                              <span className="snes-pixel" style={{ flexShrink: 0, padding: '2px 5px', background: C.bg2, border: `2px solid ${C.magenta}`, color: C.magenta, fontSize: '9px', letterSpacing: 0 }}>REAL</span>
                            )}
                          </div>
                          <div style={{ fontFamily: SANS, fontSize: '12px', color: C.dim, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{titleCase(band.genre)}{band.hometown ? ` · ${band.hometown}` : ''}</span>
                            {fb && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: fb.color, whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: fb.color, flexShrink: 0 }} />
                                {fb.name}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontFamily: SANS }}>
                            <span title="Popularity" style={{ fontSize: '12px', fontWeight: 700, color: C.magenta }}>★ {band.popularity}</span>
                            <span title="Energy" style={{ fontSize: '12px', fontWeight: 700, color: C.gold }}>⚡ {band.energy}</span>
                            <span title="Authenticity" style={{ fontSize: '12px', fontWeight: 700, color: C.green }}>✦ {band.authenticity}</span>
                          </div>
                        </div>

                        {/* Quick sign / drop — no need to expand */}
                        <button
                          onClick={(e) => { e.stopPropagation(); if (isInRoster) handleRemoveFromRoster(band.id); else handleAddToRoster(band.id); }}
                          disabled={lockedOut}
                          aria-label={isInRoster ? `Drop ${band.name}` : lockedOut ? 'Roster full' : `Sign ${band.name}`}
                          title={isInRoster ? 'Drop from roster' : lockedOut ? 'Roster full — drop one first' : 'Sign to roster'}
                          className="btb-press"
                          style={{
                            flexShrink: 0, width: '44px', height: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isInRoster ? C.bg2 : lockedOut ? C.bg2 : C.green,
                            color: isInRoster ? C.red : lockedOut ? C.mute : C.void,
                            border: `2px solid ${isInRoster ? C.red : lockedOut ? C.line : C.void}`,
                            boxShadow: `inset 2px 2px 0 0 ${C.edge}, inset -2px -2px 0 0 ${C.void}`,
                            cursor: lockedOut ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isInRoster ? <Check size={20} /> : <UserPlus size={20} />}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="snes-panel" style={{ padding: '12px' }}>
                          {band.bio && (
                            <p style={{ fontFamily: SANS, fontSize: '13px', color: C.dim, margin: '0 0 12px', lineHeight: 1.5 }}>{band.bio}</p>
                          )}

                          {/* Full stats as unified progress bars */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: band.relationships?.length ? '12px' : 0 }}>
                            {([
                              ['Popularity', band.popularity, C.magenta],
                              ['Energy', band.energy, C.gold],
                              ['Authenticity', band.authenticity, C.green],
                              ['Technical', band.technicalSkill, C.cyan],
                            ] as const).map(([label, val, color]) => (
                              <div key={label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span className="snes-pixel" style={{ fontSize: '9px', color: C.dim, letterSpacing: 0 }}>{label}</span>
                                  <span className="snes-pixel" style={{ fontSize: '9px', color, letterSpacing: 0 }}>{val}</span>
                                </div>
                                <div className="snes-progress">
                                  <div className="snes-progress__fill" style={{ width: `${val}%`, background: color }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Relationships */}
                          {band.relationships && band.relationships.length > 0 && (
                            <div>
                              <h4 className="snes-pixel" style={{ fontSize: '9px', color: C.dim, margin: '0 0 8px', letterSpacing: 0 }}>Relationships</h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {band.relationships.map((rel) => {
                                  const friendly = rel.relationship >= 0;
                                  return (
                                    <span key={rel.bandId} style={{ fontFamily: SANS, fontSize: '12px', fontWeight: 600, padding: '5px 10px', background: C.bg2, border: `2px solid ${friendly ? C.green : C.red}`, color: friendly ? C.green : C.red }}>
                                      {friendly ? '👫' : '⚔️'} {allBands.find((b) => b.id === rel.bandId)?.name ?? '???'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
