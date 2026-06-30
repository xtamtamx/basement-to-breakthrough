import React from 'react';
import { useGameStore } from '@stores/gameStore';
import { haptics } from '@utils/mobile';
import {
  getSceneIdentityTier,
  sceneIdentityPct,
  SCENE_IDENTITY_TIERS,
} from '@game/mechanics/sceneIdentity';

/**
 * Surfaces the sellout↔DIY spectrum the engine already tracks (`diyPoints`) as
 * a compact, tap-to-expand meter. Collapsed: the current archetype + a marker
 * on a sellout→DIY bar. Expanded: a flavor line + the full five-tier ladder.
 *
 * Pure read of store state — no gameplay effect. Surfaced in the "More" menu
 * (pass `inline`); the town still evolves along this same axis (DIY blooms indie
 * shops; a sellout invites the chains), so it reads as the legend for the
 * DIY↔sellout drift the player watches on the map.
 *
 * Expand state is lifted to the parent so this and the Faction meter (stacked
 * just below) are mutually exclusive — only one can be open, so they never
 * overlap or steal each other's taps.
 */
export const SceneIdentityMeter: React.FC<{ open: boolean; onToggle: () => void; inline?: boolean }> = ({ open, onToggle, inline = false }) => {
  const diyPoints = useGameStore((s) => s.diyPoints);

  const tier = getSceneIdentityTier(diyPoints);
  const pct = sceneIdentityPct(diyPoints);

  return (
    <button
      type="button"
      onClick={() => {
        onToggle();
        haptics.light();
      }}
      aria-expanded={open}
      aria-label={`Scene identity: ${tier.label}. Tap to ${open ? 'collapse' : 'expand'}.`}
      className="snes-panel"
      style={{
        ...(inline
          ? { position: 'relative', width: '100%' }
          : { position: 'absolute', top: '12px', left: '12px', width: open ? '212px' : '168px', zIndex: 5 }),
        padding: '8px 9px',
        background: 'rgba(23, 19, 39, 0.92)',
        border: '2px solid #0a0814',
        boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814',
        borderRadius: 0,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'none',
      }}
    >
      {/* Title row */}
      <div
        className="snes-pixel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '7px',
          letterSpacing: 0,
          color: '#6f6796',
          marginBottom: '6px',
        }}
      >
        <span>SCENE IDENTITY</span>
        <span style={{ color: '#6f6796' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Spectrum bar: sellout (left) → DIY (right) with a position marker */}
      <div
        style={{
          position: 'relative',
          height: '8px',
          borderRadius: 0,
          background: 'linear-gradient(90deg, #ff5c57 0%, #ffd23f 50%, #3ad17e 100%)',
          boxShadow: 'inset 0 0 0 1px #0a0814',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-3px',
            bottom: '-3px',
            left: `${pct * 100}%`,
            width: '3px',
            marginLeft: '-1.5px',
            background: '#ffffff',
            boxShadow: '0 0 0 1px #0a0814',
          }}
        />
      </div>

      {/* Pole labels */}
      <div
        className="snes-pixel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '6px',
          color: '#6f6796',
          marginTop: '3px',
        }}
      >
        <span>SELLOUT</span>
        <span>DIY</span>
      </div>

      {/* Current archetype */}
      <div
        className="snes-pixel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginTop: '6px',
          fontSize: '9px',
          color: tier.color,
        }}
      >
        <span style={{ fontSize: '8px' }}>●</span>
        <span>{tier.label}</span>
      </div>

      {open && (
        <>
          <p
            style={{
              fontSize: '10px',
              lineHeight: 1.4,
              color: '#b9b3d6',
              margin: '6px 0 8px',
              fontStyle: 'italic',
            }}
          >
            {tier.flavor}
          </p>

          {/* Full ladder, DIY → sellout, current tier highlighted */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {SCENE_IDENTITY_TIERS.map((t) => {
              const current = t.key === tier.key;
              return (
                <div
                  key={t.key}
                  className="snes-pixel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '7px',
                    color: current ? t.color : '#6f6796',
                    opacity: current ? 1 : 0.7,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      flexShrink: 0,
                      background: t.color,
                      opacity: current ? 1 : 0.45,
                      boxShadow: 'inset 0 0 0 1px #0a0814',
                    }}
                  />
                  <span>{t.label}</span>
                  {current && <span style={{ color: '#6f6796' }}>◄ you</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </button>
  );
};
