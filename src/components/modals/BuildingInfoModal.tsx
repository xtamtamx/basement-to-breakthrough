import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Venue, VenueUpgrade, VenueUpgradeType } from '@/game/types';
import { useGameStore } from '@/stores/gameStore';
import { haptics } from '@/utils/mobile';
import { gameAudio } from '@/utils/gameAudio';

interface BuildingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
}

export const BuildingInfoModal: React.FC<BuildingInfoModalProps> = ({
  isOpen,
  onClose,
  venue
}) => {
  const { money, addMoney, venues, updateVenues } = useGameStore();

  useEffect(() => {
    if (isOpen) {
      gameAudio.modalOpen();
    }
  }, [isOpen]);

  if (!venue) return null;

  // Mock upgrades - in a real game these would come from data
  const availableUpgrades: VenueUpgrade[] = [
    {
      id: 'sound_system_1',
      name: 'Basic PA System',
      description: 'Improves sound quality for small shows',
      type: VenueUpgradeType.SOUND_SYSTEM,
      cost: 500,
      requirements: {
        minCapacity: 0,
        minAcoustics: 0
      },
      effects: {
        acoustics: 10,
        atmosphere: 5
      },
      tier: 1
    },
    {
      id: 'capacity_1',
      name: 'Remove Some Chairs',
      description: 'More standing room = more tickets',
      type: VenueUpgradeType.CAPACITY,
      cost: 200,
      requirements: {
        minCapacity: 50
      },
      effects: {
        capacity: 20,
        atmosphere: -5
      },
      tier: 1
    },
    {
      id: 'amenities_1',
      name: 'Install Bar',
      description: 'Alcohol sales boost revenue',
      type: VenueUpgradeType.AMENITIES,
      cost: 1000,
      requirements: {
        minCapacity: 80
      },
      effects: {
        atmosphere: 15,
        rent: 50
      },
      tier: 1
    },
    {
      id: 'sound_system_2',
      name: 'Professional Sound System',
      description: 'Crystal clear audio for demanding bands',
      type: VenueUpgradeType.SOUND_SYSTEM,
      cost: 2000,
      requirements: {
        minCapacity: 100,
        minAcoustics: 60
      },
      effects: {
        acoustics: 25,
        atmosphere: 10
      },
      tier: 2
    },
    {
      id: 'security_1',
      name: 'Hire Security',
      description: 'Reduces incident chance',
      type: VenueUpgradeType.SECURITY,
      cost: 800,
      requirements: {
        minCapacity: 100
      },
      effects: {
        atmosphere: -10,
        authenticity: -15
      },
      tier: 1
    }
  ];

  // Filter upgrades based on requirements
  const getUpgradeStatus = (upgrade: VenueUpgrade) => {
    // Check if already purchased
    if (venue.upgrades?.some(u => u.id === upgrade.id)) {
      return 'purchased';
    }

    // Check requirements
    if (upgrade.requirements) {
      if (upgrade.requirements.minCapacity && venue.capacity < upgrade.requirements.minCapacity) {
        return 'locked';
      }
      if (upgrade.requirements.minAcoustics && venue.acoustics < upgrade.requirements.minAcoustics) {
        return 'locked';
      }
      if (upgrade.requirements.previousUpgrade && 
          !venue.upgrades?.some(u => u.id === upgrade.requirements!.previousUpgrade)) {
        return 'locked';
      }
    }

    // Check if can afford
    if (money < upgrade.cost) {
      return 'unaffordable';
    }

    return 'available';
  };

  const handlePurchaseUpgrade = (upgrade: VenueUpgrade) => {
    const status = getUpgradeStatus(upgrade);
    if (status !== 'available') return;

    // Deduct money
    addMoney(-upgrade.cost);

    // Apply upgrade effects
    const updatedVenue = { ...venue };
    
    if (upgrade.effects.capacity) {
      updatedVenue.capacity += upgrade.effects.capacity;
    }
    if (upgrade.effects.acoustics) {
      updatedVenue.acoustics = Math.min(100, updatedVenue.acoustics + upgrade.effects.acoustics);
    }
    if (upgrade.effects.atmosphere) {
      updatedVenue.atmosphere = Math.max(0, Math.min(100, updatedVenue.atmosphere + upgrade.effects.atmosphere));
    }
    if (upgrade.effects.authenticity) {
      updatedVenue.authenticity = Math.max(0, Math.min(100, updatedVenue.authenticity + upgrade.effects.authenticity));
    }
    if (upgrade.effects.rent) {
      updatedVenue.rent = (updatedVenue.rent || 0) + upgrade.effects.rent;
    }

    // Add upgrade to venue
    updatedVenue.upgrades = [...(updatedVenue.upgrades || []), upgrade];

    // Update venue in store
    const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
    updateVenues(updatedVenues);
    
    haptics.success();
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    left: '10px',
    right: '10px',
    width: 'auto',
    maxWidth: '400px',
    maxHeight: 'calc(100vh - 20px)',
    margin: '0 auto',
    backgroundColor: '#000',
    border: '2px solid #fff',
    boxShadow: '0 0 0 2px #000, 0 0 0 4px #fff',
    fontFamily: 'monospace',
    imageRendering: 'pixelated',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: '#333',
    padding: '8px 12px',
    borderBottom: '2px solid #fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
  };

  const contentStyle: React.CSSProperties = {
    padding: '12px',
    overflowY: 'auto',
    flex: 1,
    backgroundColor: '#111',
    minHeight: 0
  };

  const statBarStyle = (): React.CSSProperties => ({
    position: 'relative',
    width: '100%',
    height: '16px',
    backgroundColor: '#333',
    border: '2px solid #fff',
    marginTop: '4px'
  });

  const statFillStyle = (value: number, color: string): React.CSSProperties => ({
    position: 'absolute',
    left: '0',
    top: '0',
    height: '100%',
    width: `${value}%`,
    backgroundColor: color
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9998
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={headerStyle}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {venue.name}
                </h2>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                  {venue.location.name} • {venue.capacity} CAP • ${venue.rent}/SHOW
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                X
              </button>
            </div>

            {/* Content */}
            <div style={contentStyle}>
              {/* District Info */}
              <div style={{ 
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>DISTRICT</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                  {venue.location.name}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                  Scene: {venue.location.sceneStrength}% • 
                  Gentrification: {venue.location.gentrificationLevel}% • 
                  Police: {venue.location.policePresence}%
                </div>
              </div>

              {/* Stats */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  VENUE STATS
                </h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '12px' }}>
                    <span>ACOUSTICS</span>
                    <span>{venue.acoustics}</span>
                  </div>
                  <div style={statBarStyle(venue.acoustics, '#10b981')}>
                    <div style={statFillStyle(venue.acoustics, '#10b981')} />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '12px' }}>
                    <span>ATMOSPHERE</span>
                    <span>{venue.atmosphere}</span>
                  </div>
                  <div style={statBarStyle(venue.atmosphere, '#3b82f6')}>
                    <div style={statFillStyle(venue.atmosphere, '#3b82f6')} />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '12px' }}>
                    <span>AUTHENTICITY</span>
                    <span>{venue.authenticity}</span>
                  </div>
                  <div style={statBarStyle(venue.authenticity, '#ec4899')}>
                    <div style={statFillStyle(venue.authenticity, '#ec4899')} />
                  </div>
                </div>
              </div>

              {/* Upgrades */}
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  AVAILABLE UPGRADES
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableUpgrades
                    .filter(upgrade => getUpgradeStatus(upgrade) !== 'locked')
                    .map(upgrade => {
                      const status = getUpgradeStatus(upgrade);
                      
                      return (
                        <div
                          key={upgrade.id}
                          style={{
                            border: '2px solid',
                            borderColor: status === 'purchased' ? '#10b981' : 
                                       status === 'unaffordable' ? '#dc2626' : '#fff',
                            backgroundColor: status === 'purchased' ? '#064e3b' : '#222',
                            padding: '12px',
                            opacity: status === 'purchased' ? 0.7 : 1
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                              {upgrade.name}
                              {status === 'purchased' && <span style={{ color: '#10b981', marginLeft: '8px' }}>✓</span>}
                            </div>
                            <div style={{ 
                              color: status === 'unaffordable' ? '#dc2626' : '#10b981',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}>
                              ${upgrade.cost}
                            </div>
                          </div>
                          
                          <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>
                            {upgrade.description}
                          </div>
                          
                          <div style={{ color: '#888', fontSize: '11px' }}>
                            {upgrade.effects.capacity && `CAPACITY +${upgrade.effects.capacity} `}
                            {upgrade.effects.acoustics && `ACOUSTICS +${upgrade.effects.acoustics} `}
                            {upgrade.effects.atmosphere && `ATMOSPHERE ${upgrade.effects.atmosphere > 0 ? '+' : ''}${upgrade.effects.atmosphere} `}
                            {upgrade.effects.authenticity && `AUTHENTICITY ${upgrade.effects.authenticity > 0 ? '+' : ''}${upgrade.effects.authenticity}`}
                          </div>

                          {status === 'available' && (
                            <button
                              onClick={() => handlePurchaseUpgrade(upgrade)}
                              style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: '#10b981',
                                color: '#000',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              PURCHASE
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '2px solid #fff',
              padding: '8px 12px',
              backgroundColor: '#222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ color: '#aaa', fontSize: '11px' }}>
                MONEY: <span style={{ color: '#10b981', fontWeight: 'bold' }}>${money}</span>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CLOSE
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};