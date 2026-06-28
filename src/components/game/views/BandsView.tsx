import React, { useMemo, useState } from 'react';
import { Band, Genre } from '@game/types';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/simpleAudio';
import { useGameStore } from '@stores/gameStore';
import { runManager } from '@game/mechanics/RunManager';
import { nextBookingManagerCost } from '@game/constants/runConstants';
import { UserPlus, Check, Briefcase } from 'lucide-react';
import { bandFactionBadge } from '@game/world/factionDisplay';
import { SnesModal } from '@components/ui/SnesModal';

type Filter = 'all' | 'available' | 'roster';
type Sort = 'popularity' | 'authenticity' | 'name' | 'genre';

// Design-system tokens (src/styles/snes.css). Inline so this view stays one file
// but still speaks the shared palette instead of free-handed hex.
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
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const SORTS: { id: Sort; label: string }[] = [
  { id: 'popularity', label: '★ Top' },
  { id: 'authenticity', label: '✦ Cred' },
  { id: 'name', label: 'A–Z' },
  { id: 'genre', label: 'Genre' },
];

const STAT_ROWS = (b: Band) => ([
  ['Popularity', b.popularity, C.magenta],
  ['Energy', b.energy, C.gold],
  ['Authenticity', b.authenticity, C.green],
  ['Technical', b.technicalSkill, C.cyan],
] as const);

