import React, { useState } from 'react';
import { Venue, EquipmentType } from '@game/types';
import { venueUpgradeSystem } from '@game/mechanics/VenueUpgradeSystem';
import { useGameStore } from '@stores/gameStore';
import { formatMoney } from '@utils/formatters';
import { haptics } from '@utils/mobile';
import { Tab } from '@headlessui/react';
import { X } from 'lucide-react';

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
    style={{ fontSize: '7px', letterSpacing: 0, color, backgroundColor: '#0f0b1e', border: `2px solid ${color}`, padding: '3px 6px' }}
  >
    {label}
  </span>
);

// Every effect an equipment piece carries, as neon chips. Single source of
// truth so the Gear and Owned tabs always show the same (now-live) effects.
const effectChips = (fx: import('@game/types').EquipmentEffects) =>
  [
    fx.acousticsBonus ? chip('acu', `+${fx.acousticsBonus}% acoustics`, '#c77dff') : null,
    fx.atmosphereBonus ? chip('atm', `+${fx.atmosphereBonus}% atmosphere`, '#3ad17e') : null,
    fx.capacityBonus ? chip('cap', `+${fx.capacityBonus}% capacity`, '#4cc9f0') : null,
    fx.reputationMultiplier ? chip('rep', `×${fx.reputationMultiplier} rep`, '#ffd23f') : null,
    fx.passiveIncome ? chip('inc', `+${formatMoney(fx.passiveIncome)}/turn`, '#3ad17e') : null,
    fx.passiveFame ? chip('fame', `+${fx.passiveFame} fans/turn`, '#f72585') : null,
    fx.stressReduction ? chip('str', `−${fx.stressReduction}% band stress`, '#4cc9f0') : null,
    fx.incidentReduction ? chip('inc-red', `−${fx.incidentReduction}% incidents`, '#ff5c57') : null,
  ].filter(Boolean);

