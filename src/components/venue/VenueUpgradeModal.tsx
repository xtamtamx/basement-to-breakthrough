import React, { useState } from 'react';
import { Venue, EquipmentType } from '@game/types';
import { venueUpgradeSystem } from '@game/mechanics/VenueUpgradeSystem';
import { useGameStore } from '@stores/gameStore';
import { formatMoney } from '@utils/formatters';
import { haptics } from '@utils/mobile';
import { Tab } from '@headlessui/react';
import { X } from 'lucide-react';
import { PixelIcon } from '@components/ui/PixelIcon';

interface VenueUpgradeModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
}

// A neon effect chip: outlined pixel tag in the brand palette.
const chip = (key: string, label: string, color: string) => (
  <span
    key={key}
    className="snes-pixel"
    style={{ fontSize: '7px', letterSpacing: 0, color, backgroundColor: 'var(--snes-bg-2)', border: `2px solid ${color}`, padding: '3px 6px' }}
  >
    {label}
  </span>
);

// Every effect an equipment piece carries, as neon chips. Single source of
// truth so the Gear and Owned tabs always show the same (now-live) effects.
const effectChips = (fx: import('@game/types').EquipmentEffects) =>
  [
    fx.acousticsBonus ? chip('acu', `+${fx.acousticsBonus}% acoustics`, 'var(--snes-purple)') : null,
    fx.atmosphereBonus ? chip('atm', `+${fx.atmosphereBonus}% atmosphere`, 'var(--snes-green)') : null,
    fx.capacityBonus ? chip('cap', `+${fx.capacityBonus}% capacity`, 'var(--snes-cyan)') : null,
    fx.reputationMultiplier ? chip('rep', `×${fx.reputationMultiplier} rep`, 'var(--snes-gold)') : null,
    fx.passiveIncome ? chip('inc', `+${formatMoney(fx.passiveIncome)}/turn`, 'var(--snes-green)') : null,
    fx.passiveFame ? chip('fame', `+${fx.passiveFame} fans/turn`, 'var(--snes-magenta)') : null,
    fx.stressReduction ? chip('str', `−${fx.stressReduction}% band stress`, 'var(--snes-cyan)') : null,
    // Positive = fewer incidents (good, cyan); negative = an open-air gamble (bad, red).
    fx.incidentReduction
      ? fx.incidentReduction > 0
        ? chip('inc-red', `−${fx.incidentReduction}% incidents`, 'var(--snes-cyan)')
        : chip('inc-red', `+${-fx.incidentReduction}% incident risk`, 'var(--snes-red)')
      : null,
  ].filter(Boolean);

// Five-pip quality meter (gold filled / dim empty).
const stars = (quality: number) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
    {[...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < quality ? 'var(--snes-gold)' : 'var(--snes-line)', display: 'flex' }}>
        <PixelIcon name="fame" size={10} />
      </span>
    ))}
  </div>
);