export const BandsView: React.FC = () => {
  const { allBands, rosterBandIds, maxRosterSize, hiredManagers, rosterSlotSources, money, addBandToRoster, removeBandFromRoster, hireBookingManager } = useGameStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('popularity');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSlots, setShowSlots] = useState(false);

  const rosterSet = useMemo(() => new Set(rosterBandIds), [rosterBandIds]);
  const rosterFull = rosterBandIds.length >= maxRosterSize;

  const slotBreakdown: { label: string; value: number }[] = [
    { label: 'Base', value: rosterSlotSources.base },
  ];
  if (rosterSlotSources.mode !== 0)
    slotBreakdown.push({ label: runManager.getCurrentRun()?.config.name ?? 'Run mode', value: rosterSlotSources.mode });
  if (rosterSlotSources.meta > 0) slotBreakdown.push({ label: 'Scene Expansion', value: rosterSlotSources.meta });
  if (rosterSlotSources.city > 0) slotBreakdown.push({ label: 'City unlocks', value: rosterSlotSources.city });
  if (hiredManagers > 0) slotBreakdown.push({ label: 'Booking Managers', value: hiredManagers });

  const managerCost = nextBookingManagerCost(hiredManagers);
  const atSlotCeiling = maxRosterSize >= allBands.length;
  const canAffordManager = money >= managerCost;

  const handleHireManager = () => {
    if (atSlotCeiling || !canAffordManager) { haptics.error(); return; }
    hireBookingManager();
    haptics.success();
  };
  const handleAdd = (id: string) => {
    if (rosterSet.has(id) || rosterFull) { haptics.error(); return; }
    addBandToRoster(id);
    haptics.success();
    audio.achievement();
  };
  const handleRemove = (id: string) => { removeBandFromRoster(id); haptics.light(); };

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

  const availableCount = allBands.length - rosterBandIds.length;
  const filterTabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allBands.length },
    { id: 'roster', label: 'Roster', count: rosterBandIds.length },
    { id: 'available', label: 'Free', count: availableCount },
  ];

  const detailBand = detailId ? allBands.find((b) => b.id === detailId) ?? null : null;

  // Shared little segmented-control button
  const segBtn = (active: boolean, onClick: () => void, label: React.ReactNode, key: string, activeColor = C.magenta) => (
    <button
      key={key}
      onClick={() => { onClick(); haptics.light(); }}
      className="snes-pixel btb-press"
      style={{
        padding: '7px 10px', minHeight: '34px',
        background: active ? activeColor : 'transparent',
        color: active ? (activeColor === C.magenta ? C.ink : C.void) : C.mute,
        border: active ? `2px solid ${activeColor}` : `2px solid transparent`,
        fontSize: '9px', letterSpacing: 0, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.void, overflow: 'hidden' }}>
      {/* ── Thin landscape header: everything on one horizontal row ── */}
      <div className="snes-bar snes-bar--top" style={{
        flexShrink: 0,
        padding: 'calc(6px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 6px calc(12px + env(safe-area-inset-left))',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap',
      }}>
        <h2 className="snes-pixel" style={{ fontSize: '12px', color: C.ink, margin: 0, letterSpacing: 0, flexShrink: 0 }}>Roster</h2>

        <button
          className="snes-chip btb-press"
          onClick={() => { setShowSlots(true); haptics.light(); }}
          title="Roster slots — tap for the breakdown"
          style={{ flexShrink: 0, fontSize: '10px', cursor: 'pointer', color: rosterFull ? C.red : C.green, borderColor: C.void }}
        >
          ♫ {rosterBandIds.length}/{maxRosterSize}{rosterFull ? ' · FULL' : ''}
        </button>

        {/* Filter segmented */}
        <div style={{ display: 'flex', gap: '3px', background: C.bg2, border: `2px solid ${C.void}`, boxShadow: `inset 1px 1px 0 0 ${C.edge}`, padding: '2px', flexShrink: 0 }}>
          {filterTabs.map((tab) => segBtn(filter === tab.id, () => setFilter(tab.id),
            <>{tab.label} <span style={{ opacity: 0.75 }}>{tab.count}</span></>, tab.id))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sort segmented */}
        <span className="snes-pixel" style={{ fontSize: '8px', color: C.mute, letterSpacing: 0, flexShrink: 0 }}>SORT</span>
        <div style={{ display: 'flex', gap: '3px', background: C.bg2, border: `2px solid ${C.void}`, boxShadow: `inset 1px 1px 0 0 ${C.edge}`, padding: '2px', flexShrink: 0 }}>
          {SORTS.map((s) => segBtn(sort === s.id, () => setSort(s.id), s.label, s.id, C.gold))}
        </div>
      </div>

      {/* ── Card grid: fills the wide landscape space, many bands at once ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '10px calc(12px + env(safe-area-inset-right)) calc(4.5rem + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left))',
      }}>
        {visible.length === 0 ? (
          <div className="snes-panel-inset" style={{ textAlign: 'center', padding: '36px 24px', border: `2px solid ${C.gold}`, color: C.dim }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎸</div>
            <h3 className="snes-pixel" style={{ fontSize: '11px', color: C.ink, margin: '0 0 8px', letterSpacing: 0 }}>
              {filter === 'roster' ? 'Empty roster' : 'No bands here'}
            </h3>
            <p style={{ fontFamily: SANS, fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
              {filter === 'roster' ? 'Sign some acts and start a scene worth bragging about.' : 'Nothing matches this filter — try another tab.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(228px, 1fr))', gap: '8px', alignContent: 'start' }}>
            {visible.map((band) => {
              const isInRoster = rosterSet.has(band.id);
              const fb = bandFactionBadge(band);
              const lockedOut = !isInRoster && rosterFull;
              return (
                <div
                  key={band.id}
                  onClick={() => { setDetailId(band.id); haptics.light(); }}
                  style={{
                    backgroundColor: C.bg,
                    borderTop: `2px solid ${C.void}`, borderRight: `2px solid ${C.void}`, borderBottom: `2px solid ${C.void}`,
                    borderLeft: `4px solid ${isInRoster ? C.green : C.void}`,
                    boxShadow: `inset 2px 2px 0 0 ${C.edge}, inset -2px -2px 0 0 ${C.void}`,
                    padding: '8px 8px 8px 10px', cursor: 'pointer',
                    display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0,
                  }}
                >
                  <div className="snes-panel-inset" style={{ fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                    {genreIcon(band.genre)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <h3 style={{
                        fontFamily: SANS, fontWeight: 700, fontSize: '13.5px', color: C.ink, margin: 0, lineHeight: 1.2,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere',
                      }}>{band.name}</h3>
                      {band.isRealArtist && (
                        <span className="snes-pixel" style={{ flexShrink: 0, padding: '1px 4px', background: C.bg2, border: `2px solid ${C.magenta}`, color: C.magenta, fontSize: '8px', letterSpacing: 0 }}>REAL</span>
                      )}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: '11px', color: C.dim, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ flexShrink: 0 }}>{titleCase(band.genre)}</span>
                      {fb && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: fb.color, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: fb.color, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fb.name}</span>
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontFamily: SANS }}>
                      <span title="Popularity" style={{ fontSize: '11px', fontWeight: 700, color: C.magenta }}>★{band.popularity}</span>
                      <span title="Energy" style={{ fontSize: '11px', fontWeight: 700, color: C.gold }}>⚡{band.energy}</span>
                      <span title="Authenticity" style={{ fontSize: '11px', fontWeight: 700, color: C.green }}>✦{band.authenticity}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); if (isInRoster) handleRemove(band.id); else handleAdd(band.id); }}
                    disabled={lockedOut}
                    aria-label={isInRoster ? `Drop ${band.name}` : lockedOut ? 'Roster full' : `Sign ${band.name}`}
                    title={isInRoster ? 'Drop from roster' : lockedOut ? 'Roster full — drop one first' : 'Sign to roster'}
                    className="btb-press"
                    style={{
                      flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isInRoster ? C.bg2 : lockedOut ? C.bg2 : C.green,
                      color: isInRoster ? C.red : lockedOut ? C.mute : C.void,
                      border: `2px solid ${isInRoster ? C.red : lockedOut ? C.line : C.void}`,
                      boxShadow: `inset 2px 2px 0 0 ${C.edge}, inset -2px -2px 0 0 ${C.void}`,
                      cursor: lockedOut ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isInRoster ? <Check size={18} /> : <UserPlus size={18} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Band detail modal ── */}
      {detailBand && (() => {
        const isInRoster = rosterSet.has(detailBand.id);
        const lockedOut = !isInRoster && rosterFull;
        const fb = bandFactionBadge(detailBand);
        return (
          <SnesModal onClose={() => setDetailId(null)} ariaLabel={detailBand.name} maxWidth={460}
            headerRight={<span style={{ fontSize: '22px' }}>{genreIcon(detailBand.genre)}</span>}>
            <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: '20px', color: C.ink, margin: '0 0 4px', lineHeight: 1.15 }}>{detailBand.name}</h2>
            <div style={{ fontFamily: SANS, fontSize: '13px', color: C.dim, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{titleCase(detailBand.genre)}{detailBand.hometown ? ` · ${detailBand.hometown}` : ''}</span>
              {fb && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: fb.color }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: fb.color }} />{fb.name}
                </span>
              )}
              {isInRoster && <span className="snes-pixel" style={{ fontSize: '8px', color: C.green, letterSpacing: 0, border: `2px solid ${C.green}`, padding: '2px 5px' }}>SIGNED</span>}
            </div>

            {detailBand.bio && <p style={{ fontFamily: SANS, fontSize: '13.5px', color: C.dim, margin: '0 0 14px', lineHeight: 1.55 }}>{detailBand.bio}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: detailBand.relationships?.length ? '14px' : '4px' }}>
              {STAT_ROWS(detailBand).map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="snes-pixel" style={{ fontSize: '9px', color: C.dim, letterSpacing: 0 }}>{label}</span>
                    <span className="snes-pixel" style={{ fontSize: '9px', color, letterSpacing: 0 }}>{val}</span>
                  </div>
                  <div className="snes-progress"><div className="snes-progress__fill" style={{ width: `${val}%`, background: color }} /></div>
                </div>
              ))}
            </div>

            {detailBand.relationships && detailBand.relationships.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <h4 className="snes-pixel" style={{ fontSize: '9px', color: C.dim, margin: '0 0 8px', letterSpacing: 0 }}>Relationships</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detailBand.relationships.map((rel) => {
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

            <button
              onClick={() => { if (isInRoster) handleRemove(detailBand.id); else handleAdd(detailBand.id); }}
              disabled={lockedOut}
              className={`snes-btn snes-pixel ${isInRoster ? 'snes-btn--danger' : lockedOut ? 'snes-btn--ghost' : 'snes-btn--green'}`}
              style={{ width: '100%', minHeight: '46px', fontSize: '10px', letterSpacing: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: lockedOut ? 'not-allowed' : 'pointer' }}
            >
              {isInRoster ? <><Check size={16} /> Drop from roster</> : <><UserPlus size={16} /> {lockedOut ? 'Roster full — drop one first' : 'Sign to roster'}</>}
            </button>
          </SnesModal>
        );
      })()}

      {/* ── Slots breakdown modal ── */}
      {showSlots && (
        <SnesModal onClose={() => setShowSlots(false)} title="Roster slots" maxWidth={340}>
          {slotBreakdown.map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontFamily: SANS, fontSize: '13px', color: C.dim, marginBottom: '6px' }}>
              <span>{row.label}</span>
              <span className="snes-pixel" style={{ fontSize: '9px', letterSpacing: 0, color: row.value < 0 ? C.red : row.label === 'Base' ? C.dim : C.green }}>
                {row.label === 'Base' ? row.value : `${row.value > 0 ? '+' : ''}${row.value}`}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingTop: '8px', marginTop: '4px', borderTop: `2px solid ${C.line}` }}>
            <span className="snes-pixel" style={{ fontSize: '9px', letterSpacing: 0, color: C.ink }}>Total</span>
            <span className="snes-pixel" style={{ fontSize: '11px', letterSpacing: 0, color: C.gold }}>{maxRosterSize}</span>
          </div>
          {!atSlotCeiling && (
            <button
              onClick={handleHireManager}
              disabled={!canAffordManager}
              className={`snes-btn snes-pixel ${canAffordManager ? 'snes-btn--gold' : 'snes-btn--ghost'}`}
              style={{ width: '100%', marginTop: '14px', minHeight: '44px', fontSize: '9px', letterSpacing: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: canAffordManager ? 'pointer' : 'not-allowed' }}
            >
              <Briefcase size={13} /> Hire manager · +1 slot · ${managerCost}
            </button>
          )}
        </SnesModal>
      )}
    </div>
  );
};
