import React, { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Band, Venue } from '@game/types';
import { haptics } from '@utils/mobile';
import { equipmentManagerV2 } from '@game/mechanics/EquipmentManagerV2';
import { venueUpgradeManager } from '@game/mechanics/VenueUpgradeManager';

interface Position {
  x: number;
  y: number;
}

interface StackableCardProps {
  id: string;
  type: 'band' | 'venue';
  data: Band | Venue;
  initialPosition: Position;
  onPositionChange: (id: string, position: Position) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, position: Position) => void;
  onDrag?: (id: string, position: Position) => void;
  onStack?: (sourceId: string, targetId: string) => void;
  isDragging?: boolean;
  isStacked?: boolean;
  stackOffset?: number;
  zIndex?: number;
  disabled?: boolean;
}

export const StackableCard: React.FC<StackableCardProps> = ({
  id,
  type,
  data,
  initialPosition,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onDrag,
  onStack,
  isStacked = false,
  stackOffset = 0,
  zIndex = 1,
  disabled = false,
}) => {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [canStack, setCanStack] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  // Update position when initialPosition changes
  useEffect(() => {
    controls.start({
      x: initialPosition.x + (isStacked ? stackOffset * 10 : 0),
      y: initialPosition.y + (isStacked ? stackOffset * 10 : 0),
    });
  }, [initialPosition, isStacked, stackOffset, controls]);

  // Card content based on type
  const renderCardContent = () => {
    if (type === 'band') {
      const band = data as Band;
      return (
        <div className="p-3">
          <h3 className="pixel-text pixel-text-sm mb-1" style={{ color: 'var(--pixel-cyan)' }}>
            {band.name}
          </h3>
          <div className="flex justify-between items-center">
            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
              {band.genre}
            </span>
            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-green)' }}>
              POP: {band.popularity}
            </span>
          </div>
          
          {/* Expanded stats on hover */}
          <motion.div
            initial={false}
            animate={{ height: isHovered ? 'auto' : '24px', opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            {!isHovered ? (
              // Compact view
              <div className="flex gap-2">
                <div className="pixel-badge" style={{ backgroundColor: 'var(--pixel-magenta)' }}>
                  {band.authenticity}% AUTH
                </div>
                <div className="pixel-badge" style={{ backgroundColor: 'var(--pixel-orange)' }}>
                  {band.energy}% ENERGY
                </div>
              </div>
            ) : (
              // Expanded view
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      AUTHENTICITY
                    </p>
                    <div className="pixel-progress-bar h-2">
                      <div className="pixel-progress-fill" 
                        style={{ width: `${band.authenticity}%`, backgroundColor: 'var(--pixel-magenta)' }} 
                      />
                    </div>
                  </div>
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      ENERGY
                    </p>
                    <div className="pixel-progress-bar h-2">
                      <div className="pixel-progress-fill" 
                        style={{ width: `${band.energy}%`, backgroundColor: 'var(--pixel-orange)' }} 
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      TECHNICAL
                    </p>
                    <div className="pixel-progress-bar h-2">
                      <div className="pixel-progress-fill" 
                        style={{ width: `${band.technicalSkill}%`, backgroundColor: 'var(--pixel-cyan)' }} 
                      />
                    </div>
                  </div>
                  <div>
                    <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                      SINCE {band.formedYear || '????'}
                    </p>
                  </div>
                </div>
                {band.traits && band.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {band.traits.slice(0, 2).map((trait, i) => (
                      <span key={i} className="pixel-badge text-xs" 
                        style={{ backgroundColor: 'var(--pixel-purple)', fontSize: '6px' }}
                      >
                        {trait.name.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      );
    } else {
      const venue = data as Venue;
      const equipment = equipmentManagerV2.getVenueEquipment(venue.id);
      const upgradeEffects = venueUpgradeManager.getVenueUpgradeEffects(venue.id);
      const equipmentEffects = equipmentManagerV2.getVenueEquipmentEffects(venue.id);
      
      // Calculate total capacity with bonuses
      const totalCapacity = venue.capacity + 
        (equipmentEffects.capacityBonus || 0) + 
        (upgradeEffects.capacityIncrease || 0);
      
      return (
        <div className="p-3">
          <h3 className="pixel-text pixel-text-sm mb-1" style={{ color: 'var(--pixel-green)' }}>
            {venue.name}
          </h3>
          <div className="flex justify-between items-center">
            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
              CAP: {totalCapacity}
              {(equipmentEffects.capacityBonus || upgradeEffects.capacityIncrease) ? 
                <span style={{ color: 'var(--pixel-cyan)' }}> (+{(equipmentEffects.capacityBonus || 0) + (upgradeEffects.capacityIncrease || 0)})</span> : ''}
            </span>
            <span className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-yellow)' }}>
              ${venue.rent}
            </span>
          </div>
          
          {/* Equipment indicators when not hovering */}
          {!isHovered && equipment.length > 0 && (
            <div className="flex gap-1 mt-2">
              {equipment.slice(0, 3).map((eq, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: eq.quality >= 3 ? 'var(--pixel-purple)' : 
                                   eq.quality >= 2 ? 'var(--pixel-blue)' : 
                                   'var(--pixel-gray)'
                  }}
                />
              ))}
              {equipment.length > 3 && (
                <span className="pixel-text" style={{ fontSize: '8px', color: 'var(--pixel-gray)' }}>
                  +{equipment.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Expanded venue stats on hover */}
          <motion.div
            initial={false}
            animate={{ height: isHovered ? 'auto' : equipment.length > 0 ? '0px' : '16px', opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            {!isHovered ? (
              // Compact view - just atmosphere bar (only if no equipment)
              equipment.length === 0 ? (
                <div className="pixel-progress-bar">
                  <div 
                    className="pixel-progress-fill"
                    style={{ 
                      width: `${venue.atmosphere}%`,
                      backgroundColor: 'var(--pixel-magenta)' 
                    }}
                  />
                </div>
              ) : null
            ) : (
              // Expanded view
              <div className="space-y-2">
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    ATMOSPHERE: {Math.min(100, venue.atmosphere + (upgradeEffects.atmosphereIncrease || 0))}%
                    {upgradeEffects.atmosphereIncrease ? <span style={{ color: 'var(--pixel-cyan)' }}> (+{upgradeEffects.atmosphereIncrease})</span> : ''}
                  </p>
                  <div className="pixel-progress-bar h-2">
                    <div className="pixel-progress-fill" 
                      style={{ width: `${Math.min(100, venue.atmosphere + (upgradeEffects.atmosphereIncrease || 0))}%`, backgroundColor: 'var(--pixel-magenta)' }} 
                    />
                  </div>
                </div>
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    ACOUSTICS: {Math.min(100, venue.acoustics + (equipmentEffects.acousticsBonus || 0) + (upgradeEffects.acousticsIncrease || 0))}%
                    {(equipmentEffects.acousticsBonus || upgradeEffects.acousticsIncrease) ? 
                      <span style={{ color: 'var(--pixel-cyan)' }}> (+{(equipmentEffects.acousticsBonus || 0) + (upgradeEffects.acousticsIncrease || 0)})</span> : ''}
                  </p>
                  <div className="pixel-progress-bar h-2">
                    <div className="pixel-progress-fill" 
                      style={{ width: `${Math.min(100, venue.acoustics + (equipmentEffects.acousticsBonus || 0) + (upgradeEffects.acousticsIncrease || 0))}%`, backgroundColor: 'var(--pixel-cyan)' }} 
                    />
                  </div>
                </div>
                <div>
                  <p className="pixel-text pixel-text-xs" style={{ color: 'var(--pixel-gray)' }}>
                    AUTHENTICITY: {venue.authenticity}%
                  </p>
                  <div className="pixel-progress-bar h-2">
                    <div className="pixel-progress-fill" 
                      style={{ width: `${venue.authenticity}%`, backgroundColor: 'var(--pixel-yellow)' }} 
                    />
                  </div>
                </div>
                
                {/* Equipment Display */}
                {equipment.length > 0 && (
                  <div>
                    <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-gray)' }}>
                      EQUIPMENT:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {equipment.map((eq, i) => (
                        <span key={i} className="pixel-badge" 
                          style={{ 
                            backgroundColor: eq.quality >= 3 ? 'var(--pixel-purple)' : 
                                           eq.quality >= 2 ? 'var(--pixel-blue)' : 
                                           'var(--pixel-gray)',
                            fontSize: '6px' 
                          }}
                        >
                          {eq.type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Venue Upgrades */}
                {upgradeEffects.capacityIncrease && (
                  <div className="pixel-badge" style={{ backgroundColor: 'var(--pixel-purple)', fontSize: '6px' }}>
                    UPGRADED
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {venue.allowsAllAges && (
                    <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-green)', fontSize: '6px' }}>
                      ALL AGES
                    </span>
                  )}
                  {venue.hasBar && (
                    <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-blue)', fontSize: '6px' }}>
                      BAR
                    </span>
                  )}
                  {venue.hasSecurity && (
                    <span className="pixel-badge" style={{ backgroundColor: 'var(--pixel-orange)', fontSize: '6px' }}>
                      SECURITY
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      );
    }
  };

  const handleDragStart = () => {
    setIsDraggingLocal(true);
    haptics.light();
    if (onDragStart) {
      onDragStart(id);
    }
  };

  const handleDrag = () => {
    
    // Call onDrag callback with current position
    if (onDrag && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onDrag(id, { x: rect.left, y: rect.top });
    }
    
    // Check for potential stacking while dragging
    if (cardRef.current && onStack) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const allCards = document.querySelectorAll('[data-card-id]');
      let foundStackTarget = false;
      
      allCards.forEach(card => {
        if (card === cardRef.current) return;
        
        const targetRect = card.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const distance = Math.sqrt(
          Math.pow(centerX - targetCenterX, 2) + 
          Math.pow(centerY - targetCenterY, 2)
        );
        
        if (distance < 100) {
          foundStackTarget = true;
        }
      });
      
      setCanStack(foundStackTarget);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingLocal(false);
    setCanStack(false);
    
    let finalPosition = {
      x: initialPosition.x + info.offset.x,
      y: initialPosition.y + info.offset.y,
    };
    
    // Snap to grid (optional)
    const gridSize = 20;
    finalPosition = {
      x: Math.round(finalPosition.x / gridSize) * gridSize,
      y: Math.round(finalPosition.y / gridSize) * gridSize,
    };
    
    // Check for stacking
    let stacked = false;
    if (onStack && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Find overlapping cards
      const allCards = document.querySelectorAll('[data-card-id]');
      let closestCard: { id: string; distance: number } | null = null;
      
      allCards.forEach(card => {
        if (card === cardRef.current) return;
        
        const targetRect = card.getBoundingClientRect();
        const targetId = card.getAttribute('data-card-id');
        
        if (targetId) {
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const distance = Math.sqrt(
            Math.pow(centerX - targetCenterX, 2) + 
            Math.pow(centerY - targetCenterY, 2)
          );
          
          // Check if close enough to stack (within 100 pixels)
          if (distance < 100) {
            if (!closestCard || distance < closestCard.distance) {
              closestCard = { id: targetId, distance };
            }
          }
        }
      });
      
      if (closestCard) {
        onStack(id, (closestCard as { id: string; distance: number }).id);
        haptics.success();
        stacked = true;
      }
    }
    
    if (!stacked) {
      onPositionChange(id, finalPosition);
    }
    
    if (onDragEnd) {
      onDragEnd(id, finalPosition);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      data-card-id={id}
      className={`
        absolute glass-panel cursor-move transition-all
        ${isDraggingLocal ? 'ring-2 ring-yellow-400' : ''}
        ${isStacked ? 'shadow-lg' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${canStack ? 'ring-2 ring-green-400 animate-pulse' : ''}
      `}
      animate={controls}
      style={{
        zIndex: isDraggingLocal ? 1000 : zIndex,
        width: '200px',
        position: 'absolute',
      }}
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: 0, right: window.innerWidth - 200, top: 0, bottom: window.innerHeight - 150 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={{ 
        scale: disabled ? 1 : 1.02,
        boxShadow: disabled ? undefined : '0 10px 30px rgba(0,0,0,0.3)'
      }}
      whileDrag={{ 
        scale: 1.1, 
        rotate: 5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}
      transition={{ 
        x: { type: 'spring', damping: 25, stiffness: 300 },
        y: { type: 'spring', damping: 25, stiffness: 300 },
        default: { type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }
      }}
      onHoverStart={() => !disabled && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {renderCardContent()}
    </motion.div>
  );
};