// Five-pip quality meter (gold filled / dim empty).
const stars = (quality: number) => (
  <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
    {[...Array(5)].map((_, i) => (
      <span key={i} style={{ fontSize: '9px', color: i < quality ? '#ffd23f' : '#2a2350' }}>★</span>
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

  const getEquipmentIcon = (type: EquipmentType) => {
    switch (type) {
      case EquipmentType.PA_SYSTEM: return '🔊';
      case EquipmentType.LIGHTING: return '💡';
      case EquipmentType.STAGE: return '🎪';
      case EquipmentType.BACKLINE: return '🎸';
      case EquipmentType.RECORDING: return '🎙️';
      default: return '📦';
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
    background: active ? '#f72585' : 'transparent',
    color: active ? '#ffffff' : '#6f6796',
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
            <h2 className="snes-pixel" style={{ fontSize: '12px', color: '#f72585', margin: '0 0 4px', letterSpacing: 0, lineHeight: 1.4 }}>{venue.name}</h2>
            <p style={{ fontSize: '11px', color: '#b9b3d6', margin: 0 }}>Build out the room — gear, capacity, vibe.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1a3a', color: '#b9b3d6', border: '2px solid #0a0814', boxShadow: 'inset 1px 1px 0 #3a2f5c', cursor: 'pointer', borderRadius: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Venue stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
          <span className="snes-chip" style={{ fontSize: '8px', color: '#4cc9f0' }}>CAP {venue.capacity}</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: '#c77dff' }}>ACU {venue.acoustics}%</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: '#3ad17e' }}>ATM {venue.atmosphere}%</span>
          <span className="snes-chip" style={{ fontSize: '8px', color: '#ff5c57' }}>−{formatMoney(upkeepCost)}/turn</span>
        </div>

        <Tab.Group selectedIndex={selectedTab} onChange={(i) => { setSelectedTab(i); haptics.light(); }}>
          <Tab.List
            style={{ display: 'flex', gap: '4px', background: '#0f0b1e', border: '2px solid #0a0814', boxShadow: 'inset 2px 2px 0 0 #3a2f5c, inset -2px -2px 0 0 #0a0814', borderRadius: 0, padding: '3px', marginBottom: '14px' }}
          >
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 0)}>Upgrades {availableUpgrades.length}</Tab>
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 1)}>Gear {availableEquipment.length}</Tab>
            <Tab className="snes-pixel" style={tabStyle(selectedTab === 2)}>Owned {ownedEquipment.length}</Tab>
          </Tab.List>

          <Tab.Panels>
            {/* Upgrades */}
            <Tab.Panel>
              {availableUpgrades.length === 0 ? (
                <p style={{ color: '#6f6796', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
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
                            <h3 className="snes-pixel" style={{ fontSize: '10px', color: '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{upgrade.name}</h3>
                            <p style={{ fontSize: '12px', color: '#b9b3d6', margin: '5px 0 0', lineHeight: 1.4 }}>{upgrade.description}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '9px', color: '#3ad17e', letterSpacing: 0 }}>{formatMoney(upgrade.cost)}</div>
                            {upgrade.upkeepCost ? (
                              <div style={{ fontSize: '11px', color: '#6f6796', marginTop: '3px' }}>+{formatMoney(upgrade.upkeepCost)}/turn</div>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {upgrade.effects.capacity ? chip('cap', `+${upgrade.effects.capacity} cap`, '#4cc9f0') : null}
                          {upgrade.effects.acoustics ? chip('acu', `+${upgrade.effects.acoustics}% acoustics`, '#c77dff') : null}
                          {upgrade.effects.atmosphere ? chip('atm', `+${upgrade.effects.atmosphere}% atmosphere`, '#3ad17e') : null}
                          {upgrade.effects.authenticity ? chip('auth', `${upgrade.effects.authenticity > 0 ? '+' : ''}${upgrade.effects.authenticity}% cred`, upgrade.effects.authenticity > 0 ? '#ffd23f' : '#ff5c57') : null}
                          {upgrade.effects.revenue ? chip('rev', `+${upgrade.effects.revenue}% revenue`, '#3ad17e') : null}
                        </div>

                        <button
                          onClick={() => handleUpgrade(upgrade.id)}
                          disabled={!affordable}
                          className={actionBtn(affordable, 'snes-btn')}
                          style={{ width: '100%', minHeight: '44px', fontSize: '9px', cursor: affordable ? 'pointer' : 'not-allowed' }}
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
                <p style={{ color: '#6f6796', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
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
                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{getEquipmentIcon(equipment.type)}</span>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="snes-pixel" style={{ fontSize: '10px', color: '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{equipment.name}</h3>
                              <p style={{ fontSize: '12px', color: '#b9b3d6', margin: '5px 0 0', lineHeight: 1.4 }}>{equipment.description}</p>
                              {stars(equipment.quality)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '9px', color: '#3ad17e', letterSpacing: 0 }}>{formatMoney(equipment.purchasePrice)}</div>
                            <div style={{ fontSize: '11px', color: '#6f6796', marginTop: '3px' }}>rent {formatMoney(equipment.rentalPrice)}</div>
                            <div style={{ fontSize: '11px', color: '#6f6796' }}>upkeep {formatMoney(equipment.maintenanceCost)}/t</div>
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
                <p style={{ color: '#6f6796', textAlign: 'center', padding: '32px 12px', fontSize: '12px', lineHeight: 1.5 }}>
                  No gear owned yet. Buy some from the Gear tab.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ownedEquipment.map((equipment) => {
                    const condColor = equipment.condition > 70 ? '#3ad17e' : equipment.condition > 40 ? '#ffd23f' : '#ff5c57';
                    return (
                      <div key={equipment.id} className="snes-panel-inset" style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '22px', lineHeight: 1 }}>{getEquipmentIcon(equipment.type)}</span>
                            <div style={{ minWidth: 0 }}>
                              <h3 className="snes-pixel" style={{ fontSize: '10px', color: '#ffffff', margin: 0, letterSpacing: 0, lineHeight: 1.4 }}>{equipment.name}</h3>
                              {stars(equipment.quality)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="snes-pixel" style={{ fontSize: '8px', color: condColor, letterSpacing: 0 }}>{Math.round(equipment.condition)}%</div>
                            <div style={{ fontSize: '11px', color: '#6f6796', marginTop: '3px' }}>upkeep {formatMoney(equipment.maintenanceCost)}/t</div>
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
                            style={{ width: '100%', minHeight: '44px', marginTop: '10px', fontSize: '9px', cursor: 'pointer' }}
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
