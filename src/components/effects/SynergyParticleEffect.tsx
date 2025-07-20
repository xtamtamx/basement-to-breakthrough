import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  icon: string;
}

interface SynergyParticleEffectProps {
  x: number;
  y: number;
  synergyType: 'common' | 'uncommon' | 'rare' | 'legendary';
  icon?: string;
  onComplete?: () => void;
}

export const SynergyParticleEffect: React.FC<SynergyParticleEffectProps> = ({
  x,
  y,
  synergyType,
  icon = '⚡',
  onComplete
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const getColorByRarity = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'var(--pixel-gray)';
      case 'uncommon': return 'var(--pixel-green)';
      case 'rare': return 'var(--pixel-blue)';
      case 'legendary': return 'var(--pixel-purple)';
      default: return 'var(--pixel-white)';
    }
  };
  
  const getParticleCount = (rarity: string) => {
    switch (rarity) {
      case 'common': return 8;
      case 'uncommon': return 12;
      case 'rare': return 16;
      case 'legendary': return 24;
      default: return 8;
    }
  };
  
  useEffect(() => {
    const color = getColorByRarity(synergyType);
    const count = getParticleCount(synergyType);
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: synergyType === 'legendary' ? 12 + Math.random() * 8 : 8 + Math.random() * 4,
        color,
        icon: i % 3 === 0 ? icon : '✨'
      });
    }
    
    setParticles(newParticles);
    
    // Cleanup after animation
    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [x, y, synergyType, icon, onComplete]);
  
  return (
    <div 
      className="fixed pointer-events-none z-[200]"
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 1, 
              scale: 0 
            }}
            animate={{ 
              x: particle.vx * 60,
              y: particle.vy * 60,
              opacity: 0,
              scale: [0, 1.5, 0.5],
              rotate: 720
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.5,
              ease: "easeOut"
            }}
            className="absolute"
            style={{
              fontSize: `${particle.size}px`,
              color: particle.color,
              textShadow: `0 0 10px ${particle.color}`,
              filter: synergyType === 'legendary' ? 'blur(0.5px)' : 'none'
            }}
          >
            {particle.icon}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Central burst effect */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 3, 4],
          opacity: [1, 0.5, 0]
        }}
        transition={{ duration: 1 }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${getColorByRarity(synergyType)} 0%, transparent 70%)`,
          filter: 'blur(10px)'
        }}
      />
      
      {/* Synergy text */}
      <motion.div
        initial={{ scale: 0, y: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          y: -30,
          opacity: [0, 1, 1, 0]
        }}
        transition={{ 
          duration: 2,
          times: [0, 0.2, 0.8, 1]
        }}
        className="absolute -translate-x-1/2 text-center"
        style={{ minWidth: '150px' }}
      >
        <p 
          className="pixel-text pixel-text-sm"
          style={{ 
            color: getColorByRarity(synergyType),
            textShadow: `0 0 20px ${getColorByRarity(synergyType)}`,
            fontSize: synergyType === 'legendary' ? '14px' : '12px'
          }}
        >
          {synergyType.toUpperCase()} SYNERGY!
        </p>
      </motion.div>
    </div>
  );
};