import React, { useEffect, useRef } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { useGameStore } from '@stores/gameStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: number;
  graphic: Graphics;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const { phase } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PixiJS application
    const app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      transparent: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    appRef.current = app;
    if (app.view instanceof HTMLCanvasElement) {
      canvasRef.current.appendChild(app.view);
    }

    const particleContainer = new Container();
    app.stage.addChild(particleContainer);

    // Create particles
    const createParticle = (x: number, y: number): Particle => {
      const graphic = new Graphics();
      const colors = [0xe94560, 0x9c27b0, 0x00bcd4, 0xffeb3b, 0x4caf50];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 3 + 1;
      
      graphic.beginFill(color);
      graphic.drawCircle(0, 0, size);
      graphic.endFill();
      
      particleContainer.addChild(graphic);
      
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.5,
        size,
        alpha: Math.random() * 0.5 + 0.5,
        color,
        graphic,
      };
    };

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * app.screen.width;
      const y = Math.random() * app.screen.height;
      particlesRef.current.push(createParticle(x, y));
    }

    // Animation loop
    app.ticker.add(() => {
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Update alpha
        particle.alpha -= 0.005;
        
        // Update graphic
        particle.graphic.x = particle.x;
        particle.graphic.y = particle.y;
        particle.graphic.alpha = particle.alpha;
        
        // Reset particle if it goes off screen or fades out
        if (
          particle.y < -10 || 
          particle.x < -10 || 
          particle.x > app.screen.width + 10 || 
          particle.alpha <= 0
        ) {
          particleContainer.removeChild(particle.graphic);
          const newX = Math.random() * app.screen.width;
          const newY = app.screen.height + 10;
          particlesRef.current[index] = createParticle(newX, newY);
        }
      });
    });

    // Handle resize
    const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (app.view instanceof HTMLCanvasElement && canvasRef.current?.contains(app.view)) {
        canvasRef.current.removeChild(app.view);
      }
      app.destroy(true, true);
    };
  }, []);

  // Add burst effect on phase change
  useEffect(() => {
    if (!appRef.current || phase === 'SETUP') return;

    const app = appRef.current;
    const burstContainer = new Container();
    app.stage.addChild(burstContainer);

    // Create burst particles
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;
    
    for (let i = 0; i < 30; i++) {
      const graphic = new Graphics();
      const color = phase === 'BOOKING' ? 0xe94560 : 0x4caf50;
      
      graphic.beginFill(color);
      graphic.drawCircle(0, 0, Math.random() * 4 + 2);
      graphic.endFill();
      
      graphic.x = centerX;
      graphic.y = centerY;
      
      const angle = (Math.PI * 2 * i) / 30;
      const speed = Math.random() * 5 + 5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      burstContainer.addChild(graphic);
      
      // Animate burst
      let alpha = 1;
      const burstTicker = () => {
        graphic.x += vx;
        graphic.y += vy;
        alpha -= 0.02;
        graphic.alpha = alpha;
        
        if (alpha <= 0) {
          app.ticker.remove(burstTicker);
          burstContainer.removeChild(graphic);
        }
      };
      
      app.ticker.add(burstTicker);
    }

    // Cleanup burst container after animation
    setTimeout(() => {
      app.stage.removeChild(burstContainer);
      burstContainer.destroy();
    }, 2000);
  }, [phase]);

  return (
    <div 
      ref={canvasRef} 
      className="particle-container"
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
};