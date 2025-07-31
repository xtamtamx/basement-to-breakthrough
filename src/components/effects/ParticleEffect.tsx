import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  color?: string;
  particleCount?: number;
  duration?: number;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  x,
  y,
  color = "var(--pixel-yellow)",
  particleCount = 8,
  duration = 1000,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = 2 + Math.random() * 2;
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
      });
    }
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [x, y, color, particleCount, duration]);

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: x,
            top: y,
            backgroundColor: particle.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: particle.vx * 50,
            y: particle.vy * 50,
            opacity: 0,
            scale: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 1000, ease: "easeOut" }}
        />
      ))}
    </AnimatePresence>
  );
};
