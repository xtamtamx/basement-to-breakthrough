import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { EventCard as EventCardType } from '@game/mechanics/EventCardSystem';
import { haptics } from '@utils/mobile';

interface EventCardProps {
  card: EventCardType;
  initialPosition: { x: number; y: number };
  onChoose?: (choiceId: string) => void;
  onDismiss?: () => void;
  disabled?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  card,
  initialPosition,
  onChoose,
  onDismiss,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'var(--pixel-green)';
      case 'crisis': return 'var(--pixel-red)';
      case 'wildcard': return 'var(--pixel-purple)';
      case 'legendary': return 'var(--pixel-yellow)';
      default: return 'var(--pixel-gray)';
    }
  };
  
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return '0 0 20px rgba(255, 255, 255, 0.2)';
      case 'uncommon': return '0 0 30px var(--pixel-green)';
      case 'rare': return '0 0 40px var(--pixel-blue)';
      case 'legendary': return '0 0 60px var(--pixel-purple)';
      default: return 'none';
    }
  };
  
  const getArtStyle = () => {
    switch (card.artStyle) {
      case 'concert_poster':
        return {
          background: `linear-gradient(135deg, #000 0%, ${getTypeColor(card.type)} 100%)`,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
        };
      case 'backstage_pass':
        return {
          background: '#1a1a1a',
          border: '2px dashed var(--pixel-yellow)',
          borderRadius: '0',
        };
      case 'tour_flyer':
        return {
          background: `radial-gradient(circle at top, ${getTypeColor(card.type)} 0%, #000 100%)`,
          transform: 'rotate(-1deg)',
        };
      case 'press_release':
        return {
          background: '#f0f0f0',
          color: '#000',
          fontFamily: 'monospace',
        };
      default:
        return {};
    }
  };
  
  const handleCardClick = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
      haptics.light();
    }
  };
  
  const handleChoice = (choiceId: string) => {
    if (onChoose) {
      haptics.success();
      onChoose(choiceId);
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      className="absolute"
      initial={{ 
        x: initialPosition.x, 
        y: initialPosition.y,
        scale: 0,
        rotate: -180
      }}
      animate={{ 
        x: initialPosition.x, 
        y: initialPosition.y,
        scale: 1,
        rotate: 0
      }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileDrag={{ scale: 1.1, rotate: 5 }}
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => {
        setIsDragging(true);
        haptics.light();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        if (onDismiss) {
          // Check if dragged far enough to dismiss
          if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            if (rect.top < 0 || rect.left < 0 || rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
              onDismiss();
            }
          }
        }
      }}
      style={{
        width: isExpanded ? '300px' : '200px',
        zIndex: isDragging ? 1000 : 500,
        cursor: disabled ? 'not-allowed' : 'move',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="glass-panel relative overflow-hidden"
        style={{
          ...getArtStyle(),
          boxShadow: getRarityGlow(card.rarity),
          border: `2px solid ${getTypeColor(card.type)}`,
        }}
        onClick={handleCardClick}
        animate={{
          scale: [1, 0.98, 1],
          rotate: [0, -1, 1, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {/* Card Header */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <h3 className="pixel-text pixel-text-sm" style={{ color: getTypeColor(card.type) }}>
                  {card.name}
                </h3>
                <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                  {card.type.toUpperCase()} EVENT
                </p>
              </div>
            </div>
            {card.duration !== 'instant' && (
              <div className="pixel-badge" style={{ backgroundColor: getTypeColor(card.type), fontSize: '6px' }}>
                {card.duration.toUpperCase()}
              </div>
            )}
          </div>
          
          <p className="pixel-text pixel-text-xs mb-2" style={{ color: 'var(--pixel-white)' }}>
            {card.description}
          </p>
          
          {/* Flavor text */}
          {card.flavorText && !isExpanded && (
            <p className="pixel-text text-center" style={{ 
              fontSize: '6px', 
              color: 'var(--pixel-gray)', 
              fontStyle: 'italic',
              marginTop: '8px'
            }}>
              "{card.flavorText}"
            </p>
          )}
        </div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-600"
            >
              <div className="p-3">
                {/* Effects */}
                {card.effects.length > 0 && !card.choices && (
                  <div className="mb-3">
                    <p className="pixel-text pixel-text-xs mb-1" style={{ color: 'var(--pixel-yellow)' }}>
                      EFFECTS:
                    </p>
                    {card.effects.map((effect, i) => (
                      <p key={i} className="pixel-text" style={{ fontSize: '8px', color: 'var(--pixel-white)' }}>
                        • {effect.description}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Choices */}
                {card.choices && card.choices.length > 0 && (
                  <div className="space-y-2">
                    {card.choices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoice(choice.id)}
                        className="w-full glass-button p-2 text-left"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: getTypeColor(card.type),
                        }}
                      >
                        <p className="pixel-text pixel-text-xs mb-1" style={{ color: getTypeColor(card.type) }}>
                          {choice.text}
                        </p>
                        {choice.cost && (
                          <p className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-red)' }}>
                            Cost: {choice.cost.amount} {choice.cost.type}
                          </p>
                        )}
                        {choice.effects.map((effect, i) => (
                          <p key={i} className="pixel-text" style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}>
                            → {effect.description}
                          </p>
                        ))}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Dismiss option */}
                {!card.choices && (
                  <button
                    onClick={() => onDismiss && onDismiss()}
                    className="w-full pixel-button p-2 mt-2"
                    style={{ backgroundColor: 'var(--pixel-gray)', fontSize: '10px' }}
                  >
                    ACKNOWLEDGE
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Rarity indicator */}
        <div 
          className="absolute top-0 right-0 pixel-badge"
          style={{ 
            backgroundColor: getTypeColor(card.type),
            borderBottomLeftRadius: '8px',
            fontSize: '6px'
          }}
        >
          {card.rarity.toUpperCase()}
        </div>
        
        {/* Animated background effect for legendary cards */}
        {card.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                'radial-gradient(circle at 20% 80%, transparent 0%, rgba(255, 215, 0, 0.2) 50%, transparent 70%)',
                'radial-gradient(circle at 80% 20%, transparent 0%, rgba(255, 215, 0, 0.2) 50%, transparent 70%)',
                'radial-gradient(circle at 20% 80%, transparent 0%, rgba(255, 215, 0, 0.2) 50%, transparent 70%)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
      
      {/* Drag to dismiss hint */}
      {!isExpanded && !disabled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 1 : 0 }}
          className="pixel-text text-center mt-2"
          style={{ fontSize: '6px', color: 'var(--pixel-gray)' }}
        >
          DRAG OFF SCREEN TO DISMISS
        </motion.p>
      )}
    </motion.div>
  );
};