export const VenueUpgradeModal: React.FC<VenueUpgradeModalProps> = ({
  venue,
  isOpen,
  onClose
}) => {
  const store = useGameStore();
  const [selectedTab, setSelectedTab] = useState(0);
  // One-time "what is this" intro the first time a player opens the gear shop.
  const [introSeen, setIntroSeen] = useState(() => {
    try {
      return localStorage.getItem('btb-venue-intro-v1') === '1';
    } catch {
      return true;
    }
  });
  const dismissIntro = () => {
    setIntroSeen(true);
    try {
      localStorage.setItem('btb-venue-intro-v1', '1');
    } catch {
      /* private mode — just hide it this session */
    }
  };

  if (!isOpen) return null;

  const availableUpgrades = venueUpgradeSystem.getAvailableUpgrades(venue);
  const availableEquipment = venueUpgradeSystem.getAvailableEquipment(venue);
  const ownedEquipment = venue.equipment.filter((e) => e.owned);
  const upkeepCost = venueUpgradeSystem.calculateUpkeepCost(venue);

  const handleUpgrade = (upgradeId: string) => {
    if (venueUpgradeSystem.applyUpgrade(venue.id, upgradeId)) haptics.success();
    else haptics.error();
  };

  const handlePurchaseEquipment = (equipmentId: string) => {
    if (venueUpgradeSystem.purchaseEquipment(venue.id, equipmentId)) haptics.success();
    else haptics.error();
  };

  const handleRentEquipment = (equipmentId: string) => {
    if (venueUpgradeSystem.rentEquipment(venue.id, equipmentId)) haptics.success();
    else haptics.error();
  };

  const handleRepairEquipment = (equipmentId: string) => {
    if (venueUpgradeSystem.repairEquipment(venue.id, equipmentId)) haptics.success();
    else haptics.error();
  };

  const getEquipmentIcon = (type: EquipmentType): string => {
    switch (type) {
      case EquipmentType.PA_SYSTEM: return 'megaphone';
      case EquipmentType.LIGHTING: return 'sparkle';
      case EquipmentType.STAGE: return 'building';
      case EquipmentType.BACKLINE: return 'guitar';
      case EquipmentType.RECORDING: return 'note';
      default: return 'clipboard';
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: '40px',
    padding: '9px 6px',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    transition: 'none',
    whiteSpace: 'nowrap',
    background: active ? 'var(--snes-magenta)' : 'transparent',
    color: active ? '#f7efe0' : 'var(--snes-ink-mute)',
    fontSize: '8px',
    letterSpacing: 0,
  });

  const actionBtn = (affordable: boolean, variant: string): string =>
    `snes-btn snes-pixel snes-btn--sm ${affordable ? variant : 'snes-btn--ghost'}`;
  const actionStyle = (affordable: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: '44px',
    fontSize: '8px',
    cursor: affordable ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="snes-modal" onClick={onClose}>
      <div className="snes-modal__sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="snes-pixel" style={{ fontSize: '12px', color: 'var(--snes-magenta)', margin: '0 0 4px', letterSpacing: 0, lineHeight: 1.4 }}>{venue.name}</h2>
            <p style={{ fontSize: '11px', color: 'var(--snes-ink-dim)', margin: 0 }}>Build out the room — gear, capacity, vibe.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--snes-bg-3)', color: 'var(--snes-ink-dim)', border: '2px solid var(--snes-void)', boxShadow: 'inset 1px 1px 0 var(--snes-edge-lt)', cursor: 'pointer', borderRadius: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Venue stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
          <span className="snes-chip" style={{ fontSize: '8px', color: 'var(--snes-cyan)' }}>CAP {venue.capacity}</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: 'var(--snes-purple)' }}>ACU {venue.acoustics}%</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: 'var(--snes-green)' }}>ATM {venue.atmosphere}%</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: 'var(--snes-red)' }}>−{formatMoney(upkeepCost)}/turn</span>
        </div>

        {!introSeen && (
          <div className="snes-panel-inset" style={{ padding: '12px', marginBottom: '14px', borderLeft: '4px solid var(--snes-gold)' }}>
            <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: 0, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--snes-gold)' }}>New here?</strong> Kit out this room to pull bigger,
              calmer, safer shows. <strong style={{ color: 'var(--snes-ink)' }}>Buy</strong> gear to keep it (it
              wears down — repair it on the Owned tab), or <strong style={{ color: 'var(--snes-ink)' }}>Rent</strong> it
              for a single show. The chips on each piece show exactly what it does.
            </p>
            <button
              onClick={dismissIntro}
              className="snes-btn snes-btn--gold snes-btn--sm snes-pixel"
              style={{ marginTop: '10px', minHeight: '36px', fontSize: '8px', cursor: 'pointer', padding: '0 12px' }}
            >
              Got it
            </button>
          </div>
        )}

        <Tab.Group selectedIndex={selectedTab} onChange={(i) => { setSelectedTab(i); haptics.light(); }}>
          <Tab.List
            style={{ display: 'flex', gap: '4px', background: 'var(--snes-bg-2)', border: '2px solid var(--snes-void)', boxShadow: 'inset 2px 2px 0 0 var(--snes-edge-lt), inset -2px -2px 0 0 var(--snes-void)', borderRadius: 0, padding: '3px', marginBottom: '14px' }}
          >
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 0)}>Upgrades {availableUpgrades.length}</Tab>
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 1)}>Gear {availableEquipment.length}</Tab>
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 2)}>Owned {ownedEquipment.length}</Tab>
          </Tab.List>

          <Tab.Panels>
            {/* Upgrades */}
            <Tab.Panel>
              {availableUpgrades.length === 0 ? (
                <p style={{ color: 'var(--snes-ink-mute)', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                  No upgrades available. Check back with more money or reputation.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {availableUpgrades.map((upgrade) => {
                    const affordable = store.money >= upgrade.cost;
                    return (
                      <div key={upgrade.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ minWidth: 0 }}>
                            <h3 className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{upgrade.name}</h3>
                            <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: '5px 0 0', lineHeight: 1.4 }}>{upgrade.description}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-green)', letterSpacing: 0 }}>{formatMoney(upgrade.cost)}</div>
                            {upgrade.upkeepCost ? (
                              <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', marginTop: '3px' }}>+{formatMoney(upgrade.upkeepCost)}/turn</div>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {upgrade.effects.capacity ? chip('cap', `+${upgrade.effects.capacity} cap`, 'var(--snes-cyan)') : null}
                          {upgrade.effects.acoustics ? chip('acu', `+${upgrade.effects.acoustics}% acoustics`, 'var(--snes-purple)') : null}
                          {upgrade.effects.atmosphere ? chip('atm', `+${upgrade.effects.atmosphere}% atmosphere`, 'var(--snes-green)') : null}
                          {upgrade.effects.authenticity ? chip('auth', `${upgrade.effects.authenticity > 0 ? '+' : ''}${upgrade.effects.authenticity}% cred`, upgrade.effects.authenticity > 0 ? 'var(--snes-gold)' : 'var(--snes-red)') : null}
                          {upgrade.effects.revenue ? chip('rev', `+${upgrade.effects.revenue}% revenue`, 'var(--snes-green)') : null}
                        </div>

                        <button
                          onClick={() => handleUpgrade(upgrade.id)}
                          disabled={!affordable}
                          className={actionBtn(affordable, 'snes-btn')}
                          style={{ width: '100%', minHeight: '44px', fontSize: '11px', cursor: affordable ? 'pointer' : 'not-allowed' }}
                        >
                          {affordable ? 'Purchase Upgrade' : 'Insufficient Funds'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Tab.Panel>

            {/* Available equipment */}
            <Tab.Panel>
              {availableEquipment.length === 0 ? (
                <p style={{ color: 'var(--snes-ink-mute)', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                  No gear available for this venue type.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {availableEquipment.map((equipment) => {
                    const canBuy = store.money >= equipment.purchasePrice;
                    const canRent = store.money >= equipment.rentalPrice;
                    return (
                      <div key={equipment.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', minWidth: 0 }}>
                            <span style={{ color: 'var(--snes-cyan)', lineHeight: 1, marginTop: '1px' }}><PixelIcon name={getEquipmentIcon(equipment.type)} size={20} /></span>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{equipment.name}</h3>
                              <p style={{ fontSize: '12px', color: 'var(--snes-ink-dim)', margin: '5px 0 0', lineHeight: 1.4 }}>{equipment.description}</p>
                              {stars(equipment.quality)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '11px', color: 'var(--snes-green)', letterSpacing: 0 }}>{formatMoney(equipment.purchasePrice)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', marginTop: '3px' }}>rent {formatMoney(equipment.rentalPrice)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)' }}>upkeep {formatMoney(equipment.maintenanceCost)}/t</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {effectChips(equipment.effects)}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handlePurchaseEquipment(equipment.id)} disabled={!canBuy} className={actionBtn(canBuy, 'snes-btn--gold')} style={actionStyle(canBuy)}>
                            Buy
                          </button>
                          <button onClick={() => handleRentEquipment(equipment.id)} disabled={!canRent} className={actionBtn(canRent, 'snes-btn--cyan')} style={actionStyle(canRent)}>
                            Rent for Show
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Tab.Panel>

            {/* Owned equipment */}
            <Tab.Panel>
              {ownedEquipment.length === 0 ? (
                <p style={{ color: 'var(--snes-ink-mute)', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                  No gear owned yet. Buy some from the Gear tab.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ownedEquipment.map((equipment) => {
                    const condColor = equipment.condition > 70 ? 'var(--snes-green)' : equipment.condition > 40 ? 'var(--snes-gold)' : 'var(--snes-red)';
                    return (
                      <div key={equipment.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', minWidth: 0 }}>
                            <span style={{ color: 'var(--snes-cyan)', lineHeight: 1, marginTop: '1px' }}><PixelIcon name={getEquipmentIcon(equipment.type)} size={20} /></span>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="snes-pixel" style={{ fontSize: '10px', color: 'var(--snes-ink)', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{equipment.name}</h3>
                              {stars(equipment.quality)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '8px', color: condColor, letterSpacing: 0 }}>{Math.round(equipment.condition)}%</div>
                            <div style={{ fontSize: '11px', color: 'var(--snes-ink-mute)', marginTop: '3px' }}>upkeep {formatMoney(equipment.maintenanceCost)}/t</div>
                          </div>
                        </div>

                        {/* Live effects — note these scale down as condition drops. */}
                        {effectChips(equipment.effects).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {effectChips(equipment.effects)}
                          </div>
                        )}

                        {/* Condition bar */}
                        <div className="snes-progress" style={{ marginTop: '10px' }}>
                          <div className="snes-progress__fill" style={{ width: `${equipment.condition}%`, background: condColor }} />
                        </div>

                        {equipment.condition < 100 && (
                          <button
                            onClick={() => handleRepairEquipment(equipment.id)}
                            className="snes-btn snes-btn--cyan snes-btn--sm snes-pixel"
                            style={{ width: '100%', minHeight: '44px', marginTop: '10px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Repair
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
