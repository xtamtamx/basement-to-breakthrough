import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@game/types';
import { SATIRICAL_ACHIEVEMENTS } from '@game/data/satiricalText';
import { haptics } from '@utils/mobile';
import { audio } from '@utils/audio';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({ 
  achievement, 
  onDismiss 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShow(true);
      haptics.success();
      audio.play('achievement');

      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  // Get satirical achievement data
  const satiricalData = SATIRICAL_ACHIEVEMENTS[achievement.id.toUpperCase()] || 
    SATIRICAL_ACHIEVEMENTS[Object.keys(SATIRICAL_ACHIEVEMENTS).find(key => 
      key.toLowerCase().includes(achievement.id.toLowerCase())
    ) || ''] || {
      name: achievement.name,
      description: achievement.description
    };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 40px)',
            zIndex: 2000
          }}
          onClick={() => {
            setShow(false);
            setTimeout(onDismiss, 300);
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            border: '3px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 60px rgba(245, 158, 11, 0.3)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Pattern */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(245, 158, 11, 0.5) 10px,
                rgba(245, 158, 11, 0.5) 20px
              )`,
              pointerEvents: 'none'
            }} />

            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{
                position: 'absolute',
                top: '-20px',
                right: '20px',
                width: '60px',
                height: '60px',
                background: '#f59e0b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)'
              }}
            >
              🏆
            </motion.div>

            {/* Header */}
            <div style={{
              marginBottom: '12px',
              paddingRight: '50px'
            }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#f59e0b',
                  marginBottom: '4px'
                }}
              >
                Achievement Unlocked!
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1.2
                }}
              >
                {satiricalData.name}
              </motion.h3>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#d1d5db',
                lineHeight: 1.5
              }}
            >
              {satiricalData.description}
            </motion.p>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: '#f59e0b',
                transformOrigin: 'left'
              }}
            />

            {/* Sparkle Effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0,
                  x: Math.random() * 300 - 150,
                  y: Math.random() * 100 - 50
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  delay: 0.5 + i * 0.1,
                  duration: 1,
                  ease: 'easeOut'
                }}
                style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  pointerEvents: 'none'
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};