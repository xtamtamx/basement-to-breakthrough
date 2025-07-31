import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkplaceData } from '@/components/map/MapTypes';
import { useGameStore } from '@/stores/gameStore';
import { haptics } from '@/utils/mobile';

interface WorkplaceUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements?: {
    minReputation?: number;
    minConnections?: number;
  };
  effects: {
    wage?: number;
    stress?: number;
    connections?: number;
  };
}

interface WorkplaceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workplace: WorkplaceData | null;
}

export const WorkplaceInfoModal: React.FC<WorkplaceInfoModalProps> = ({
  isOpen,
  onClose,
  workplace
}) => {
  const { money, reputation, connections, addMoney } = useGameStore();

  devLog.log('WorkplaceInfoModal - isOpen:', isOpen, 'workplace:', workplace);

  if (!workplace) return null;

  // Mock workplace upgrades
  const workplaceUpgrades: Record<string, WorkplaceUpgrade[]> = {
    'record_store': [
      {
        id: 'employee_discount',
        name: 'Employee Discount',
        description: 'Get 20% off all records and merch',
        cost: 100,
        requirements: {
          minConnections: 10
        },
        effects: {
          wage: -2,
          connections: 1
        }
      },
      {
        id: 'flexible_hours',
        name: 'Flexible Schedule',
        description: 'Work around your show schedule',
        cost: 200,
        requirements: {
          minReputation: 20
        },
        effects: {
          stress: -5
        }
      }
    ],
    'coffee_shop': [
      {
        id: 'free_coffee',
        name: 'Free Coffee',
        description: 'Unlimited caffeine to fuel your music',
        cost: 50,
        effects: {
          stress: -3
        }
      },
      {
        id: 'open_mic_host',
        name: 'Open Mic Host',
        description: 'Run the weekly open mic night',
        cost: 300,
        requirements: {
          minReputation: 30
        },
        effects: {
          wage: 5,
          connections: 2
        }
      }
    ],
    'bar': [
      {
        id: 'bartender_training',
        name: 'Bartender Training',
        description: 'Better tips from drunk patrons',
        cost: 150,
        effects: {
          wage: 8
        }
      },
      {
        id: 'bouncer_side_gig',
        name: 'Bouncer Side Gig',
        description: 'Extra cash but more stress',
        cost: 200,
        requirements: {
          minReputation: 25
        },
        effects: {
          wage: 10,
          stress: 10
        }
      }
    ],
    'office': [
      {
        id: 'remote_work',
        name: 'Remote Work Option',
        description: 'Work from home on show days',
        cost: 500,
        requirements: {
          minReputation: 40
        },
        effects: {
          stress: -10
        }
      },
      {
        id: 'promotion',
        name: 'Promotion',
        description: 'More money, more problems',
        cost: 1000,
        requirements: {
          minConnections: 30
        },
        effects: {
          wage: 20,
          stress: 15
        }
      }
    ]
  };

  // Get upgrades for this workplace type (simplified - using name as key)
  const getWorkplaceType = (name: string): string => {
    if (name.toLowerCase().includes('record')) return 'record_store';
    if (name.toLowerCase().includes('coffee')) return 'coffee_shop';
    if (name.toLowerCase().includes('bar')) return 'bar';
    return 'office';
  };

  const workplaceType = getWorkplaceType(workplace.name);
  devLog.log('Workplace type:', workplaceType, 'for name:', workplace.name);
  const availableUpgrades = workplaceUpgrades[workplaceType] || [];

  // Check if upgrade is available
  const getUpgradeStatus = (upgrade: WorkplaceUpgrade) => {
    // Check requirements
    if (upgrade.requirements) {
      if (upgrade.requirements.minReputation && reputation < upgrade.requirements.minReputation) {
        return 'locked';
      }
      if (upgrade.requirements.minConnections && connections < upgrade.requirements.minConnections) {
        return 'locked';
      }
    }

    // Check if can afford
    if (money < upgrade.cost) {
      return 'unaffordable';
    }

    return 'available';
  };

  const handlePurchaseUpgrade = (upgrade: WorkplaceUpgrade) => {
    const status = getUpgradeStatus(upgrade);
    if (status !== 'available') return;

    // Deduct money
    addMoney(-upgrade.cost);
    
    // TODO: Apply upgrade effects to workplace
    // This would need to be implemented in the game store
    
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
    backgroundColor: '#1a4d8f',
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
              <div>
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {workplace.name}
                </h2>
                <div style={{ fontSize: '12px', color: '#aaf', marginTop: '4px' }}>
                  WORKPLACE
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
              {/* Current Stats */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  CURRENT BENEFITS
                </h3>
                
                <div style={{ 
                  backgroundColor: '#222',
                  border: '2px solid #444',
                  padding: '12px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#aaa' }}>WAGE PER TURN</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>${workplace.wage}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>STRESS PER TURN</span>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>+{workplace.stress}</span>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#888',
                  fontStyle: 'italic'
                }}>
                  "Another soul-crushing day job to fund your dreams..."
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
                  CAREER UPGRADES
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
                            borderColor: status === 'unaffordable' ? '#dc2626' : '#3b82f6',
                            backgroundColor: '#1a2b4a',
                            padding: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                              {upgrade.name}
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
                            {upgrade.effects.wage && `WAGE ${upgrade.effects.wage > 0 ? '+' : ''}$${upgrade.effects.wage} `}
                            {upgrade.effects.stress && `STRESS ${upgrade.effects.stress > 0 ? '+' : ''}${upgrade.effects.stress} `}
                            {upgrade.effects.connections && `CONNECTIONS +${upgrade.effects.connections}/TURN`}
                          </div>

                          {status === 'available' && (
                            <button
                              onClick={() => handlePurchaseUpgrade(upgrade)}
                              style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
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
              borderTop: '4px solid #fff',
              padding: '12px 16px',
              backgroundColor: '#1a4d8f',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ color: '#aaf', fontSize: '12px' }}>
                MONEY: <span style={{ color: '#10b981', fontWeight: 'bold' }}>${money}</span>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#2563eb',
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