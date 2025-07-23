import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@stores/gameStore';
import { CityDistrictView } from '../CityDistrictView';
import { walkerSystem } from '@game/mechanics/WalkerSystem';
import { Venue, VenueType, District, VenueUpgrade } from '@game/types';
import { haptics } from '@utils/mobile';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { VENUE_UPGRADES, VENUE_UPGRADE_AVAILABILITY } from '@game/data/venueUpgrades';
import { VENUE_TRAITS } from '@game/data/venueTraits';

export const CityView: React.FC = () => {
  const { venues, districts, money, updateVenues, addVenue } = useGameStore();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [placingVenue, setPlacingVenue] = useState(false);
  const [venueTypeToPlace, setVenueTypeToPlace] = useState<VenueType | null>(null);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [zoomedDistrict, setZoomedDistrict] = useState<District | null>(null);

  // Update walker system
  useEffect(() => {
    const interval = setInterval(() => {
      walkerSystem.update(0.016); // 60fps
    }, 16);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-hide build panel when placing
  useEffect(() => {
    if (placingVenue) {
      setShowBuildPanel(false);
      setCompactMode(true);
    }
  }, [placingVenue]);

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setSelectedDistrict(null);
    setCompactMode(true);
    haptics.light();
  };

  const handleDistrictClick = (district: District) => {
    if (zoomedDistrict?.id === district.id) {
      setZoomedDistrict(null);
    } else {
      setZoomedDistrict(district);
      setSelectedDistrict(district);
    }
    setSelectedVenue(null);
    setCompactMode(true);
    haptics.light();
  };

  const handleBuildVenue = (type: VenueType) => {
    if (money >= getVenueCost(type)) {
      setVenueTypeToPlace(type);
      setPlacingVenue(true);
      haptics.light();
    } else {
      haptics.error();
    }
  };

  const handlePurchaseUpgrade = (upgrade: VenueUpgrade) => {
    if (!selectedVenue || money < upgrade.cost) {
      haptics.error();
      return;
    }

    // Apply upgrade effects
    const updatedVenue = { ...selectedVenue };
    
    // Add upgrade to venue
    if (!updatedVenue.upgrades) {
      updatedVenue.upgrades = [];
    }
    updatedVenue.upgrades.push(upgrade);

    // Apply effects
    if (upgrade.effects.capacity) {
      updatedVenue.capacity += upgrade.effects.capacity;
    }
    if (upgrade.effects.acoustics) {
      updatedVenue.acoustics = Math.min(100, updatedVenue.acoustics + upgrade.effects.acoustics);
    }
    if (upgrade.effects.authenticity) {
      updatedVenue.authenticity = Math.max(0, updatedVenue.authenticity + upgrade.effects.authenticity);
    }
    if (upgrade.effects.atmosphere) {
      updatedVenue.atmosphere = Math.min(100, updatedVenue.atmosphere + upgrade.effects.atmosphere);
    }
    if (upgrade.effects.rent) {
      updatedVenue.rent = Math.max(0, updatedVenue.rent * (100 + upgrade.effects.rent) / 100);
    }
    if (upgrade.effects.unlockTrait) {
      const trait = VENUE_TRAITS[upgrade.effects.unlockTrait];
      if (trait && !updatedVenue.traits.some(t => t.id === trait.id)) {
        updatedVenue.traits.push(trait);
      }
    }

    // Update venue in store
    updateVenues(venues.map(v => v.id === updatedVenue.id ? updatedVenue : v));
    useGameStore.getState().addMoney(-upgrade.cost);
    setSelectedVenue(updatedVenue);
    
    haptics.success();
  };

  const getAvailableUpgrades = (venue: Venue): VenueUpgrade[] => {
    const upgradeIds = VENUE_UPGRADE_AVAILABILITY[venue.type] || [];
    const appliedUpgradeIds = venue.upgrades?.map(u => u.id) || [];
    
    return upgradeIds
      .map(id => VENUE_UPGRADES[id])
      .filter(upgrade => {
        // Not already applied
        if (appliedUpgradeIds.includes(upgrade.id)) return false;
        
        // Check requirements
        if (upgrade.requirements) {
          if (upgrade.requirements.minCapacity && venue.capacity < upgrade.requirements.minCapacity) return false;
          if (upgrade.requirements.minReputation && useGameStore.getState().reputation < upgrade.requirements.minReputation) return false;
          if (upgrade.requirements.venueTypes && !upgrade.requirements.venueTypes.includes(venue.type)) return false;
        }
        
        return true;
      });
  };

  const handlePlaceVenue = (x: number, y: number, district: District) => {
    if (!venueTypeToPlace || !placingVenue) return;
    
    const existingVenue = venues.find(v => v.gridPosition?.x === x && v.gridPosition?.y === y);
    if (existingVenue) {
      haptics.error();
      return;
    }
    
    const cost = getVenueCost(venueTypeToPlace);
    if (money >= cost) {
      const newVenue: Venue = {
        id: `v${Date.now()}`,
        name: `New ${venueTypeToPlace}`,
        type: venueTypeToPlace,
        capacity: getVenueCapacity(venueTypeToPlace),
        acoustics: getVenueAcoustics(venueTypeToPlace),
        authenticity: getVenueAuthenticity(venueTypeToPlace),
        atmosphere: getVenueAtmosphere(venueTypeToPlace),
        modifiers: [],
        location: district,
        rent: getVenueRent(venueTypeToPlace) * district.rentMultiplier,
        equipment: [],
        allowsAllAges: true,
        hasBar: venueTypeToPlace === VenueType.DIVE_BAR || venueTypeToPlace === VenueType.PUNK_CLUB,
        hasSecurity: false,
        hasStage: venueTypeToPlace !== VenueType.BASEMENT && venueTypeToPlace !== VenueType.GARAGE,
        isPermanent: true,
        bookingDifficulty: 3,
        gridPosition: { x, y }
      };
      
      addVenue(newVenue);
      useGameStore.getState().addMoney(-cost);
      setPlacingVenue(false);
      setVenueTypeToPlace(null);
      setCompactMode(false);
      haptics.success();
    }
  };

  const getVenueCapacity = (type: VenueType): number => {
    const capacities: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 30,
      [VenueType.GARAGE]: 45,
      [VenueType.HOUSE_SHOW]: 25,
      [VenueType.DIY_SPACE]: 100,
      [VenueType.DIVE_BAR]: 80,
      [VenueType.PUNK_CLUB]: 150,
      [VenueType.METAL_VENUE]: 200,
      [VenueType.WAREHOUSE]: 150,
      [VenueType.UNDERGROUND]: 120,
      [VenueType.THEATER]: 300,
      [VenueType.CONCERT_HALL]: 500,
      [VenueType.ARENA]: 1000,
      [VenueType.FESTIVAL_GROUNDS]: 5000,
    };
    return capacities[type] || 100;
  };

  const getVenueAcoustics = (type: VenueType): number => {
    const acoustics: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 45,
      [VenueType.GARAGE]: 40,
      [VenueType.HOUSE_SHOW]: 35,
      [VenueType.DIY_SPACE]: 55,
      [VenueType.DIVE_BAR]: 60,
      [VenueType.PUNK_CLUB]: 70,
      [VenueType.METAL_VENUE]: 75,
      [VenueType.WAREHOUSE]: 50,
      [VenueType.UNDERGROUND]: 65,
      [VenueType.THEATER]: 85,
      [VenueType.CONCERT_HALL]: 95,
      [VenueType.ARENA]: 90,
      [VenueType.FESTIVAL_GROUNDS]: 80,
    };
    return acoustics[type] || 50;
  };

  const getVenueAuthenticity = (type: VenueType): number => {
    const authenticity: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 100,
      [VenueType.GARAGE]: 95,
      [VenueType.HOUSE_SHOW]: 95,
      [VenueType.DIY_SPACE]: 85,
      [VenueType.DIVE_BAR]: 75,
      [VenueType.PUNK_CLUB]: 70,
      [VenueType.METAL_VENUE]: 65,
      [VenueType.WAREHOUSE]: 90,
      [VenueType.UNDERGROUND]: 100,
      [VenueType.THEATER]: 40,
      [VenueType.CONCERT_HALL]: 20,
      [VenueType.ARENA]: 10,
      [VenueType.FESTIVAL_GROUNDS]: 50,
    };
    return authenticity[type] || 50;
  };

  const getVenueAtmosphere = (type: VenueType): number => {
    const atmosphere: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 85,
      [VenueType.GARAGE]: 80,
      [VenueType.HOUSE_SHOW]: 90,
      [VenueType.DIY_SPACE]: 90,
      [VenueType.DIVE_BAR]: 70,
      [VenueType.PUNK_CLUB]: 85,
      [VenueType.METAL_VENUE]: 80,
      [VenueType.WAREHOUSE]: 95,
      [VenueType.UNDERGROUND]: 100,
      [VenueType.THEATER]: 60,
      [VenueType.CONCERT_HALL]: 50,
      [VenueType.ARENA]: 40,
      [VenueType.FESTIVAL_GROUNDS]: 75,
    };
    return atmosphere[type] || 70;
  };

  const getVenueRent = (type: VenueType): number => {
    const rents: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 0,
      [VenueType.GARAGE]: 25,
      [VenueType.HOUSE_SHOW]: 0,
      [VenueType.DIY_SPACE]: 75,
      [VenueType.DIVE_BAR]: 150,
      [VenueType.PUNK_CLUB]: 300,
      [VenueType.METAL_VENUE]: 350,
      [VenueType.WAREHOUSE]: 200,
      [VenueType.UNDERGROUND]: 150,
      [VenueType.THEATER]: 500,
      [VenueType.CONCERT_HALL]: 800,
      [VenueType.ARENA]: 1500,
      [VenueType.FESTIVAL_GROUNDS]: 2000,
    };
    return rents[type] || 100;
  };

  const getVenueCost = (type: VenueType): number => {
    const costs: Record<VenueType, number> = {
      [VenueType.BASEMENT]: 0,
      [VenueType.GARAGE]: 50,
      [VenueType.HOUSE_SHOW]: 100,
      [VenueType.DIY_SPACE]: 200,
      [VenueType.DIVE_BAR]: 500,
      [VenueType.PUNK_CLUB]: 1000,
      [VenueType.METAL_VENUE]: 1200,
      [VenueType.WAREHOUSE]: 800,
      [VenueType.UNDERGROUND]: 1500,
      [VenueType.THEATER]: 3000,
      [VenueType.CONCERT_HALL]: 5000,
      [VenueType.ARENA]: 10000,
      [VenueType.FESTIVAL_GROUNDS]: 20000,
    };
    return costs[type] || 1000;
  };

  const availableVenueTypes = [
    { type: VenueType.BASEMENT, name: 'Basement', icon: '🏠', cost: 0 },
    { type: VenueType.GARAGE, name: 'Garage', icon: '🚗', cost: 50 },
    { type: VenueType.DIY_SPACE, name: 'DIY Space', icon: '🎨', cost: 200 },
    { type: VenueType.DIVE_BAR, name: 'Dive Bar', icon: '🍺', cost: 500 },
    { type: VenueType.WAREHOUSE, name: 'Warehouse', icon: '🏭', cost: 800 },
  ];

  return (
    <div className="city-view">
      {/* Main Content */}
      <div className="view-content">
        {/* City Map - Always visible */}
        <div className="city-map-wrapper">
          <AnimatePresence mode="wait">
            <motion.div 
              key={zoomedDistrict?.id || 'full'}
              className="city-map-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="city-scale-wrapper"
                style={{
                  transform: zoomedDistrict ? 'scale(0.9)' : 'scale(0.85)',
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease'
                }}
              >
                <CityDistrictView
                  onVenueClick={handleVenueClick}
                  onDistrictClick={handleDistrictClick}
                  onEmptyCellClick={handlePlaceVenue}
                  placingMode={placingVenue}
                  zoomedDistrict={zoomedDistrict}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Placing Mode Hint */}
          <AnimatePresence>
            {placingVenue && (
              <motion.div
                className="placing-hint"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Placing {venueTypeToPlace} • Click an empty cell • 
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setPlacingVenue(false);
                    setVenueTypeToPlace(null);
                    setCompactMode(false);
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* District Legend */}
        <motion.div
          className="district-legend"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {districts.map(district => (
            <div 
              key={district.id} 
              className={`legend-item ${zoomedDistrict?.id === district.id ? 'active' : ''}`}
              onClick={() => handleDistrictClick(district)}
              style={{ borderColor: district.color }}
            >
              <div className="legend-color" style={{ backgroundColor: district.color }} />
              <span className="legend-name">{district.name}</span>
              {zoomedDistrict?.id === district.id && (
                <span className="zoom-indicator">🔍</span>
              )}
            </div>
          ))}
          {zoomedDistrict && (
            <motion.button
              className="zoom-out-btn"
              onClick={() => {
                setZoomedDistrict(null);
                setSelectedDistrict(null);
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Zoom Out
            </motion.button>
          )}
        </motion.div>

        {/* Quick Actions & District Info */}
        <motion.div
          className="bottom-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* District Info */}
          <AnimatePresence>
            {selectedDistrict && (
              <motion.div 
                className="district-info-inline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{ borderColor: selectedDistrict.color }}
              >
                <div className="info-header">
                  <h3 style={{ color: selectedDistrict.color }}>{selectedDistrict.name}</h3>
                </div>
                <div className="info-stats-vertical">
                  <div className="stat-row">
                    <span className="label">Scene</span>
                    <span className="value success">{selectedDistrict.sceneStrength}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Gentrify</span>
                    <span className="value danger">{selectedDistrict.gentrificationLevel}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Police</span>
                    <span className="value warning">{selectedDistrict.policePresence}%</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Rent ×</span>
                    <span className="value">{selectedDistrict.rentMultiplier}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Build Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowBuildPanel(!showBuildPanel);
              setCompactMode(false);
            }}
            icon="🏗️"
          >
            Build
          </Button>
        </motion.div>

        {/* Dynamic Side Panel */}
        <AnimatePresence>
          {/* Build Panel */}
          {showBuildPanel && !placingVenue && (
            <motion.div
              key="build-panel"
              className="side-panel"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <Card variant="default">
                <div className="panel-header">
                  <h3 className="panel-title">Build Venue</h3>
                  <button 
                    className="close-panel"
                    onClick={() => setShowBuildPanel(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="build-options">
                  {availableVenueTypes.map(vt => (
                    <motion.button
                      key={vt.type}
                      className={`venue-option ${money >= vt.cost ? 'affordable' : 'expensive'}`}
                      disabled={money < vt.cost}
                      onClick={() => handleBuildVenue(vt.type)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="venue-icon">{vt.icon}</span>
                      <div className="venue-info">
                        <span className="venue-name">{vt.name}</span>
                        <span className="venue-cost">${vt.cost}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Selected Venue Info */}
          {selectedVenue && !showBuildPanel && (
            <motion.div
              key="venue-info"
              className="info-panel"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <Card variant="punk" glow className="venue-info-card">
                <div className="venue-header-compact">
                  <div className="venue-icon-small">
                    {selectedVenue.type === VenueType.BASEMENT && '🏠'}
                    {selectedVenue.type === VenueType.GARAGE && '🚗'}
                    {selectedVenue.type === VenueType.DIY_SPACE && '🎨'}
                    {selectedVenue.type === VenueType.DIVE_BAR && '🍺'}
                    {selectedVenue.type === VenueType.WAREHOUSE && '🏭'}
                    {selectedVenue.type === VenueType.UNDERGROUND && '🎸'}
                    {selectedVenue.type === VenueType.THEATER && '🎭'}
                    {selectedVenue.type === VenueType.PUNK_CLUB && '🎸'}
                    {selectedVenue.type === VenueType.METAL_VENUE && '🤘'}
                  </div>
                  <div className="venue-title-section">
                    <h3 className="venue-name">{selectedVenue.name}</h3>
                    <div className="venue-type-label">{selectedVenue.type}</div>
                  </div>
                  <button 
                    className="close-panel"
                    onClick={() => {
                      setSelectedVenue(null);
                      setCompactMode(false);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="stats-row">
                  <div className="stat-mini">
                    <span className="label">Cap</span>
                    <span className="value">{selectedVenue.capacity}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="label">Rent</span>
                    <span className="value">${selectedVenue.rent}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="label">Auth</span>
                    <span className="value">{selectedVenue.authenticity}%</span>
                  </div>
                  <div className="stat-mini">
                    <span className="label">Sound</span>
                    <span className="value">{selectedVenue.acoustics}%</span>
                  </div>
                </div>
                
                {/* Venue Traits */}
                {selectedVenue.traits && selectedVenue.traits.length > 0 && (
                  <div className="venue-traits-section">
                    <h4 className="traits-title">Traits</h4>
                    <div className="venue-traits">
                      {selectedVenue.traits.map(trait => (
                        <span 
                          key={trait.id}
                          className={`trait-badge ${trait.type.toLowerCase()}`}
                          title={trait.description}
                        >
                          {trait.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upgrade Button */}
                <div className="venue-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowUpgradePanel(true);
                      setShowBuildPanel(false);
                    }}
                    icon="🔧"
                  >
                    Upgrade Venue
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Upgrade Panel */}
          {showUpgradePanel && selectedVenue && (
            <>
              <motion.div
                key="upgrade-backdrop"
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpgradePanel(false)}
              />
              <motion.div
                key="upgrade-panel"
                className="upgrade-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
              <div className="upgrade-container">
                <Card variant="punk" className="upgrade-card">
                <div className="panel-header">
                  <h3 className="panel-title">Venue Upgrades</h3>
                  <button 
                    className="close-panel"
                    onClick={() => setShowUpgradePanel(false)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="upgrade-venue-info">
                  <h4>{selectedVenue.name}</h4>
                  <div className="upgrade-stats">
                    <span>Cap: {selectedVenue.capacity}</span>
                    <span>Sound: {selectedVenue.acoustics}%</span>
                    <span>Auth: {selectedVenue.authenticity}%</span>
                  </div>
                </div>
                
                {/* Applied Upgrades */}
                {selectedVenue.upgrades && selectedVenue.upgrades.length > 0 && (
                  <div className="applied-upgrades">
                    <h5>Installed Upgrades</h5>
                    <div className="upgrade-chips">
                      {selectedVenue.upgrades.map(upgrade => (
                        <span key={upgrade.id} className="upgrade-chip">
                          {upgrade.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Available Upgrades */}
                <div className="upgrade-list">
                  {getAvailableUpgrades(selectedVenue).length > 0 ? (
                    getAvailableUpgrades(selectedVenue).map(upgrade => (
                      <motion.div
                        key={upgrade.id}
                        className={`upgrade-option ${money >= upgrade.cost ? 'affordable' : 'expensive'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="upgrade-content">
                          <div className="upgrade-info">
                            <h5>{upgrade.name}</h5>
                            <p className="upgrade-description">{upgrade.description}</p>
                            <div className="upgrade-effects">
                              {upgrade.effects.capacity && (
                                <span className="effect">+{upgrade.effects.capacity} capacity</span>
                              )}
                              {upgrade.effects.acoustics && (
                                <span className="effect">+{upgrade.effects.acoustics}% sound</span>
                              )}
                              {upgrade.effects.authenticity && (
                                <span className="effect">{upgrade.effects.authenticity > 0 ? '+' : ''}{upgrade.effects.authenticity}% auth</span>
                              )}
                              {upgrade.effects.atmosphere && (
                                <span className="effect">+{upgrade.effects.atmosphere}% atmos</span>
                              )}
                              {upgrade.effects.revenue && (
                                <span className="effect">+{upgrade.effects.revenue}% revenue</span>
                              )}
                              {upgrade.effects.rent && (
                                <span className="effect">{upgrade.effects.rent}% rent</span>
                              )}
                              {upgrade.effects.unlockTrait && (
                                <span className="effect trait">Unlocks trait</span>
                              )}
                            </div>
                          </div>
                          <div className="upgrade-purchase">
                            <span className="upgrade-cost">${upgrade.cost}</span>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handlePurchaseUpgrade(upgrade)}
                              disabled={money < upgrade.cost}
                            >
                              Purchase
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="no-upgrades">
                      <p>No upgrades available</p>
                      <span className="hint">Check requirements or unlock more upgrades</span>
                    </div>
                  )}
                </div>
              </Card>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .city-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .bottom-panel {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          z-index: 10;
        }

        .district-info-inline {
          background: var(--bg-card);
          border: 2px solid;
          border-radius: 8px;
          padding: 10px 14px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          min-width: 180px;
        }

        .info-header {
          margin-bottom: 6px;
          text-align: center;
        }

        .info-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .info-stats-vertical {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }

        .stat-row .label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .stat-row .value {
          font-size: 14px;
          font-weight: 700;
        }

        .stat-row .value.success {
          color: var(--success-green);
        }

        .stat-row .value.danger {
          color: var(--metal-red);
        }

        .stat-row .value.warning {
          color: var(--warning-amber);
        }

        .district-legend {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 10;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-secondary);
          border: 1px solid;
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
          opacity: 0.9;
        }

        .legend-item:hover {
          opacity: 1;
          transform: translateX(2px);
        }

        .legend-item.active {
          opacity: 1;
          background: var(--bg-hover);
          transform: translateX(4px);
        }

        .zoom-indicator {
          margin-left: auto;
          font-size: 14px;
        }

        .zoom-out-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg-secondary);
          border: 2px solid var(--punk-magenta);
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--punk-magenta);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 8px;
        }

        .zoom-out-btn:hover {
          background: var(--bg-hover);
          transform: translateX(-4px);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .legend-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .view-content {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .city-map-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 90px 60px 80px 60px;
          position: relative;
          min-height: 0;
          overflow: visible;
        }

        .city-scale-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .city-map-container {
          background: transparent;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placing-hint {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-card);
          border: 2px solid var(--punk-magenta);
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          color: var(--text-secondary);
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }

        .cancel-btn {
          margin-left: 12px;
          background: none;
          border: none;
          color: var(--punk-magenta);
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .side-panel {
          position: absolute;
          right: 20px;
          top: 20px;
          bottom: 20px;
          width: 300px;
        }

        .info-panel {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 400px;
          z-index: 20;
        }

        .venue-info-card {
          background: rgba(20, 20, 20, 0.98) !important;
          backdrop-filter: blur(10px);
          border: 2px solid var(--punk-magenta);
          padding: 16px !important;
        }

        .venue-header-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .venue-icon-small {
          width: 48px;
          height: 48px;
          background: var(--bg-tertiary);
          border: 2px solid var(--punk-magenta);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 24px;
        }

        .venue-title-section {
          flex: 1;
        }

        .venue-title-section .venue-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--punk-magenta);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .venue-type-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-default);
          flex-shrink: 0;
        }

        .panel-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--punk-magenta);
        }

        .close-panel {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .close-panel:hover {
          background: var(--metal-red);
          border-color: var(--metal-red);
          color: white;
        }

        .build-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .venue-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-default);
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .venue-option:hover:not(:disabled) {
          border-color: var(--punk-magenta);
          background: var(--bg-hover);
        }

        .venue-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .venue-option.expensive {
          opacity: 0.6;
        }

        .venue-icon {
          font-size: 24px;
        }

        .venue-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .venue-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .venue-cost {
          font-size: 14px;
          font-weight: 700;
          color: var(--success-green);
        }

        .expensive .venue-cost {
          color: var(--metal-red);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }

        .stat-mini {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          padding: 6px 4px;
          border-radius: 4px;
          text-align: center;
        }

        .stat-mini .label {
          display: block;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .stat-mini .value {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .value.success {
          color: var(--success-green);
        }

        .value.danger {
          color: var(--metal-red);
        }

        .value.warning {
          color: var(--warning-amber);
        }

        .venue-traits-section {
          margin-bottom: 12px;
        }

        .traits-title {
          margin: 0 0 6px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }

        .venue-traits {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .trait-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: help;
        }

        .trait-badge.atmosphere {
          background: rgba(236, 72, 153, 0.2);
          color: var(--punk-magenta);
          border: 1px solid rgba(236, 72, 153, 0.3);
        }

        .trait-badge.technical {
          background: rgba(139, 92, 246, 0.2);
          color: var(--info-purple);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .trait-badge.social {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .trait-badge.legendary {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .venue-actions {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 99;
        }

        .upgrade-panel {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          pointer-events: none;
        }

        .upgrade-container {
          pointer-events: auto;
          width: 100%;
          max-width: 480px;
          max-height: calc(100vh - 40px);
          display: flex;
        }

        .upgrade-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          background: rgba(20, 20, 20, 0.98) !important;
          border: 2px solid var(--punk-magenta) !important;
          padding: 20px !important;
          overflow: hidden;
          max-height: 100%;
        }

        .upgrade-venue-info {
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        .upgrade-venue-info h4 {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: var(--punk-magenta);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .upgrade-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .upgrade-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .applied-upgrades {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
          flex-shrink: 0;
        }

        .applied-upgrades h5 {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .upgrade-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .upgrade-chip {
          padding: 4px 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--success-green);
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--success-green);
        }

        .upgrade-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
          min-height: 0;
        }

        .upgrade-option {
          padding: 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          margin-bottom: 10px;
          transition: all var(--transition-fast);
        }

        .upgrade-option:hover:not(.expensive) {
          border-color: var(--punk-magenta);
          background: var(--bg-tertiary);
          transform: translateY(-1px);
        }

        .upgrade-option.expensive {
          opacity: 0.5;
        }

        .upgrade-content {
          display: flex;
          gap: 16px;
          width: 100%;
        }

        .upgrade-info {
          flex: 1;
        }

        .upgrade-info h5 {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .upgrade-purchase {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .upgrade-cost {
          font-size: 18px;
          font-weight: 700;
          color: var(--success-green);
        }

        .expensive .upgrade-cost {
          color: var(--metal-red);
        }

        .upgrade-purchase .btn {
          padding: 6px 16px !important;
          font-size: 12px !important;
          min-height: 32px !important;
          min-width: auto !important;
        }

        .upgrade-description {
          margin: 0 0 12px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .upgrade-effects {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .upgrade-effects .effect {
          padding: 2px 6px;
          background: var(--bg-primary);
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--success-green);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .upgrade-effects .effect.trait {
          color: var(--warning-amber);
          border-color: rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.1);
        }

        .no-upgrades {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .no-upgrades p {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .no-upgrades .hint {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .upgrade-list::-webkit-scrollbar {
          width: 6px;
        }

        .upgrade-list::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .upgrade-list::-webkit-scrollbar-thumb {
          background: var(--border-light);
          border-radius: 3px;
        }

        .upgrade-list::-webkit-scrollbar-thumb:hover {
          background: var(--punk-magenta);
        }

        @media (max-width: 768px) {
          .side-panel {
            width: calc(100% - 40px);
          }

          .upgrade-panel {
            padding: 10px;
          }

          .upgrade-container {
            max-height: calc(100vh - 20px);
          }

          .upgrade-card {
            padding: 12px !important;
          }

          .upgrade-option {
            padding: 10px;
          }

          .upgrade-content {
            flex-direction: column;
            gap: 12px;
          }

          .upgrade-purchase {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }

          .panel-title {
            font-size: 16px;
          }

          .city-map-wrapper {
            padding: 80px 16px 16px 16px;
          }

          .city-map-container {
            padding: 0;
          }

          .bottom-panel {
            bottom: 10px;
            right: 10px;
            left: 10px;
            align-items: stretch;
          }

          .district-info-inline {
            width: 100%;
          }

          .district-legend {
            top: 10px;
            left: 10px;
          }

          .legend-item {
            padding: 4px 8px;
            font-size: 10px;
          }

          .info-panel {
            bottom: 10px;
            width: 95%;
            max-width: none;
          }

          .venue-info-card {
            padding: 12px !important;
          }

          .stats-row {
            gap: 4px;
          }

          .stat-mini {
            padding: 4px 2px;
          }

          .venue-icon-small {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .venue-title-section .venue-name {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};